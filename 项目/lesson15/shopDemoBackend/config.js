/*
 * 统一配置：所有敏感值集中在此处，避免像之前那样 JWT 密钥在 app.js 与 util/token.js 里各写一份。
 * 支持用环境变量覆盖（不引入 dotenv，保持离线可跑）：
 *   DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME / JWT_SECRET / JWT_EXPIRES_IN
 */
const configuredSecret = process.env.JWT_SECRET
if (process.env.NODE_ENV === 'production' && (!configuredSecret || Buffer.byteLength(configuredSecret) < 32 || configuredSecret === 'rabbit_token')) {
    throw new Error('生产环境必须设置至少 32 字节的随机 JWT_SECRET')
}
// 开发环境未配置时每次启动生成新密钥，重启后需重新登录。
const jwtSecret = configuredSecret || require('crypto').randomBytes(48).toString('hex')
module.exports = {
    db: {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '123456',
        database: process.env.DB_NAME || 'vue-demo12'
    },
    // token 签名密钥：只此一份，app.js 与 util/token.js 都从这里取
    jwtSecret,
    // 默认有效期（未勾选"保持登录状态"时）
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    // 勾选"保持登录状态"时的有效期
    jwtExpiresInRemember: process.env.JWT_EXPIRES_IN_REMEMBER || '7d'
}
