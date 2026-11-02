const bcrypt = require('bcrypt')
const { dbsqlAsync, transaction } = require('../model')
const { BusinessError } = require('../util/errors')
const publicUser = u => ({ u_id: u.u_id, username: u.username, phone: u.phone, role: u.role, status: u.status })
function validateBody(body, fields) {
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !fields.includes(k))) throw new BusinessError('请求参数不正确')
}
async function lockedUser(req, q) {
    const rows = await q('SELECT * FROM users WHERE u_id=? FOR UPDATE', [req.data.u_id])
    if (!rows.length || Number(rows[0].auth_version) !== Number(req.auth.ver || 0)) throw new BusinessError('登录已失效，请重新登录', 401)
    if (String(rows[0].status) !== '1') throw new BusinessError('账号已被冻结', 403)
    return rows[0]
}
exports.getProfile = async (req, res) => {
    const rows = await dbsqlAsync('SELECT u_id,username,phone,role,status FROM users WHERE u_id=?', [req.data.u_id])
    if (!rows.length) throw new BusinessError('用户不存在', 401)
    res.set('Cache-Control', 'no-store')
    res.send({ code: 200, message: '', data: publicUser(rows[0]) })
}
exports.updateProfile = async (req, res) => {
    validateBody(req.body, ['username', 'phone'])
    const { username, phone } = req.body
    if (typeof username !== 'string' || !/^\S{2,20}$/u.test(username.trim())) throw new BusinessError('用户名需为 2~20 个非空白字符')
    if (typeof phone !== 'string' || !/^1[3-9]\d{9}$/.test(phone.trim())) throw new BusinessError('手机号格式不正确')
    try {
        const data = await transaction(async (conn, q) => {
            const user = await lockedUser(req, q)
            await q('UPDATE users SET username=?,phone=? WHERE u_id=?', [username.trim(), phone.trim(), user.u_id])
            return publicUser({ ...user, username: username.trim(), phone: phone.trim() })
        })
        res.send({ code: 200, message: '个人资料已更新', data })
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') throw new BusinessError('用户名或手机号已被使用', 409)
        throw err
    }
}
exports.changePassword = async (req, res) => {
    validateBody(req.body, ['currentPassword', 'newPassword', 'confirmPassword'])
    const { currentPassword, newPassword, confirmPassword } = req.body
    if (typeof currentPassword !== 'string' || !currentPassword || currentPassword.length > 200) throw new BusinessError('请输入当前密码')
    if (typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 20) throw new BusinessError('新密码长度需在 6~20 个字符之间')
    if (newPassword !== confirmPassword) throw new BusinessError('两次新密码不一致')
    await transaction(async (conn, q) => {
        const user = await lockedUser(req, q)
        if (!await bcrypt.compare(currentPassword, user.password)) throw new BusinessError('当前密码不正确')
        if (await bcrypt.compare(newPassword, user.password)) throw new BusinessError('新密码不能与当前密码相同')
        const hash = await bcrypt.hash(newPassword, 10)
        await q('UPDATE users SET password=?,auth_version=auth_version+1 WHERE u_id=?', [hash, user.u_id])
    })
    res.send({ code: 200, message: '密码已更新，请重新登录', data: null })
}
