// 临时验证脚本（P1：订单列表/软删影响行数/remember 有效期/加购校验）：只读 + 可回滚
const http = require('http')
const { mysql, dbConfig } = require('./_db')

const db = mysql.createPool(dbConfig)
const q = (sql, p = []) => new Promise((res, rej) => db.query(sql, p, (e, r) => e ? rej(e) : res(r)))
const one = async (sql, p) => (await q(sql, p))[0]

function req(method, path, body, headers = {}) {
  return new Promise((resolve) => {
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
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✅ ${name}`) }
  else { fail++; console.log(`  ❌ ${name}  →  ${detail}`) }
}
const login = async (u, p, remember) =>
  J((await req('POST', '/login', { username: u, password: p, remember })).body)

;(async () => {
  const admin = await login('admin', '123456', false)
  const auth = { Authorization: 'Bearer ' + admin.data.token }
  // 测试会因「加购校验」删掉若干购物车记录，先快照，结束时补齐
  const cartSnapshot = await q('SELECT * FROM shopcart WHERE u_id=8')

  console.log('\n===== 用例 1：订单列表结构正确（改为单条 JOIN 后仍返回同样结构）=====')
  const dbOrders = await q(`SELECT o.order_id, o.recipient, o.totalprice,
      d.num, g.goodsname, g.price, g.img
    FROM orders o JOIN order_details d ON d.order_id=o.order_id JOIN goods g ON g.g_id=d.g_id
    WHERE o.is_delete='1' AND o.u_id=? ORDER BY o.order_id DESC`, [8])
  const expectedIds = [...new Set(dbOrders.map(r => r.order_id))]
  const r1 = J((await req('GET', '/orderList', null, auth)).body)
  check('code=200', r1.code === 200, JSON.stringify(r1).slice(0, 120))
  check(`订单数一致（库中 ${expectedIds.length} 单）`, r1.data.length === expectedIds.length,
    `接口返回 ${r1.data.length}`)
  check('订单号集合一致', JSON.stringify(r1.data.map(o => o.order_id)) === JSON.stringify(expectedIds),
    JSON.stringify(r1.data.map(o => o.order_id)))
  const allHaveGoods = r1.data.every(o => Array.isArray(o.goods) && o.goods.length > 0)
  check('每个订单都有 goods 明细', allHaveGoods,
    JSON.stringify(r1.data.map(o => [o.order_id, o.goods.length])))
  const detailCount = r1.data.reduce((s, o) => s + o.goods.length, 0)
  check(`明细总数一致（库中 ${dbOrders.length} 条）`, detailCount === dbOrders.length, `接口 ${detailCount}`)
  const sample = r1.data[0] && r1.data[0].goods[0]
  check('明细含 price/goodsname/img/num', sample &&
    ['price', 'goodsname', 'img', 'num'].every(k => sample[k] !== undefined), JSON.stringify(sample))
  check('订单含 recipient/totalprice/orderDate', r1.data[0] &&
    ['recipient', 'totalprice', 'orderDate'].every(k => r1.data[0][k] !== undefined),
    JSON.stringify(Object.keys(r1.data[0] || {})))

  console.log('\n===== 用例 2：其他用户的订单不会混进来 =====')
  const other = await login('Twistzz', '123456', false)
  const r2 = J((await req('GET', '/orderList', null, { Authorization: 'Bearer ' + other.data.token })).body)
  const allMine = r2.data.every(o => Number(o.u_id) === 9)
  check('Twistzz 只看到自己的订单', allMine, JSON.stringify(r2.data.map(o => [o.order_id, o.u_id])))
  check('与 admin 的订单无交集',
    !r2.data.some(o => r1.data.some(a => a.order_id === o.order_id)),
    `Twistzz ${r2.data.length} 单 / admin ${r1.data.length} 单`)

  console.log('\n===== 用例 3：软删订单的影响行数校验 =====')
  const r3a = J((await req('POST', '/delOrder', { id: 999999 }, auth)).body)
  check('删除不存在的订单 → code=102', r3a.code === 102, JSON.stringify(r3a))
  const r3b = J((await req('POST', '/delOrder', { id: 'abc' }, auth)).body)
  check('非法订单ID → code=102', r3b.code === 102, JSON.stringify(r3b))
  const r3c = J((await req('POST', '/delOrder', { id: 0 }, auth)).body)
  check('订单ID=0 → code=102', r3c.code === 102, JSON.stringify(r3c))

  console.log('\n===== 用例 4：remember 影响 token 有效期 =====')
  const noRemember = await login('admin', '123456', false)
  const withRemember = await login('admin', '123456', true)
  const span = (b) => b.data.exp - Math.floor(Date.now() / 1000)
  const s1 = span(noRemember), s2 = span(withRemember)
  console.log(`  未勾选有效期 ≈ ${Math.round(s1 / 60)} 分钟；勾选后 ≈ ${Math.round(s2 / 3600)} 小时`)
  check('两种情况的 exp 都被返回', noRemember.data.exp > 0 && withRemember.data.exp > 0,
    JSON.stringify([noRemember.data.exp, withRemember.data.exp]))
  check('未勾选约为 1 小时', s1 > 3000 && s1 <= 3600, `${s1} 秒`)
  check('勾选后约为 7 天', s2 > 6 * 86400 && s2 <= 7 * 86400, `${s2} 秒`)
  check('勾选后的有效期明显更长', s2 > s1, `${s2} vs ${s1}`)

  console.log('\n===== 用例 5：加购校验（库存/上架/数量）=====')
  const low = await one('SELECT g_id, stock FROM goods WHERE stock>0 AND is_delete=1 ORDER BY stock ASC LIMIT 1')
  const r5a = J((await req('POST', '/addCart', { g_id: low.g_id, num: low.stock + 1 }, auth)).body)
  check(`超库存加购被拒（库存 ${low.stock}）`, r5a.code === 102, JSON.stringify(r5a))
  await q('DELETE FROM shopcart WHERE u_id=8 AND g_id=?', [low.g_id])

  // 下架商品
  const onSale = await one('SELECT g_id FROM goods WHERE is_delete=1 AND is_sale=1 AND g_id NOT IN (2,3) ORDER BY g_id DESC LIMIT 1')
  await q('UPDATE goods SET is_sale=0 WHERE g_id=?', [onSale.g_id])
  const r5b = J((await req('POST', '/addCart', { g_id: onSale.g_id, num: 1 }, auth)).body)
  check('下架商品加购被拒', r5b.code === 102 && /下架/.test(r5b.message), JSON.stringify(r5b))
  await q('UPDATE goods SET is_sale=1 WHERE g_id=?', [onSale.g_id])
  await q('DELETE FROM shopcart WHERE u_id=8 AND g_id=?', [onSale.g_id])

  console.log('\n===== 用例 6：登录接口字段完整 =====')
  check('返回 token/username/role/exp',
    ['token', 'username', 'role', 'exp'].every(k => admin.data[k] !== undefined),
    JSON.stringify(Object.keys(admin.data)))

  console.log('\n===== 数据还原核对 =====')
  // 补齐测试期间被删掉的购物车记录（只补不回删，避免覆盖其他改动）
  for (const c of cartSnapshot) {
    await q('INSERT INTO shopcart(cart_id,u_id,g_id,num) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE num=VALUES(num)',
      [c.cart_id, c.u_id, c.g_id, c.num])
  }
  const counts = await one(`SELECT
    (SELECT COUNT(*) FROM orders) orders,
    (SELECT COUNT(*) FROM order_details) details,
    (SELECT COUNT(*) FROM shopcart WHERE u_id=8) cart8,
    (SELECT COUNT(*) FROM goods) goods`)
  console.log('  ', JSON.stringify(counts))
  check('订单/明细/购物车/商品数量与测试前一致',
    counts.orders === 10 && counts.details === 28 && counts.cart8 === cartSnapshot.length && counts.goods === 79,
    JSON.stringify(counts))

  console.log(`\n===== 结果：通过 ${pass} / 失败 ${fail} =====`)
  db.end()
})()
