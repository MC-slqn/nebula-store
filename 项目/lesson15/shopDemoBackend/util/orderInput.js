const { createHash } = require('crypto')
const { BusinessError } = require('./errors')

module.exports = (body = {}) => {
    const { recipient, phone, address, goods, request_key } = body
    for (const [value, max, label] of [[recipient, 20, '收货人'], [address, 255, '地址']]) {
        if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new BusinessError(`${label}不能为空且不能超过 ${max} 个字符`)
    }
    if (typeof phone !== 'string' || !/^1[3-9]\d{9}$/.test(phone)) throw new BusinessError('手机号格式不正确')
    if (typeof request_key !== 'string' || !/^[a-zA-Z0-9_-]{16,64}$/.test(request_key)) throw new BusinessError('缺少有效的下单请求编号，请刷新后重试')
    if (!Array.isArray(goods) || !goods.length || goods.length > 100) throw new BusinessError('请选择 1~100 条商品')
    const merged = new Map()
    for (const item of goods) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new BusinessError('商品参数不合法')
        const { g_id, num, cart_id } = item
        if (!Number.isSafeInteger(g_id) || g_id <= 0) throw new BusinessError('商品ID不合法')
        if (!Number.isSafeInteger(num) || num < 1 || num > 99) throw new BusinessError('商品数量必须是 1~99 的整数')
        if (cart_id !== undefined && (!Number.isSafeInteger(cart_id) || cart_id <= 0)) throw new BusinessError('购物车记录ID不合法')
        const row = merged.get(g_id) || { g_id, num: 0, cartIds: [] }
        row.num += num
        if (row.num > 99) throw new BusinessError('同一商品合计不能超过 99 件')
        if (cart_id !== undefined) row.cartIds.push(cart_id)
        merged.set(g_id, row)
    }
    const items = [...merged.values()].sort((a, b) => a.g_id - b.g_id)
    for (const item of items) item.cartIds = [...new Set(item.cartIds)].sort((a, b) => a - b)
    const input = { recipient: recipient.trim(), phone, address: address.trim(), items }
    const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex')
    return { ...input, request_key, hash }
}
