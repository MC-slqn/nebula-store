const { sendError } = require('../util/errors')
/*
 * 管理员权限校验中间件
 * 说明：token 里只带了 username / u_id，所以这里按 u_id 去数据库核对 role。
 * 以前后台接口只校验"token 有效"，任何登录用户都能改价删商品，这里补上真正的授权。
 *
 * 返回值约定：
 *   管理员         -> 调用 next()，并把角色信息挂到 req.admin 上
 *   未登录(无token) -> HTTP 401
 *   已登录但非管理员 -> HTTP 403，code=403
 * 前端据此区分「请去登录」和「你没有权限」两种情况。
 */
const { dbsql } = require('../model/index')

module.exports = (req, res, next) => {
    //走到这里说明 express-jwt 已经校验过 token，req.data 一定存在
    if (!req.data || !req.data.u_id) {
        return res.status(401).send({ code: 401, message: 'token失效', data: null })
    }

    const sql = `SELECT role, status, username FROM users WHERE u_id=?;`
    dbsql(sql, [req.data.u_id], (err, results) => {
        if (err) {
            return sendError(res, err)
        }
        if (results.length === 0) {
            return res.status(401).send({ code: 401, message: '用户不存在', data: null })
        }
        if (String(results[0].status) === '0') {
            return res.status(403).send({ code: 403, message: '账号已被冻结，无法操作', data: null })
        }
        if (String(results[0].role) !== '1') {
            return res.status(403).send({ code: 403, message: '无权限：仅管理员可操作', data: null })
        }
        req.admin = { u_id: req.data.u_id, username: results[0].username, role: results[0].role }
        return next()
    })
}
