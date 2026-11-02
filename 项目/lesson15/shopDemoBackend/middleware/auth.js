const { expressjwt } = require('express-jwt')
const { jwtSecret } = require('../config')
const { dbsqlAsync } = require('../model/index')
const { asyncRoute } = require('../util/errors')

const publicRequest = (req) =>
    (req.method === 'GET' && (['/', '/goodsList', '/category', '/bannerList'].includes(req.path) || /^\/goodsDetails\/[^/]+\/?$/.test(req.path))) ||
    (req.method === 'POST' && ['/login', '/register'].includes(req.path))

const verify = expressjwt({ secret: jwtSecret, algorithms: ['HS256'] })
const checkUser = asyncRoute(async (req, res, next) => {
    const id = req.auth?.u_id
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(401).send({ code: 401, message: '登录凭证无效', data: null })
    }
    const users = await dbsqlAsync('SELECT u_id, username, role, status, auth_version FROM users WHERE u_id=?', [id])
    if (!users.length) return res.status(401).send({ code: 401, message: '用户不存在', data: null })
    if (String(users[0].status) !== '1') {
        return res.status(403).send({ code: 403, message: '账号已被冻结', data: null })
    }
    if (Number(req.auth.ver || 0) !== Number(users[0].auth_version)) return res.status(401).send({ code: 401, message: '登录已失效，请重新登录', data: null })
    req.data = users[0]
    next()
})

module.exports = (req, res, next) => {
    if (publicRequest(req)) return next()
    verify(req, res, err => err ? next(err) : checkUser(req, res, next))
}
