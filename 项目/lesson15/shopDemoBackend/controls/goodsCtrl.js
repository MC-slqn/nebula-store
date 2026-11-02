const { sendError } = require('../util/errors')
const { dbsql } = require('../model/index')

//获取所有商品列表（支持分页、分类筛选、价格上限筛选）
exports.showGoodsList = (req, res) => {
    //1.分页参数校验：非法值一律回落到默认值，避免把 MySQL 语法错误抛给前端
    let page = Number.parseInt(req.query.page, 10)
    let pageSize = Number.parseInt(req.query.pageSize, 10)
    if (!Number.isFinite(page) || page < 1) page = 1
    if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 8
    if (pageSize > 100) pageSize = 100          // 防止一次拉爆
    const offset = (page - 1) * pageSize

    //2.动态拼接筛选条件（只用占位符传值，不拼字符串）
    const conditions = ['is_delete = 1', 'is_sale = 1']
    const params = []

    const c_id = Number.parseInt(req.query.c_id, 10)
    if (Number.isFinite(c_id) && c_id > 0) {
        conditions.push('c_id = ?')
        params.push(c_id)
    }
    const maxPrice = Number.parseFloat(req.query.maxPrice)
    if (Number.isFinite(maxPrice)) {
        conditions.push('price <= ?')
        params.push(maxPrice)
    }

    const where = conditions.join(' AND ')
    let sql = `SELECT * FROM goods WHERE ${where} LIMIT ?,?;
               SELECT COUNT(*) AS total FROM goods WHERE ${where};`
    dbsql(sql, [...params, offset, pageSize, ...params], (err, results) => {
        if (err) {
            return sendError(res, err)
        }
        let list = results[0]
        let total = results[1][0].total
        res.send({ code: 200, message: null, data: { list, total, page, pageSize } })
    })
}

//获取分类
exports.showCategory = (req, res) => {
    let sql = `SELECT * FROM category;`
    dbsql(sql, [], (err, results) => {
        if (err) {
            return sendError(res, err)
        }
        res.send({ code: 200, message: null, data: results })
    })
}

//获取商品详情（包含对应商品的评论）
exports.showGoodsDetails = (req, res) => {
    let { id } = req.params
    const goodsId = Number(id)
    if (!Number.isInteger(goodsId) || goodsId <= 0) {
        return res.send({ code: 102, message: '商品ID不合法', data: null })
    }
    // 商品详情和列表必须遵守同一套可见性规则，避免已下架或已销毁的商品
    // 仍能通过猜测 ID 被前台读取或加入订单。
    let sql = `SELECT * FROM goods WHERE g_id=? AND is_delete=1 AND is_sale=1;`
    dbsql(sql, [goodsId], (err, results) => {
        if (err) {
            return sendError(res, err)
        }
        res.send({ code: 200, message: null, data: results })
    })
}
