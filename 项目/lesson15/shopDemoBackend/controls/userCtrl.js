const { sendError } = require('../util/errors')
//控制层 --用户
/*
 * 密码存储说明（重要）：
 * 以前 password 是明文存库，登录直接用 `WHERE username=? AND password=?` 匹配。
 * 现在改为 bcrypt 哈希：
 *   - 注册：bcrypt.hash(明文, 10) 后入库，数据库里不再出现明文
 *   - 登录：先按 username 取出哈希，再用 bcrypt.compare 比对
 * bcrypt 每次加盐结果都不同，所以**不可能**再用 SQL 等值匹配密码。
 * 历史数据由 scripts/migrate-passwords.js 一次性迁移。
 */
const bcrypt = require('bcrypt')
const { dbsqlAsync } = require('../model/index')
const { setToken } = require('../util/token')

// bcrypt 哈希的格式前缀，用来判断一条密码是否已经迁移过
const BCRYPT_RE = /^\$2[aby]?\$\d{2}\$/
// 加盐轮数：10 是安全与耗时的常用平衡点（约 50~100ms/次）
const SALT_ROUNDS = 10

// 给迁移脚本复用，保证"是否已哈希"的判断只有一处定义
exports.isHashed = (pwd) => BCRYPT_RE.test(String(pwd || ''))

//登录
exports.doLogin = async (req, res) => {
    let { username, password, remember } = req.body || {}
    if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).send({ code: 102, message: '用户名和密码格式不正确', data: null })
    username = username.trim()
    if (!username || !password) {
        return res.send({ code: 102, message: '用户名和密码不能为空', data: null })
    }

    try {
        const results = await dbsqlAsync(`SELECT * FROM users WHERE username=?;`, [username])

        // 用户不存在和密码错误返回同一句提示，避免暴露"这个用户名是否注册过"
        const matched = results.length > 0 &&
            await bcrypt.compare(String(password), String(results[0].password))
        if (!matched) {
            return res.send({ code: 102, message: '用户名或者密码错误', data: null })
        }

        // 是否冻结（status 的值为 0，表示冻结）
        if (String(results[0].status) === '0') {
            return res.send({ code: 102, message: '用户被冻结，请稍微再试', data: null })
        }

        //登录成功--》存储登录信息---》生成token
        //remember 由前端"保持登录状态"复选框传入，勾选后 token 有效期更长
        let token = setToken(results[0].username, results[0].u_id, remember === true, results[0].auth_version || 0)
        let user = results[0].username //页面显示
        //把角色一起返回给前端，前端据此决定是否显示"控制台"入口
        let role = String(results[0].role || '0')
        //解析出过期时间返回给前端，便于前端判断登录态是否已失效
        let exp = null
        try {
            exp = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).exp || null
        } catch (e) {
            exp = null
        }
        return res.send({ code: 200, message: '登录成功', data: { token: token, username: user, role: role, exp: exp } })
    } catch (err) {
        return sendError(res, err)
    }
}

//注册
exports.doReg = async (req, res) => {
    //因为使用用户名和密码登录，所以要求用户名唯一
    let { username, password, phone } = req.body || {}
    if ([username, password, phone].some(v => typeof v !== 'string')) return res.status(400).send({ code: 102, message: '注册信息格式不正确', data: null })
    username = username.trim()

    //服务端校验：前端校验可以绕过，这里必须再兜一层
    if (!username || !password || !phone) {
        return res.send({ code: 102, message: '用户名 / 密码 / 手机号均不能为空', data: null })
    }
    if (String(username).length < 2 || String(username).length > 20) {
        return res.send({ code: 102, message: '用户名长度需在 2~20 个字符之间', data: null })
    }
    if (String(password).length < 6 || String(password).length > 20) {
        return res.send({ code: 102, message: '密码长度需在 6~20 个字符之间', data: null })
    }
    if (!/^1[3-9]\d{9}$/.test(String(phone))) {
        return res.send({ code: 102, message: '手机号格式不正确', data: null })
    }

    try {
        const results = await dbsqlAsync(
            `SELECT * FROM users WHERE username=?;
             SELECT * FROM users WHERE phone=?;`,
            [username, phone]
        )
        if (results[0].length > 0) {
            return res.send({ code: 102, message: '用户名已经被占用', data: null })
        }
        if (results[1].length > 0) {
            return res.send({ code: 102, message: '电话已经注册了', data: null })
        }

        //入库前先哈希：数据库里从头到尾不出现明文密码
        const hashed = await bcrypt.hash(String(password), SALT_ROUNDS)
        //新增数据（role 显式写入 '0'，新用户一律是普通用户）
        const results2 = await dbsqlAsync(
            `INSERT INTO users(username,password,phone,status,role) VALUES(?,?,?,'1','0');`,
            [username, hashed, phone]
        )
        return res.send({ code: 200, message: '注册成功，去登录吧', data: { u_id: results2.insertId } })
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.send({ code: 102, message: '用户名或手机号已被注册', data: null })
        return sendError(res, err)
    }
}
