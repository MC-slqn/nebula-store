const previous = { secret: process.env.JWT_SECRET, mode: process.env.NODE_ENV }
afterEach(() => {
    if (previous.secret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = previous.secret
    if (previous.mode === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previous.mode
})
test.each([undefined, 'rabbit_token', 'short'])('生产环境拒绝缺失或弱密钥 %p', secret => {
    process.env.NODE_ENV = 'production'
    if (secret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = secret
    expect(() => jest.isolateModules(() => require('../../config'))).toThrow('JWT_SECRET')
})
test('开发环境自动生成非公开随机密钥', () => {
    process.env.NODE_ENV = 'development'
    delete process.env.JWT_SECRET
    let first, second
    jest.isolateModules(() => { first = require('../../config').jwtSecret })
    jest.isolateModules(() => { second = require('../../config').jwtSecret })
    expect(first.length).toBeGreaterThanOrEqual(32)
    expect(first).not.toBe(second)
})
