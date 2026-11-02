// 临时验证脚本（全链路·走前端 5173 代理，模拟浏览器行为）：结束后还原数据
const http = require('http')
const { mysql, dbConfig } = require('./_db')

const db = mysql.createPool(dbConfig)
const q = (sql, p = []) => new Promise((res, rej) => db.query(sql, p, (e, r) => e ? rej(e) : res(r)))
const one = async (sql, p) => (await q(sql, p))[0]

// 走前端端口，模拟浏览器实际路径
function req(method, path, body, headers = {}, port = 5173) {
  return new Promise((resolve) => {
    if (body && path.endsWith('/addOrder')) body = { ...body, request_key: body.request_key || require('crypto').randomUUID() }
    const data = body ? JSON.stringify(body) : null
    const opts = { host: '127.0.0.1', port, path, method, headers: { 'Content-Type': 'application/json', ...headers } }
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
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✅ ${name}`) }
  else { fail++; console.log(`  ❌ ${name}  →  ${detail}`) }
}
const A = (t) => ({ Authorization: 'Bearer ' + t })

;(async () => {
  const cartBefore = await q('SELECT * FROM shopcart WHERE u_id=8')
  const stockBefore = await one('SELECT stock,version FROM goods WHERE g_id=2')
  const ordersBefore = await one('SELECT COUNT(*) c FROM orders')
  const detailsBefore = await one('SELECT COUNT(*) c FROM order_details')

  console.log('\n===== 走前端代理（localhost:5173）模拟浏览器 =====')
  console.log('----- 1. 登录（勾选保持登录）-----')
  const login = J((await req('POST', '/api/login', { username: 'admin', password: '123456', remember: true })).body)
  check('登录成功且带 role/exp', login.code === 200 && login.data.role === '1' && login.data.exp > 0,
    JSON.stringify(login).slice(0, 150))
  const token = login.data.token

  console.log('----- 2. 首页/免费页/详情（公开接口）-----')
  check('商品列表可用', J((await req('GET', '/api/goodsList?page=1&pageSize=8')).body).code === 200)
  check('免费游戏筛选返回 29 件',
    J((await req('GET', '/api/goodsList?maxPrice=0&page=1&pageSize=100')).body).data.list.length === 29)
  check('商品详情可用', J((await req('GET', '/api/goodsDetails/1')).body).code === 200)
  check('轮播图可用', J((await req('GET', '/api/bannerList')).body).code === 200)

  console.log('----- 3. 加购 → 购物车列表 → 数量累加 -----')
  const r1 = J((await req('POST', '/api/addCart', { g_id: 2, num: 1 }, A(token))).body)
  check('加购成功', r1.code === 200, JSON.stringify(r1))
  const cart1 = J((await req('GET', '/api/shopcartList', null, A(token))).body)
  const item = cart1.data.find(i => i.g_id === 2)
  check('购物车能看到该商品', !!item, JSON.stringify(cart1.data.map(i => i.g_id)))
  const before = Number(item.num)
  await req('POST', '/api/addCart', { g_id: 2, num: 2 }, A(token))
  const cart2 = J((await req('GET', '/api/shopcartList', null, A(token))).body)
  const after = Number(cart2.data.find(i => i.g_id === 2).num)
  check(`重复加购数量累加（${before} → ${after}）`, after === before + 2, `${before} → ${after}`)

  console.log('----- 4. 下单 → 立刻查详情（竞态修复 + 服务端计价）-----')
  const order = J((await req('POST', '/api/addOrder', {
    recipient: '全链路验证', phone: '13800000000', address: '验证地址',
    totalprice: 0.01,
    goods: [{ g_id: 2, num: 1, cart_id: item.cart_id }]
  }, A(token))).body)
  check('下单成功', order.code === 200, JSON.stringify(order))
  check('金额由服务端计算（忽略前端 0.01）', Number(order.data.totalprice) === 158,
    `实际 ${order.data && order.data.totalprice}`)
  const oid = order.data.order_id
  const detail = J((await req('GET', '/api/orderDetail/' + oid, null, A(token))).body)
  check('立刻查详情有商品明细', detail.code === 200 && detail.data.goods.length > 0,
    JSON.stringify(detail.data && detail.data.goods))

  console.log('----- 5. 订单列表包含新订单 -----')
  const list = J((await req('GET', '/api/orderList', null, A(token))).body)
  const found = list.data.find(o => o.order_id === oid)
  check('订单列表能查到新订单', !!found, JSON.stringify(list.data.map(o => o.order_id)))
  check('列表中该订单有 goods 明细', found && found.goods.length > 0, JSON.stringify(found && found.goods))

  console.log('----- 6. 库存与购物车已被正确扣减 -----')
  const stockAfter = await one('SELECT stock FROM goods WHERE g_id=2')
  check(`库存扣减 1（${stockBefore.stock} → ${stockAfter.stock}）`,
    stockAfter.stock === stockBefore.stock - 1, `${stockBefore.stock} → ${stockAfter.stock}`)
  const cartGone = await q('SELECT * FROM shopcart WHERE cart_id=?', [item.cart_id])
  check('已下单的购物车记录被删除', cartGone.length === 0)

  console.log('----- 7. 删除订单（软删）-----')
  const del = J((await req('POST', '/api/delOrder', { id: oid }, A(token))).body)
  check('删除成功', del.code === 200, JSON.stringify(del))
  const del2 = J((await req('POST', '/api/delOrder', { id: oid }, A(token))).body)
  check('重复删除报错（不再假成功）', del2.code === 102, JSON.stringify(del2))

  console.log('\n===== 还原数据 =====')
  // 软删测试的订单本身随后会被物理删除，这里仍显式复位 is_delete，避免残留状态
  await q("UPDATE orders SET is_delete='1' WHERE order_id=?", [oid])
  await q('DELETE FROM order_details WHERE order_id=?', [oid])
  await q('DELETE FROM orders WHERE order_id=?', [oid])
  // 购物车只做「补齐」而不是「清空重建」，避免把测试期间的其他改动一起覆盖掉
  for (const c of cartBefore) {
    await q('INSERT INTO shopcart(cart_id,u_id,g_id,num) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE num=VALUES(num)',
      [c.cart_id, c.u_id, c.g_id, c.num])
  }
  await q('UPDATE goods SET stock=?,version=? WHERE g_id=2', [stockBefore.stock, stockBefore.version])
  const fin = await one(`SELECT
    (SELECT COUNT(*) FROM orders) orders,
    (SELECT COUNT(*) FROM order_details) details,
    (SELECT COUNT(*) FROM shopcart WHERE u_id=8) cart8,
    (SELECT stock FROM goods WHERE g_id=2) stock2`)
  console.log('  ', JSON.stringify(fin))
  check('数据已完全还原',
    fin.orders === ordersBefore.c && fin.details === detailsBefore.c &&
    fin.cart8 === cartBefore.length && fin.stock2 === stockBefore.stock, JSON.stringify(fin))

  console.log(`\n===== 结果：通过 ${pass} / 失败 ${fail} =====`)
  db.end()
})()
