const parseOrder = require('../../util/orderInput')
const { asyncRoute, sendError } = require('../../util/errors')
const valid = { recipient: '用户', phone: '13912345678', address: '地址', request_key: '1234567890abcdef', goods: [{ g_id: 1, num: 1 }] }

test.each([null, true, '1', [], {}])('拒绝异常商品项 %p', item => {
    expect(() => parseOrder({ ...valid, goods: [item] })).toThrow()
})
test('合并后数量也不能超过 99', () => {
    expect(() => parseOrder({ ...valid, goods: [{ g_id: 1, num: 60 }, { g_id: 1, num: 40 }] })).toThrow('99')
})
test('商品顺序不影响幂等内容指纹', () => {
    const goods = [{ g_id: 3, num: 2 }, { g_id: 1, num: 1 }]
    expect(parseOrder({ ...valid, goods }).hash).toBe(parseOrder({ ...valid, goods: [...goods].reverse() }).hash)
})
test('同步抛错和异步拒绝均交给 Express 错误处理', async () => {
    const next = jest.fn()
    const failure = new Error('failure')
    await asyncRoute(() => { throw failure })({}, {}, next)
    await asyncRoute(async () => { throw failure })({}, {}, next)
    expect(next.mock.calls).toEqual([[failure], [failure]])
})
test('数据库错误只返回通用消息及请求编号', () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    const res = { locals: { requestId: 'test-request' }, status: jest.fn().mockReturnThis(), send: jest.fn() }
    sendError(res, new Error('SELECT secret FROM private_table'))
    expect(res.status).toHaveBeenCalledWith(500)
    expect(JSON.stringify(res.send.mock.calls)).not.toContain('private_table')
    expect(res.send.mock.calls[0][0].requestId).toBe('test-request')
    log.mockRestore()
})
