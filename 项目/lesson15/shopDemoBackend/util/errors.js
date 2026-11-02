const { randomUUID } = require('crypto')

class BusinessError extends Error {
    constructor(message, status = 400) {
        super(message)
        this.status = status
    }
}

const sendError = (res, err) => {
    if (err instanceof BusinessError) {
        return res.status(err.status).send({ code: 102, message: err.message, data: null })
    }
    const requestId = res.locals?.requestId || randomUUID()
    console.error(`[${requestId}]`, err)
    return res.status(500).send({ code: 101, message: '服务器暂时无法处理请求，请稍后重试', data: null, requestId })
}

const asyncRoute = (handler) => (req, res, next) =>
    Promise.resolve().then(() => handler(req, res, next)).catch(next)

module.exports = { BusinessError, sendError, asyncRoute }
