// 临时验证脚本（P2：注册校验 / 订单详情软删 / 403 语义 / 后台页面权限）：可回滚
const http = require('http')
const { mysql, dbConfig } = require('./_db')

const db = mysql.createPool(dbConfig)
const q = (sql, p = []) => new Promise((res, rej) => db.query(sql, p, (e, r) => e ? rej(e) : res(r)))
const one = async (sql, p) => (await q(sql, p))[0]

function req(method, path, body, headers = {}, port = 3000) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null
    const opts = { host: '127.0.0.1', port, path, method, headers: { 'Content-Type': 'application/json', ...headers } }
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data)
    const r = http.request(opts, (res) => {
      let out = ''
      res.on('data', (c) => (out += c))
      res.on('end', () => resolve({ status: res.statusCode, body: out }))
    })
    r.on('error', (e) => resolve({ status: 'ERR', body: e.message }))
    if (data) r.write(data)
    r.end()
  })
}
const J = (s) => { try { return JSON.parse(s) } catch { return s } }
let pass = 0, fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✅ ${name}`) }
  else { fail++; console.log(`  ❌ ${name}  →  ${detail}`) }
}
const login = async (u, p) => J((await req('POST', '/login', { username: u, password: p })).body)

let createdUser = null

;(async () => {
  console.log('\n===== 用例 1：注册接口服务端校验（前端校验可绕过）=====')
  const bad = [
    ['密码过短', { username: 'p2test', password: '123', phone: '13900001111' }],
    ['用户名过短', { username: 'a', password: '123456', phone: '13900001111' }],
    ['手机号格式错', { username: 'p2test', password: '123456', phone: '123' }],
    ['手机号含字母', { username: 'p2test', password: '123456', phone: '1390000111a' }],
    ['缺手机号', { username: 'p2test', password: '123456' }],
    ['缺密码', { username: 'p2test', phone: '13900001111' }]
  ]
  for (const [name, payload] of bad) {
    const r = J((await req('POST', '/register', payload)).body)
    check(`${name} → 被拒绝`, r.code === 102, JSON.stringify(r))
  }

  console.log('\n===== 用例 2：合法注册成功，且新用户 role=0（不是管理员）=====')
  const uname = 'p2test_' + Math.floor(Math.random() * 100000)
  const phone = '139' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
  const r2 = J((await req('POST', '/register', { username: uname, password: '123456', phone })).body)
  check('注册成功且返回 u_id', r2.code === 200 && r2.data && r2.data.u_id > 0, JSON.stringify(r2))
  if (r2.data && r2.data.u_id) {
    createdUser = r2.data.u_id
    const row = await one('SELECT username, role, status FROM users WHERE u_id=?', [createdUser])
    check('新用户 role=0、status=1', String(row.role) === '0' && String(row.status) === '1', JSON.stringify(row))
  }
  const loginNew = await login(uname, '123456')
  check('新用户 role=0 且能登录', loginNew.code === 200 && loginNew.data.role === '0', JSON.stringify(loginNew.data))

  console.log('\n===== 用例 3：新用户访问后台 → 403（不是 401）=====')
  const newAuth = { Authorization: 'Bearer ' + loginNew.data.token }
  const r3 = await req('GET', '/admin/goodsList', null, newAuth)
  const b3 = J(r3.body)
  check('HTTP 403', r3.status === 403, `HTTP ${r3.status} | ${r3.body.slice(0, 100)}`)
  check('code=403 且带中文原因', b3.code === 403 && /无权限|仅管理员/.test(b3.message || ''), JSON.stringify(b3))

  console.log('\n===== 用例 4：未登录访问后台 → 401（前端据此跳登录）=====')
  const r4 = await req('GET', '/admin/goodsList')
  check('HTTP 401', r4.status === 401, `HTTP ${r4.status}`)
  check('code=401', J(r4.body).code === 401, r4.body.slice(0, 100))

  console.log('\n===== 用例 5：订单详情对软删除订单返回"不存在" =====')
  const admin = await login('admin', '123456')
  const auth = { Authorization: 'Bearer ' + admin.data.token }
  // 找一个当前可见的订单，软删后应查不到详情，最后还原
  const visible = J((await req('GET', '/orderList', null, auth)).body).data
  if (visible.length > 0) {
    const target = visible[0]
    const before = J((await req('GET', '/orderDetail/' + target.order_id, null, auth)).body)
    check('删除前可以查到详情', before.code === 200 && before.data.goods.length > 0, JSON.stringify(before).slice(0, 120))

    await q("UPDATE orders SET is_delete='0' WHERE order_id=?", [target.order_id])
    const after = J((await req('GET', '/orderDetail/' + target.order_id, null, auth)).body)
    check('软删后详情返回 code=102 订单不存在', after.code === 102, JSON.stringify(after))
    const listAfter = J((await req('GET', '/orderList', null, auth)).body).data
    check('软删后不出现在订单列表', !listAfter.some(o => o.order_id === target.order_id))

    await q("UPDATE orders SET is_delete='1' WHERE order_id=?", [target.order_id])
    const restored = J((await req('GET', '/orderDetail/' + target.order_id, null, auth)).body)
    check('还原后又能查到', restored.code === 200 && restored.data.goods.length > 0)
  } else {
    check('存在可测试订单', false, '订单列表为空')
  }

  console.log('\n===== 用例 6：删掉 multer 后注册接口仍正常（不再是 multipart 依赖）=====')
  const r6 = await req('POST', '/register', { username: 'x', password: '123456', phone: '123' })
  check('注册接口可正常响应（未被中间件报错打断）', r6.status === 200 && J(r6.body).code === 102,
    `HTTP ${r6.status} | ${r6.body.slice(0, 120)}`)
  const r6b = await req('GET', '/goodsList?page=1&pageSize=2')
  check('其他接口正常', r6b.status === 200 && J(r6b.body).code === 200)

  console.log('\n===== 数据还原 =====')
  if (createdUser) await q('DELETE FROM users WHERE u_id=?', [createdUser])
  const counts = await one(`SELECT
    (SELECT COUNT(*) FROM users) users,
    (SELECT COUNT(*) FROM orders) orders,
    (SELECT COUNT(*) FROM order_details) details,
    (SELECT COUNT(*) FROM shopcart) shopcart,
    (SELECT COUNT(*) FROM goods) goods`)
  console.log('  ', JSON.stringify(counts))
  check('用户数回到 3，其余不变',
    counts.users === 3 && counts.orders === 10 && counts.details === 28 && counts.shopcart === 4 && counts.goods === 79,
    JSON.stringify(counts))

  console.log(`\n===== 结果：通过 ${pass} / 失败 ${fail} =====`)
  db.end()
})()
