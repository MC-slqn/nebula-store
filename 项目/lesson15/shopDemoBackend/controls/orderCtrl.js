const { dbsql, transaction } = require('../model/index')
const { BusinessError, sendError } = require('../util/errors')
const parseOrder = require('../util/orderInput')

exports.doAddOrder = async (req, res) => {
    try {
        const input = parseOrder(req.body)
        const u_id = req.data.u_id
        const result = await transaction(async (conn, q) => {
            // 同一用户按顺序检查请求编号；冻结状态在事务中再次核验。
            const users = await q('SELECT status FROM users WHERE u_id=? FOR UPDATE', [u_id])
            if (!users.length || String(users[0].status) !== '1') throw new BusinessError('账号不可用', 403)
            const existing = await q('SELECT order_id, totalprice, request_hash FROM orders WHERE u_id=? AND request_key=?', [u_id, input.request_key])
            if (existing.length) {
                if (existing[0].request_hash !== input.hash) throw new BusinessError('请求编号已用于其他订单，请重新提交', 409)
                return { order_id: existing[0].order_id, totalprice: existing[0].totalprice }
            }
            const order = await q('INSERT INTO orders(u_id,recipient,address,phone,totalprice,request_key,request_hash) VALUES(?,?,?,?,?,?,?)',
                [u_id, input.recipient, input.address, input.phone, 0, input.request_key, input.hash])
            let totalCents = 0
            // 商品ID排序后加锁，避免多商品订单以相反顺序锁行。
            for (const item of input.items) {
                const rows = await q('SELECT price, stock, is_sale, goodsname, img FROM goods WHERE g_id=? AND is_delete=1 FOR UPDATE', [item.g_id])
                const goods = rows[0]
                if (!goods || Number(goods.is_sale) !== 1) throw new BusinessError('商品不存在或已下架')
                if (Number(goods.stock) < item.num) throw new BusinessError('商品库存不足')
                const cents = Math.round(Number(goods.price) * 100)
                totalCents += cents * item.num
                if (!Number.isSafeInteger(totalCents) || cents < 0 || totalCents > 99999999) throw new BusinessError('订单金额超出允许范围')
                await q('INSERT INTO order_details(order_id,g_id,num,unit_price,goodsname_snapshot,img_snapshot) VALUES(?,?,?,?,?,?)',
                    [order.insertId, item.g_id, item.num, (cents / 100).toFixed(2), goods.goodsname, goods.img])
                const update = await q('UPDATE goods SET stock=stock-?, version=version+1 WHERE g_id=? AND stock>=?', [item.num, item.g_id, item.num])
                if (!update.affectedRows) throw new BusinessError('商品库存不足')
                for (const cartId of item.cartIds) {
                    // 同时匹配商品，避免错误的 cart_id 清掉其他商品。
                    await q('DELETE FROM shopcart WHERE cart_id=? AND u_id=? AND g_id=?', [cartId, u_id, item.g_id])
                }
            }
            const totalprice = (totalCents / 100).toFixed(2)
            await q('UPDATE orders SET totalprice=? WHERE order_id=?', [totalprice, order.insertId])
            return { order_id: order.insertId, totalprice }
        })
        return res.send({ code: 200, message: '下单成功', data: result })
    } catch (err) {
        return sendError(res, err)
    }
}

//根据订单ID获取单笔订单详情
exports.showOrderDetail = (req, res) => {
    let { id } = req.params
    let u_id = req.data.u_id
    //订单按 is_delete 软删除，已被删除的订单不应再能查看详情
    let sql = `SELECT * FROM orders WHERE order_id=? AND u_id=? AND is_delete='1';
               SELECT unit_price AS price, goodsname_snapshot AS goodsname, img_snapshot AS img, num
               FROM order_details WHERE order_id=?;`
    dbsql(sql, [id, u_id, id], (err, results) => {
        if (err) {
            return sendError(res, err)
        }
        if (!results[0] || results[0].length === 0) {
            return res.send({ code: 102, message: '订单不存在', data: null })
        }
        let order = results[0][0]
        let details = results[1]
        let goods = details.map(item => ({
            price: item.price,
            goodsname: item.goodsname,
            img: item.img,
            num: item.num,
        }))
        res.send({ code: 200, message: '', data: { ...order, goods } })
    })
}

//展示订单
//注意：以前第二条 SQL 会把全表 order_details 拉回内存再过滤，这里改为只查当前用户的订单明细，
//并在服务端按订单分组返回同样的数据结构 [{..., goods:[...]}]
exports.showOrders = (req, res) => {
    let sql = `SELECT o.*, d.g_id, d.num, d.unit_price AS price, d.goodsname_snapshot AS goodsname, d.img_snapshot AS img
               FROM orders o
               JOIN order_details d ON d.order_id = o.order_id
               WHERE o.is_delete = '1' AND o.u_id = ?
               ORDER BY o.order_id DESC;`
    dbsql(sql, [req.data.u_id], (err, rows) => {
        if (err) {
            return sendError(res, err)
        }

        //按 order_id 分组，保持订单字段 + goods 数组的原有返回结构
        const orderMap = new Map()
        for (const row of rows) {
            if (!orderMap.has(row.order_id)) {
                orderMap.set(row.order_id, {
                    order_id: row.order_id,
                    u_id: row.u_id,
                    recipient: row.recipient,
                    address: row.address,
                    phone: row.phone,
                    totalprice: row.totalprice,
                    orderDate: row.orderDate,
                    status: row.status,
                    is_delete: row.is_delete,
                    goods: []
                })
            }
            orderMap.get(row.order_id).goods.push({
                price: row.price,
                goodsname: row.goodsname,
                img: row.img,
                num: row.num
            })
        }
        res.send({ code: 200, message: '', data: [...orderMap.values()] })
    })
}

//软删除订单
exports.doDelOrder = (req, res) => {
    let { id } = req.body
    let u_id = req.data.u_id
    const orderId = Number(id)
    if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.send({ code: 102, message: '订单ID不合法', data: null })
    }
    //加 is_delete='1' 条件：只允许删除尚未删除的订单，便于用影响行数判断是否真的删到了
    let sql = `UPDATE orders SET is_delete='0' WHERE order_id=? AND u_id=? AND is_delete='1';`
    dbsql(sql, [orderId, u_id], (err, results) => {
        if (err) {
            return sendError(res, err)
        }
        if (results.affectedRows === 0) {
            return res.send({ code: 102, message: '删除失败：订单不存在或无权操作', data: null })
        }
        res.send({ code: 200, message: '删除成功', data: null })
    })
}
