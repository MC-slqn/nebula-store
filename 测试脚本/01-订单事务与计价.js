// 临时验证脚本（P0-1 订单事务）：走真实接口 + 直连数据库断言，结束后自行清理
const http = require('http')
const { mysql, dbConfig } = require('./_db')

const db = mysql.createPool(dbConfig)
const q = (sql, p = []) => new Promise((res, rej) => db.query(sql, p, (e, r) => e ? rej(e) : res(r)))
const one = async (sql, p) => (await q(sql, p))[0]

function req(method, path, body, headers = {}) {
  return new Promise((resolve) => {
    if (body && path.endsWith('/addOrder')) body = { ...body, request_key: body.request_key || require('crypto').randomUUID() }
    const data = body ? JSON.stringify(body) : null
    const opts = { host: '127.0.0.1', port: 3000, path, method, headers: { 'Content-Type': 'application/json', ...headers } }
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data)
    const r = http.request(opts, (res) => {
      let out = ''
      res.on('data', (c) => (out += c))
      res.on('end', () => resolve({ status: res.statusCode, body: out }))
    })
    r.on('error', (e) => resolve({ status: 'ERR', body: e.message }))
    if (data) r.write(data)
    r.end()
  })
}
const J = (s) => { try { return JSON.parse(s) } catch { return s } }
let pass = 0, fail = 0
const check = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  ✅ ${name}`) }
  else { fail++; console.log(`  ❌ ${name}  →  ${detail}`) }
}

// 测试期间写入的数据，全部登记以便回滚
const createdOrders = []
let cartSnapshot = []
let stockSnapshot = {}

;(async () => {
  const token = J((await req('POST', '/login', { username: 'admin', password: '123456' })).body).data.token
  const auth = { Authorization: 'Bearer ' + token }
  const UID = 8

  // ===== 快照（用于最终还原）=====
  cartSnapshot = await q('SELECT * FROM shopcart WHERE u_id=?', [UID])
  stockSnapshot = Object.fromEntries((await q('SELECT g_id,stock,version FROM goods')).map(r => [r.g_id, { stock: r.stock, version: r.version }]))
  const maxOrderBefore = (await one('SELECT IFNULL(MAX(order_id),0) c FROM orders')).c
  const ordersCountBefore = (await one('SELECT COUNT(*) c FROM orders')).c

  console.log('\n===== 用例 1：正常下单，响应返回时数据必须已全部落库（竞态修复验证）=====')
  const target = cartSnapshot[0]
  const gid = target.g_id, cartId = target.cart_id
  const stockBefore = stockSnapshot[gid].stock
  const dbPrice = Number((await one('SELECT price FROM goods WHERE g_id=?', [gid])).price)
  const targetName = (await one('SELECT goodsname FROM goods WHERE g_id=?', [gid])).goodsname

  const r1 = await req('POST', '/addOrder', {
    recipient: '验证收货人', phone: '13800000000', address: '验证地址',
    totalprice: 0.01, goods: [{ g_id: gid, num: 1, cart_id: cartId }]
  }, auth)
  const b1 = J(r1.body)
  check('下单返回 code=200', b1.code === 200, JSON.stringify(b1))
  check('服务端忽略前端传的 0.01，按数据库价格计价', Number(b1.data && b1.data.totalprice) === dbPrice,
    `期望 ${dbPrice}，实际 ${b1.data && b1.data.totalprice}`)
  const oid = b1.data && b1.data.order_id
  createdOrders.push(oid)

  // 关键：响应回来的同一瞬间就查详情
  const d1 = J((await req('GET', '/orderDetail/' + oid, null, auth)).body)
  check('立刻查订单详情，goods 非空（竞态已修）',
    d1.code === 200 && Array.isArray(d1.data.goods) && d1.data.goods.length > 0,
    'goods=' + JSON.stringify(d1.data && d1.data.goods))
  check(`订单总价以数据库价格入库（${b1.data.totalprice}）`,
    Number(d1.data.totalprice) === dbPrice, `详情里的 totalprice=${d1.data.totalprice}`)
  check('订单详情商品名正确', d1.data.goods[0] && d1.data.goods[0].goodsname === targetName,
    `期望 ${targetName}，实际 ${JSON.stringify(d1.data.goods[0])}`)

  check('购物车对应记录已删除', (await q('SELECT * FROM shopcart WHERE cart_id=?', [cartId])).length === 0)
  const stockAfter = (await one('SELECT stock FROM goods WHERE g_id=?', [gid])).stock
  check(`库存已扣减 1（${stockBefore} → ${stockAfter}）`, stockAfter === stockBefore - 1,
    `期望 ${stockBefore - 1}，实际 ${stockAfter}`)
  check('订单数 +1', (await one('SELECT COUNT(*) c FROM orders')).c === ordersCountBefore + 1)

  console.log('\n===== 用例 2：超库存下单，必须整单回滚 =====')
  // 选一个库存最少的商品做超量测试
  const low = await one('SELECT g_id,goodsname,stock FROM goods WHERE stock>0 ORDER BY stock ASC LIMIT 1')
  console.log(`  （选用 g_id=${low.g_id} ${low.goodsname}，库存=${low.stock}，下单数量=99）`)
  const r2 = await req('POST', '/addOrder', {
    recipient: '验证收货人', phone: '13800000000', address: '验证地址',
    totalprice: 99999, goods: [{ g_id: low.g_id, num: 99 }]
  }, auth)
  const b2 = J(r2.body)
  check('返回 code=102', b2.code === 102, JSON.stringify(b2))
  check('错误信息包含"库存不足"', /库存不足/.test(b2.message || ''), b2.message)

  const ordersCount2 = (await one('SELECT COUNT(*) c FROM orders')).c
  check('没有残留订单（事务已回滚）', ordersCount2 === ordersCountBefore + 1,
    `期望 ${ordersCountBefore + 1}，实际 ${ordersCount2}`)
  const orphan = (await one('SELECT COUNT(*) c FROM order_details WHERE order_id > ?', [maxOrderBefore])).c
  check('新增的订单详情只有用例1那一条（用例2已回滚）', orphan === 1, `实际 ${orphan} 条`)
  const stock2b = (await one('SELECT stock FROM goods WHERE g_id=?', [low.g_id])).stock
  check(`低库存商品库存未变（${stockSnapshot[low.g_id].stock} → ${stock2b}）`,
    stock2b === stockSnapshot[low.g_id].stock, `期望 ${stockSnapshot[low.g_id].stock}`)

  console.log('\n===== 用例 3：已下架商品不允许下单 =====')
  await q('UPDATE goods SET is_sale=0 WHERE g_id=?', [gid])
  const b3 = J((await req('POST', '/addOrder', {
    recipient: 'a', phone: '13800000000', address: 'b', totalprice: 1, goods: [{ g_id: gid, num: 1 }]
  }, auth)).body)
  check('下架商品下单 → code=102 且提示已下架', b3.code === 102 && /下架/.test(b3.message), JSON.stringify(b3))
  await q('UPDATE goods SET is_sale=1 WHERE g_id=?', [gid])

  console.log('\n===== 用例 4：参数校验 =====')
  const cases = [
    ['空商品数组', { recipient: 'a', phone: '13800000000', address: 'b', totalprice: 1, goods: [] }],
    ['数量为负', { recipient: 'a', phone: '13800000000', address: 'b', totalprice: 1, goods: [{ g_id: gid, num: -5 }] }],
    ['数量为0', { recipient: 'a', phone: '13800000000', address: 'b', totalprice: 1, goods: [{ g_id: gid, num: 0 }] }],
    ['数量超上限', { recipient: 'a', phone: '13800000000', address: 'b', totalprice: 1, goods: [{ g_id: gid, num: 100 }] }],
    ['缺收货人', { phone: '13800000000', address: 'b', totalprice: 1, goods: [{ g_id: gid, num: 1 }] }],
    // 注意：「金额为负」不再是错误用例——后端已改为忽略前端传的金额，
    // 由服务端按数据库价格计算（用例 1 已正面验证）
    ['商品ID不合法', { recipient: 'a', phone: '13800000000', address: 'b', goods: [{ g_id: 'abc', num: 1 }] }],
    ['商品ID为0', { recipient: 'a', phone: '13800000000', address: 'b', goods: [{ g_id: 0, num: 1 }] }],
    ['商品不存在', { recipient: 'a', phone: '13800000000', address: 'b', goods: [{ g_id: 999999, num: 1 }] }]
  ]
  for (const [name, payload] of cases) {
    const r = J((await req('POST', '/addOrder', payload, auth)).body)
    check(`${name} → 被拒绝`, r.code !== 200, JSON.stringify(r))
  }

  console.log('\n===== 用例 5：购物车越权与数量校验（P1 顺带完成）=====')
  const r5a = J((await req('POST', '/updateCartNum', { id: 999999, num: 2 }, auth)).body)
  check('改不存在/别人的购物车 → code=102', r5a.code === 102, JSON.stringify(r5a))
  const r5b = J((await req('POST', '/updateCartNum', { id: cartId, num: -5 }, auth)).body)
  check('负数量 → code=102', r5b.code === 102, JSON.stringify(r5b))
  const r5c = J((await req('GET', '/delCart?id=999999', null, auth)).body)
  check('删不存在的购物车 → code=102', r5c.code === 102, JSON.stringify(r5c))
  const r5d = J((await req('POST', '/addCart', { g_id: gid, num: -99 }, auth)).body)
  check('加购负数量 → code=102', r5d.code === 102, JSON.stringify(r5d))
  const r5e = J((await req('POST', '/addCart', { g_id: gid, num: 99999 }, auth)).body)
  check('加购超库存 → code=102', r5e.code === 102, JSON.stringify(r5e))
  // 用库存=1的商品验证"加购数量不能超过库存"
  const r5f = J((await req('POST', '/addCart', { g_id: low.g_id, num: 2 }, auth)).body)
  check('加购数量超过库存 → code=102', r5f.code === 102, JSON.stringify(r5f))
  await q('DELETE FROM shopcart WHERE u_id=? AND g_id=?', [UID, low.g_id])

  console.log('\n===== 还原测试数据 =====')
  // 兜底：清理本次运行期间产生的所有新订单（无论前面用例是否成功登记）
  const newOrders = await q('SELECT order_id FROM orders WHERE order_id > ?', [maxOrderBefore])
  for (const row of newOrders) {
    await q('DELETE FROM order_details WHERE order_id=?', [row.order_id])
    await q('DELETE FROM orders WHERE order_id=?', [row.order_id])
  }
  for (const o of createdOrders) {
    if (!o) continue
    await q('DELETE FROM order_details WHERE order_id=?', [o])
    await q('DELETE FROM orders WHERE order_id=?', [o])
  }
  await q('DELETE FROM shopcart WHERE u_id=?', [UID])
  for (const c of cartSnapshot) {
    await q('INSERT INTO shopcart(cart_id,u_id,g_id,num) VALUES(?,?,?,?)', [c.cart_id, c.u_id, c.g_id, c.num])
  }
  for (const [g, s] of Object.entries(stockSnapshot)) {
    await q('UPDATE goods SET stock=?,version=? WHERE g_id=?', [s.stock, s.version, g])
  }
  const fOrders = (await one('SELECT COUNT(*) c FROM orders')).c
  const fCart = await q('SELECT * FROM shopcart WHERE u_id=?', [UID])
  const fStock = await one('SELECT stock FROM goods WHERE g_id=?', [gid])
  console.log(`  订单数: ${fOrders}（原始 ${ordersCountBefore}）`)
  console.log(`  购物车: ${JSON.stringify(fCart)}`)
  console.log(`  g_id=${gid} 库存: ${fStock.stock}（原始 ${stockBefore}）`)
  check('数据已完全还原', fOrders === ordersCountBefore && fCart.length === cartSnapshot.length && fStock.stock === stockBefore)

  console.log(`\n===== 结果：通过 ${pass} / 失败 ${fail} =====`)
  db.end()
})()
