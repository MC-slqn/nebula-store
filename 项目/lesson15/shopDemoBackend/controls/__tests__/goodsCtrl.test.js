// mock dbsql before requiring goodsCtrl
jest.mock('../../model/index', () => ({
    dbsql: jest.fn()
}))

const { dbsql } = require('../../model/index')
const { showGoodsList, showCategory, showGoodsDetails } = require('../goodsCtrl')

describe('goodsCtrl', () => {
    let req, res

    beforeEach(() => {
        req = { query: {}, params: {} }
        res = { send: jest.fn(), status: jest.fn().mockReturnThis() }
        dbsql.mockClear()
    })

    describe('showGoodsList', () => {
        it('should filter by is_delete=1 AND is_sale=1', () => {
            req.query = { page: '1', pageSize: '8' }
            showGoodsList(req, res)

            const sql = dbsql.mock.calls[0][0]
            expect(sql).toContain('is_delete = 1')
            expect(sql).toContain('is_sale = 1')
        })

        it('should pass correct pagination params', () => {
            req.query = { page: '2', pageSize: '10' }
            showGoodsList(req, res)

            const params = dbsql.mock.calls[0][1]
            // 无筛选条件时：offset = (2-1)*10 = 10
            expect(params).toEqual([10, 10])
        })

        it('should return correct data format on success', () => {
            const mockResults = [[{ g_id: 1, goodsname: 'test' }], [{ total: 1 }]]
            dbsql.mockImplementation((sql, params, cb) => cb(null, mockResults))

            req.query = { page: '1', pageSize: '8' }
            showGoodsList(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 200,
                message: null,
                data: { list: mockResults[0], total: 1, page: 1, pageSize: 8 }
            })
        })

        it('should return error on db failure', () => {
            dbsql.mockImplementation((sql, params, cb) => cb(new Error('db error'), null))

            req.query = { page: '1', pageSize: '8' }
            showGoodsList(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 101,
                message: '服务器暂时无法处理请求，请稍后重试',
                requestId: expect.any(String),
                data: null
            })
        })

        // ===== 以下为修复后新增的行为覆盖 =====

        it('非法分页参数应回落到默认值，不能把 NaN/负数传给 SQL', () => {
            req.query = { page: '0', pageSize: 'abc' }
            showGoodsList(req, res)

            const params = dbsql.mock.calls[0][1]
            // page 回落到 1，pageSize 回落到 8 => offset = 0
            expect(params).toEqual([0, 8])
        })

        it('pageSize 超大时应被限制到 100', () => {
            req.query = { page: '1', pageSize: '99999' }
            showGoodsList(req, res)

            const params = dbsql.mock.calls[0][1]
            expect(params).toEqual([0, 100])
        })

        it('maxPrice 筛选应拼进 WHERE 并作为参数传入', () => {
            req.query = { page: '1', pageSize: '50', maxPrice: '0' }
            showGoodsList(req, res)

            const sql = dbsql.mock.calls[0][0]
            const params = dbsql.mock.calls[0][1]
            expect(sql).toContain('price <= ?')
            expect(params).toEqual([0, 0, 50, 0])
        })

        it('c_id 筛选应拼进 WHERE（条件与总数查询共用同一组参数）', () => {
            req.query = { page: '1', pageSize: '8', c_id: '2' }
            showGoodsList(req, res)

            const sql = dbsql.mock.calls[0][0]
            const params = dbsql.mock.calls[0][1]
            expect(sql).toContain('c_id = ?')
            expect(params).toEqual([2, 0, 8, 2])
        })

        it('非法 c_id（abc/0/负数）不应进入 WHERE', () => {
            req.query = { page: '1', pageSize: '8', c_id: 'abc' }
            showGoodsList(req, res)

            expect(dbsql.mock.calls[0][0]).not.toContain('c_id = ?')
        })
    })

    describe('showCategory', () => {
        it('should query category table', () => {
            showCategory(req, res)

            const sql = dbsql.mock.calls[0][0]
            expect(sql).toContain('SELECT * FROM category')
        })

        it('should return data array on success', () => {
            const mockResults = [{ c_id: 1, categoryname: 'Action' }]
            dbsql.mockImplementation((sql, params, cb) => cb(null, mockResults))

            showCategory(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 200,
                message: null,
                data: mockResults
            })
        })
    })

    describe('showGoodsDetails', () => {
        it('should query only visible goods by g_id from params', () => {
            req.params = { id: '42' }
            showGoodsDetails(req, res)

            const sql = dbsql.mock.calls[0][0]
            const params = dbsql.mock.calls[0][1]
            expect(sql).toContain('WHERE g_id=?')
            expect(sql).toContain('is_delete=1')
            expect(sql).toContain('is_sale=1')
            expect(params).toEqual([42])
        })

        it('rejects an invalid goods ID without querying the database', () => {
            req.params = { id: 'not-a-number' }
            showGoodsDetails(req, res)

            expect(dbsql).not.toHaveBeenCalled()
            expect(res.send).toHaveBeenCalledWith({
                code: 102,
                message: '商品ID不合法',
                data: null
            })
        })
    })
})
