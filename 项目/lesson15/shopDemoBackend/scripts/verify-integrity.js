// 在独立临时数据库运行真实 HTTP/MySQL 回归；finally 只清理本脚本创建的库。
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { randomBytes, randomUUID } = require('node:crypto')
const database = `nebula_test_${Date.now()}_${randomBytes(4).toString('hex')}`
process.env.DB_NAME = database
const mysql = require('mysql')
const { db, jwtSecret } = require('../config')
const connection = mysql.createConnection({ ...db, database: undefined, multipleStatements: true })
const q = (sql, params = []) => new Promise((resolve, reject) => connection.query(sql, params, (e, rows) => e ? reject(e) : resolve(rows)))
const { pool } = require('../model')
const { migrate } = require('./migrate-integrity')
const jwt = require('jsonwebtoken')
let server, checks = 0, created = false
const check = (condition, label) => { assert.ok(condition, label); checks++; console.log(`PASS ${label}`) }

async function run() {
    assert.match(database, /^nebula_test_\d+_[a-f0-9]{8}$/)
    // 使用仓库旧表结构验证迁移，且不连接用户业务库。
    const source = fs.readFileSync(path.join(__dirname, '../db/vue-demo12.sql'), 'utf8')
        .split('-- 数据一致性升级')[0].replaceAll('`vue-demo12`', `\`${database}\``)
    await q(`CREATE DATABASE \`${database}\``)
    created = true
    await q(source)
    await migrate()
    await migrate()
    check(true, '旧结构迁移和重复迁移均成功')
    const category = (await q('SELECT c_id FROM category LIMIT 1'))[0].c_id
    const user = (await q("INSERT INTO users(username,password,phone) VALUES('integrity_user','unused','13912345678')")).insertId
    const other = (await q("INSERT INTO users(username,password,phone) VALUES('integrity_other','unused','13912345679')")).insertId
    const admin = (await q("SELECT u_id FROM users WHERE role='1' LIMIT 1"))[0].u_id
    const good = (await q('INSERT INTO goods(goodsname,price,stock,c_id) VALUES(?,?,?,?)', ['integrity game', '10.10', 300, category])).insertId
    const free = (await q('INSERT INTO goods(goodsname,price,stock,c_id) VALUES(?,?,?,?)', ['free integrity game', 0, 1, category])).insertId
    const app = require('../app')
    await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve) })
    const url = `http://127.0.0.1:${server.address().port}`
    const token = id => jwt.sign({ u_id: id }, jwtSecret, { expiresIn: '1h' })
    const api = async (endpoint, body, id = user, rawToken) => {
        const response = await fetch(url + endpoint, {
            method: body === undefined ? 'GET' : 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rawToken || token(id)}` },
            body: body === undefined ? undefined : JSON.stringify(body)
        })
        return { status: response.status, ...await response.json() }
    }
    const payload = { recipient: '测试用户', phone: '13912345678', address: '测试地址', goods: [{ g_id: good, num: 2 }], request_key: randomUUID() }
    const duplicate = await Promise.all([api('/addOrder', payload), api('/addOrder', payload)])
    check(duplicate.every(r => r.code === 200) && duplicate[0].data.order_id === duplicate[1].data.order_id, '并发重复提交返回同一订单')
    check((await q('SELECT stock FROM goods WHERE g_id=?', [good]))[0].stock === 298, '并发请求只扣一次库存')
    check((await api('/addOrder', { ...payload, address: '另一地址' })).status === 409, '同一请求编号不能用于不同内容')
    await q('UPDATE goods SET price=99, goodsname=?, version=version+1 WHERE g_id=?', ['changed game', good])
    const detail = await api('/orderDetail/' + duplicate[0].data.order_id)
    check(Number(detail.data.totalprice) === 20.2 && Number(detail.data.goods[0].price) === 10.1 && detail.data.goods[0].goodsname === 'integrity game', '改价改名不改变历史订单快照')
    const orders = await api('/orderList')
    check(Number(orders.data[0].goods[0].price) === 10.1, '订单列表也使用成交价格')
    for (const goods of [[null], [true], [{ g_id: good, num: 100 }], [{ g_id: good, num: 60 }, { g_id: good, num: 40 }]]) {
        check((await api('/addOrder', { ...payload, goods, request_key: randomUUID() })).status === 400, '拒绝异常商品或超限数量')
    }
    const before = (await q('SELECT COUNT(*) AS n FROM orders'))[0].n
    const failed = await api('/addOrder', { ...payload, request_key: randomUUID(), goods: [{ g_id: good, num: 1 }, { g_id: 2147483647, num: 1 }] })
    check(failed.status === 400 && (await q('SELECT COUNT(*) AS n FROM orders'))[0].n === before && (await q('SELECT stock FROM goods WHERE g_id=?', [good]))[0].stock === 298, '后续商品失败时整单及库存回滚')
    check((await api('/admin/updateGoods', { g_id: good, stock: 300, version: 0 }, admin)).code !== 200, '拒绝旧库存版本覆盖')
    check((await api('/admin/updateGoods', { g_id: good, goodsname: 'new name' }, admin)).code === 200 && (await q('SELECT stock FROM goods WHERE g_id=?', [good]))[0].stock === 298, '仅改名称保留最新库存')
    const version = (await q('SELECT version FROM goods WHERE g_id=?', [good]))[0].version
    check((await api('/admin/updateGoods', { g_id: good, stock: 300, version }, admin)).code === 200, '最新版本可调整库存')
    check((await api('/addCart', { g_id: good, num: 99 })).code === 200, '购物车接受 99 件')
    check((await api('/addCart', { g_id: good, num: 1 })).status === 400, '累计 100 件被拒绝')
    const oldToken = token(user)
    await q("UPDATE users SET status='0' WHERE u_id=?", [user])
    for (const endpoint of ['/shopcartList', '/orderList', '/myGames']) check((await api(endpoint, undefined, user, oldToken)).status === 403, '冻结用户的旧 token 被拒绝：' + endpoint)
    check((await api('/addOrder', { ...payload, request_key: randomUUID() }, user, oldToken)).status === 403, '冻结用户不能下单')
    await q("UPDATE users SET status='1' WHERE u_id=?", [user])
    const expired = jwt.sign({ u_id: user }, jwtSecret, { expiresIn: -1 })
    check((await api('/category', undefined, user, expired)).code === 200, '公开接口忽略过期 token')
    check((await api('/shopcartList', undefined, user, expired)).status === 401, '保护接口拒绝过期 token')
    const registration = { username: 'parallel_register', password: '123456ab', phone: '13912345670' }
    const registrations = await Promise.all([api('/register', registration, user, expired), api('/register', registration, user, expired)])
    check(registrations.filter(r => r.code === 200).length === 1 && registrations.filter(r => r.code === 102).length === 1, '并发注册只有一条记录且不泄露数据库错误')
    const claims = await Promise.all([api('/claimGame', { g_id: free }), api('/claimGame', { g_id: free })])
    check(claims.every(r => r.code === 200) && (await q('SELECT COUNT(*) AS n FROM user_games WHERE u_id=? AND g_id=?', [user, free]))[0].n === 1, '并发免费领取只创建一条记录')
    check((await api('/myGames')).data.length === 1 && (await api('/myGames', undefined, other)).data.length === 0, '游戏库持久化且按用户隔离')
    check((await api('/claimGame', { g_id: good })).status === 400, '付费游戏不能免费领取')
    check((await api('/orderDetail/' + duplicate[0].data.order_id, undefined, other)).code === 102, '他人不能读取订单')

    const account = { username: 'profile_tester', password: 'oldPass123', phone: '13911112222' }
    const registered = await api('/register', account)
    const profileId = registered.data.u_id
    const login = await api('/login', account)
    const profileToken = login.data.token
    const profileApi = (route, body) => api(route, body, profileId, profileToken)
    const myProfile = await profileApi('/profile')
    check(myProfile.code === 200 && myProfile.data.username === account.username && !('password' in myProfile.data) && !('auth_version' in myProfile.data), '个人资料只返回公开字段')
    check((await profileApi('/profile', { username: 'profile_new', phone: '13911112223', role: '1' })).status === 400, '资料接口拒绝权限字段注入')
    check((await profileApi('/profile', { username: 'a', phone: '123' })).status === 400, '拒绝非法个人资料')
    check((await profileApi('/profile', { username: 'integrity_user', phone: '13911112223' })).status === 409, '拒绝重复用户名')
    check((await profileApi('/profile', { username: 'profile_new', phone: '13912345678' })).status === 409, '拒绝重复手机号')
    check((await profileApi('/profile', { username: 'profile_new', phone: '13911112223' })).code === 200, '保存用户名和手机号')
    check((await api('/login', { username: 'profile_new', password: account.password })).code === 200, '新用户名可以登录')
    const change = { currentPassword: account.password, newPassword: 'newPass456', confirmPassword: 'newPass456' }
    for (const body of [{ ...change, currentPassword: 'wrong' }, { ...change, confirmPassword: 'different' }, { ...change, newPassword: 'abc', confirmPassword: 'abc' }, { ...change, newPassword: account.password, confirmPassword: account.password }]) {
        check((await profileApi('/changePassword', body)).status === 400, '密码校验失败时不更新')
    }
    const passwordChanges = await Promise.all([profileApi('/changePassword', change), profileApi('/changePassword', change)])
    check(passwordChanges.filter(r => r.code === 200).length === 1, '并发修改密码只允许一次成功')
    check((await profileApi('/profile')).status === 401, '密码修改后旧 token 立即失效')
    check((await api('/login', { username: 'profile_new', password: account.password })).code !== 200, '旧密码不能登录')
    const newLogin = await api('/login', { username: 'profile_new', password: change.newPassword })
    check(newLogin.code === 200 && (await api('/profile', undefined, profileId, newLogin.data.token)).code === 200, '新密码登录后可访问资料')
    check((await api('/profile', undefined, other)).data.username === 'integrity_other', '修改资料不影响其他用户')
    console.log(`完成 ${checks} 项真实 HTTP / MySQL 检查`)
}

run().catch(err => { console.error(err); process.exitCode = 1 }).finally(async () => {
    if (server) await new Promise(resolve => { server.close(resolve); server.closeAllConnections() })
    await new Promise(resolve => pool.end(resolve))
    if (created && /^nebula_test_\d+_[a-f0-9]{8}$/.test(database)) await q(`DROP DATABASE \`${database}\``)
    connection.end()
})
