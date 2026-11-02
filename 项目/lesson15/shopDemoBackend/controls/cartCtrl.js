const { sendError } = require('../util/errors')
const { BusinessError } = require('../util/errors')
/*
购物车控制层 
 */
const { dbsql, transaction } = require('../model/index')

//加入购物车
exports.doAddCart = async (req, res) => {
    let { g_id, num } = req.body
    let u_id = req.data.u_id

    //参数校验：g_id 必须为正整数，num 必须是 1~99 的整数
    const goodsId = Number(g_id)
    const addNum = Number(num)
    if (!Number.isInteger(goodsId) || goodsId <= 0) {
        return res.send({ code: 102, message: '商品ID不合法', data: null })
    }
    if (!Number.isInteger(addNum) || addNum < 1 || addNum > 99) {
        return res.send({ code: 102, message: '商品数量必须是 1~99 的整数', data: null })
    }

    try {
        const result = await transaction(async (conn, q) => {
            // 锁住商品行，令同一商品的并发加购串行化；第二个请求会在第一个提交后
            // 才读取购物车，避免重复插入和超库存累计。
            const goodsRows = await q(
                `SELECT stock, is_sale, is_delete FROM goods WHERE g_id=? FOR UPDATE;`,
                [goodsId]
            )
            if (goodsRows.length === 0) throw new BusinessError('商品不存在')
            const goods = goodsRows[0]
            if (Number(goods.is_sale) !== 1 || Number(goods.is_delete) !== 1) {
                throw new BusinessError('商品已下架')
            }

            const cartRows = await q(`SELECT cart_id, num FROM shopcart WHERE u_id=? AND g_id=?;`, [u_id, goodsId])
            const currentNum = cartRows.reduce((total, row) => total + Number(row.num), 0)
            if (currentNum + addNum > 99) throw new BusinessError('同一商品最多加入 99 件')
            if (currentNum + addNum > Number(goods.stock)) {
                throw new BusinessError(`库存不足，当前仅剩 ${goods.stock} 件`)
            }

            if (cartRows.length > 0) {
                // 兼容历史上可能已存在的重复购物车记录：合并进第一条并清理其余记录。
                const update = await q(`UPDATE shopcart SET num=? WHERE cart_id=? AND u_id=?;`, [currentNum + addNum, cartRows[0].cart_id, u_id])
                for (const row of cartRows.slice(1)) {
                    await q(`DELETE FROM shopcart WHERE cart_id=? AND u_id=?;`, [row.cart_id, u_id])
                }
                return update
            }
            return q(`INSERT INTO shopcart(u_id,g_id,num) VALUES(?,?,?);`, [u_id, goodsId, addNum])
        })
        return res.send({ code: 200, message: '商品已经加入购物车', data: result })
    } catch (err) {
        return sendError(res, err)
    }
}

//获取当前登录用户购物车列表
exports.showCart = (req, res) => {
    let u_id = req.data.u_id
    let sql = `SELECT * FROM shopcart JOIN goods ON
shopcart.g_id=goods.g_id WHERE u_id=?;`
    dbsql(sql, [u_id], (err, results) => {
        if (err) {
            return sendError(res, err)
        }
        res.send({ code: 200, message: null, data: results })
    })
}

//修改购物车数量
exports.doUpdateCartNum = (req, res) => {
    let { id, num } = req.body
    let u_id = req.data.u_id

    const cartId = Number(id)
    const newNum = Number(num)
    if (!Number.isInteger(cartId) || cartId <= 0) {
        return res.send({ code: 102, message: '购物车记录ID不合法', data: null })
    }
    if (!Number.isInteger(newNum) || newNum < 1 || newNum > 99) {
        return res.send({ code: 102, message: '商品数量必须是 1~99 的整数', data: null })
    }

    //带 u_id 条件：只能改自己的购物车；同时校验不超过库存
    let sql = `UPDATE shopcart s JOIN goods g ON s.g_id = g.g_id
               SET s.num = ?
               WHERE s.cart_id = ? AND s.u_id = ? AND g.stock >= ?;`
    dbsql(sql, [newNum, cartId, u_id, newNum], (err, results) => {
        if (err) {
            return sendError(res, err)
        }
        if (results.affectedRows === 0) {
            return res.send({ code: 102, message: '修改失败：记录不存在、无权操作或库存不足', data: null })
        }
        res.send({ code: 200, message: '修改成功', data: results })
    })
}

//删除购物车
exports.doDelCart = (req, res) => {
    let { id } = req.query
    let u_id = req.data.u_id

    const cartId = Number(id)
    if (!Number.isInteger(cartId) || cartId <= 0) {
        return res.send({ code: 102, message: '购物车记录ID不合法', data: null })
    }

    //带 u_id 条件：只能删自己的购物车
    let sql = `DELETE FROM shopcart WHERE cart_id=? AND u_id=?;`
    dbsql(sql, [cartId, u_id], (err, results) => {
        if (err) {
            return sendError(res, err)
        }
        if (results.affectedRows === 0) {
            return res.send({ code: 102, message: '删除失败：记录不存在或无权操作', data: null })
        }
        res.send({ code: 200, message: '删除成功', data: results })
    })
}
