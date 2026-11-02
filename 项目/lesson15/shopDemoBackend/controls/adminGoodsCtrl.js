const { sendError } = require('../util/errors')
const { dbsql } = require('../model/index')

// 1. 获取所有商品（包含下架，不分页，方便管理员全局查看）
exports.adminGetGoodsList = (req, res) => {
    // 按照库存升序排列，库存少的排前面
    let sql = `SELECT * FROM goods WHERE is_delete = 1 ORDER BY stock ASC;`
    dbsql(sql, [], (err, results) => {
        if (err) {
            return sendError(res, err)
        }
        res.send({ code: 200, message: '获取成功', data: results })
    })
}

// 正整数校验小工具
const toPositiveInt = (v) => {
    const n = Number(v)
    return Number.isInteger(n) && n > 0 ? n : null
}

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

// 统一校验新增与编辑数据，防止编辑接口绕过新增接口已有的业务约束。
const validateGoodsFields = (body, partial = false) => {
    if (!partial || hasOwn(body, 'goodsname')) {
        if (typeof body.goodsname !== 'string' || !body.goodsname.trim()) return '作品名称不能为空'
        if (body.goodsname.trim().length > 100) return '作品名称不能超过 100 个字符'
    }
    if (!partial || hasOwn(body, 'price')) {
        if (!Number.isFinite(Number(body.price)) || Number(body.price) < 0) return '售价必须是不小于 0 的数字'
    }
    if (!partial || hasOwn(body, 'stock')) {
        if (!Number.isInteger(Number(body.stock)) || Number(body.stock) < 0) return '库存必须是不小于 0 的整数'
    }
    if (!partial || hasOwn(body, 'c_id')) {
        if (!toPositiveInt(body.c_id)) return '分类ID不合法'
    }
    if (hasOwn(body, 'is_sale') && ![0, 1].includes(Number(body.is_sale))) return '上架状态只能是 0 或 1'
    return null
}

// 2. 新增入库商品
exports.adminAddGoods = (req, res) => {
    let { goodsname, price, stock, img, c_id, introduce, is_sale } = req.body

    // 必填校验：以前缺字段会直接把 MySQL 的 NULL 错误抛给前端
    const invalidMessage = validateGoodsFields(req.body)
    if (invalidMessage) return res.send({ code: 102, message: invalidMessage, data: null })
    const priceNum = Number(price)
    const stockNum = Number(stock)
    const cid = toPositiveInt(c_id)
    const sale = Number(is_sale) === 1 ? 1 : 0

    let sql = `INSERT INTO goods (goodsname, price, stock, img, c_id, introduce, is_sale, is_delete) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
    dbsql(sql, [goodsname, priceNum, stockNum, img || '', cid, introduce || '', sale], (err, results) => {
        if (err) {
            return sendError(res, err)
        }
        res.send({ code: 200, message: '入库成功', data: { g_id: results.insertId } })
    })
}

// 3. 修改/编辑商品信息 (包括切换上下架状态)
// 只更新前端实际传过来的字段，支持局部更新（例如只改 is_sale）
exports.adminUpdateGoods = (req, res) => {
    const g_id = toPositiveInt(req.body.g_id)
    if (!g_id) {
        return res.send({ code: 102, message: '商品ID不合法', data: null })
    }

    const updatable = ['goodsname', 'price', 'stock', 'img', 'c_id', 'introduce', 'is_sale']
    const fields = []
    const params = []
    for (const key of updatable) {
        if (req.body[key] !== undefined && req.body[key] !== null) {
            fields.push(`${key}=?`)
            params.push(req.body[key])
        }
    }
    if (fields.length === 0) {
        return res.send({ code: 102, message: '没有需要修改的字段', data: null })
    }
    const invalidMessage = validateGoodsFields(req.body, true)
    if (invalidMessage) return res.send({ code: 102, message: invalidMessage, data: null })

    // 规范化数值与展示名称，避免把字符串/空白直接写入数据库。
    for (let i = 0; i < fields.length; i++) {
        const key = fields[i].slice(0, -2)
        if (['price', 'stock', 'c_id', 'is_sale'].includes(key)) params[i] = Number(params[i])
        if (key === 'goodsname') params[i] = params[i].trim()
    }
    params.push(g_id)
    const changingStock = hasOwn(req.body, 'stock')
    if (changingStock && (!Number.isSafeInteger(req.body.version) || req.body.version < 0)) {
        return res.send({ code: 102, message: '修改库存需要最新版本号，请刷新商品列表', data: null })
    }
    if (changingStock) params.push(req.body.version)

    let sql = `UPDATE goods SET ${fields.join(', ')}, version=version+1 WHERE g_id=? AND is_delete=1${changingStock ? ' AND version=?' : ''}`
    dbsql(sql, params, (err, results) => {
        if (err) {
            return sendError(res, err)
        }
        if (results.affectedRows === 0) {
            return res.send({ code: 102, message: changingStock ? '商品已变化或不存在，请刷新后重新编辑' : '修改失败：商品不存在或已被销毁', data: null })
        }
        res.send({ code: 200, message: '修改成功', data: null })
    })
}

// 4. 删除商品 (软删除)
exports.adminDeleteGoods = (req, res) => {
    // 统一字段名为 g_id（前端以前传的是 id，导致永远删不掉却提示成功）
    const g_id = toPositiveInt(req.body.g_id)
    if (!g_id) {
        return res.send({ code: 102, message: '商品ID不合法', data: null })
    }

    let sql = `UPDATE goods SET is_delete = 0 WHERE g_id = ? AND is_delete = 1`
    dbsql(sql, [g_id], (err, results) => {
        if (err) {
            return sendError(res, err)
        }
        if (results.affectedRows === 0) {
            return res.send({ code: 102, message: '销毁失败：商品不存在或已被销毁', data: null })
        }
        res.send({ code: 200, message: '销毁成功', data: null })
    })
}
