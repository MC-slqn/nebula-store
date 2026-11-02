jest.mock('../../model/index', () => ({
    dbsql: jest.fn()
}))

const { dbsql } = require('../../model/index')
const { adminGetGoodsList, adminAddGoods, adminUpdateGoods, adminDeleteGoods } = require('../adminGoodsCtrl')

describe('adminGoodsCtrl', () => {
    let req, res

    beforeEach(() => {
        req = { body: {} }
        res = { send: jest.fn(), status: jest.fn().mockReturnThis() }
        dbsql.mockClear()
    })

    describe('adminGetGoodsList', () => {
        it('should query goods with is_delete=1 ORDER BY stock ASC', () => {
            adminGetGoodsList(req, res)

            const sql = dbsql.mock.calls[0][0]
            expect(sql).toContain('WHERE is_delete = 1')
            expect(sql).toContain('ORDER BY stock ASC')
        })

        it('should return data on success', () => {
            const mockResults = [{ g_id: 1, goodsname: 'test' }]
            dbsql.mockImplementation((sql, params, cb) => cb(null, mockResults))

            adminGetGoodsList(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 200,
                message: '获取成功',
                data: mockResults
            })
        })
    })

    describe('adminAddGoods', () => {
        it('should INSERT with is_delete=1 and correct fields', () => {
            req.body = {
                goodsname: 'New Game', price: 59, stock: 100,
                img: '/img/n.jpg', c_id: 1, introduce: 'desc', is_sale: 1
            }

            adminAddGoods(req, res)

            const sql = dbsql.mock.calls[0][0]
            const params = dbsql.mock.calls[0][1]
            expect(sql).toContain('INSERT INTO goods')
            expect(params).toEqual(['New Game', 59, 100, '/img/n.jpg', 1, 'desc', 1])
        })

        it('should return success message and new g_id on insert', () => {
            dbsql.mockImplementation((sql, params, cb) => cb(null, { insertId: 7 }))

            req.body = { goodsname: 'x', price: 1, stock: 1, img: '', c_id: 1, introduce: '', is_sale: 1 }
            adminAddGoods(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 200,
                message: '入库成功',
                data: { g_id: 7 }
            })
        })

        // ===== 修复后新增：以前缺字段会把 MySQL NULL 错误直接吐给前端 =====

        it('缺少商品名应被拦截，不查库', () => {
            req.body = { price: 1, stock: 1, c_id: 1 }
            adminAddGoods(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 102,
                message: '作品名称不能为空',
                data: null
            })
            expect(dbsql).not.toHaveBeenCalled()
        })

        it('价格为负应被拦截', () => {
            req.body = { goodsname: 'x', price: -1, stock: 1, c_id: 1 }
            adminAddGoods(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 102,
                message: expect.stringContaining('售价'),
                data: null
            })
        })

        it('库存为负应被拦截', () => {
            req.body = { goodsname: 'x', price: 1, stock: -1, c_id: 1 }
            adminAddGoods(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 102,
                message: expect.stringContaining('库存'),
                data: null
            })
        })

        it('分类ID非法应被拦截', () => {
            req.body = { goodsname: 'x', price: 1, stock: 1, c_id: 'abc' }
            adminAddGoods(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 102,
                message: expect.stringContaining('分类'),
                data: null
            })
        })
    })

    describe('adminUpdateGoods', () => {
        it('should UPDATE goods by g_id', () => {
            req.body = {
                g_id: 5, goodsname: 'Updated', price: 99, stock: 50, version: 0,
                img: '/img/u.jpg', c_id: 2, introduce: 'new desc', is_sale: 0
            }

            adminUpdateGoods(req, res)

            const sql = dbsql.mock.calls[0][0]
            const params = dbsql.mock.calls[0][1]
            expect(sql).toContain('UPDATE goods SET')
            expect(params).toEqual(['Updated', 99, 50, '/img/u.jpg', 2, 'new desc', 0, 5, 0])
        })

        // ===== 修复后新增：以前只传 is_sale 会 ER_BAD_NULL_ERROR =====

        it('局部更新：只传 g_id + is_sale 时只更新该字段', () => {
            req.body = { g_id: 5, is_sale: 0 }
            dbsql.mockImplementation((sql, params, cb) => cb(null, { affectedRows: 1 }))

            adminUpdateGoods(req, res)

            const sql = dbsql.mock.calls[0][0]
            const params = dbsql.mock.calls[0][1]
            expect(sql).toContain('SET is_sale=?')
            expect(sql).not.toContain('goodsname=?')
            expect(params).toEqual([0, 5])
            expect(res.send).toHaveBeenCalledWith({ code: 200, message: '修改成功', data: null })
        })

        it('g_id 非法应被拦截', () => {
            req.body = { g_id: 'abc', is_sale: 1 }
            adminUpdateGoods(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 102,
                message: '商品ID不合法',
                data: null
            })
        })

        it('没有任何可更新字段应被拦截', () => {
            req.body = { g_id: 5 }
            adminUpdateGoods(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 102,
                message: '没有需要修改的字段',
                data: null
            })
        })

        it('影响行数为 0 时应提示不存在，而不是假成功', () => {
            req.body = { g_id: 999999, is_sale: 1 }
            dbsql.mockImplementation((sql, params, cb) => cb(null, { affectedRows: 0 }))

            adminUpdateGoods(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 102,
                message: expect.stringContaining('不存在'),
                data: null
            })
        })

        it('编辑时应拒绝负价格，且不查库', () => {
            req.body = { g_id: 5, price: -1 }
            adminUpdateGoods(req, res)

            expect(dbsql).not.toHaveBeenCalled()
            expect(res.send).toHaveBeenCalledWith({
                code: 102,
                message: expect.stringContaining('售价'),
                data: null
            })
        })

        it('编辑时应拒绝负库存和非法上架状态', () => {
            req.body = { g_id: 5, stock: -1 }
            adminUpdateGoods(req, res)
            expect(res.send).toHaveBeenCalledWith({
                code: 102,
                message: expect.stringContaining('库存'),
                data: null
            })

            dbsql.mockClear()
            res.send.mockClear()
            req.body = { g_id: 5, is_sale: 2 }
            adminUpdateGoods(req, res)
            expect(dbsql).not.toHaveBeenCalled()
            expect(res.send).toHaveBeenCalledWith({
                code: 102,
                message: expect.stringContaining('上架状态'),
                data: null
            })
        })
    })

    describe('adminDeleteGoods', () => {
        it('should soft-delete by setting is_delete = 0', () => {
            req.body = { g_id: '10' }
            dbsql.mockImplementation((sql, params, cb) => cb(null, { affectedRows: 1 }))

            adminDeleteGoods(req, res)

            const sql = dbsql.mock.calls[0][0]
            const params = dbsql.mock.calls[0][1]
            expect(sql).toContain('UPDATE goods SET is_delete = 0')
            // g_id 统一转成数字，并加上 is_delete=1 防止重复销毁
            expect(params).toEqual([10])
            expect(sql).toContain('is_delete = 1')
        })

        it('should return success on delete', () => {
            dbsql.mockImplementation((sql, params, cb) => cb(null, { affectedRows: 1 }))

            req.body = { g_id: '10' }
            adminDeleteGoods(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 200,
                message: '销毁成功',
                data: null
            })
        })

        // ===== 修复后新增：以前传错字段名也会提示"销毁成功" =====

        it('影响行数为 0 时应报错，不能假成功', () => {
            dbsql.mockImplementation((sql, params, cb) => cb(null, { affectedRows: 0 }))

            req.body = { g_id: 999999 }
            adminDeleteGoods(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 102,
                message: expect.stringContaining('不存在'),
                data: null
            })
        })

        it('缺少 g_id 应被拦截，不查库', () => {
            req.body = {}
            adminDeleteGoods(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 102,
                message: '商品ID不合法',
                data: null
            })
            expect(dbsql).not.toHaveBeenCalled()
        })

        it('g_id 非数字应被拦截', () => {
            req.body = { g_id: 'abc' }
            adminDeleteGoods(req, res)

            expect(res.send).toHaveBeenCalledWith({
                code: 102,
                message: '商品ID不合法',
                data: null
            })
            expect(dbsql).not.toHaveBeenCalled()
        })
    })
})
