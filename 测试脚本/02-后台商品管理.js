// 临时验证脚本（P0-2 后台商品管理）：走真实接口 + 直连数据库断言，结束后自行还原
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

const createdGoodsIds = []
const touched = {}   // g_id -> 原始行快照

;(async () => {
  const token = J((await req('POST', '/login', { username: 'admin', password: '123456' })).body).data.token
  const auth = { Authorization: 'Bearer ' + token }

  // 选一个当前"存在且上架"的商品做测试对象
  const victim = await one('SELECT * FROM goods WHERE is_delete=1 AND g_id NOT IN (2,3,4) ORDER BY g_id DESC LIMIT 1')
  touched[victim.g_id] = { ...victim }
  console.log(`\n  测试对象: g_id=${victim.g_id} 《${victim.goodsname}》 is_delete=${victim.is_delete} is_sale=${victim.is_sale}`)

  console.log('\n===== 用例 1：销毁商品必须真的生效 =====')
  const r1 = J((await req('POST', '/admin/deleteGoods', { g_id: victim.g_id }, auth)).body)
  check('销毁返回 code=200', r1.code === 200, JSON.stringify(r1))
  const after1 = await one('SELECT is_delete FROM goods WHERE g_id=?', [victim.g_id])
  check('数据库 is_delete 已变为 0（真的删了）', Number(after1.is_delete) === 0, `实际 ${after1.is_delete}`)

  console.log('\n===== 用例 2：重复销毁必须报错，不能假成功 =====')
  const r2 = J((await req('POST', '/admin/deleteGoods', { g_id: victim.g_id }, auth)).body)
  check('重复销毁 → code=102', r2.code === 102, JSON.stringify(r2))
  check('提示"不存在或已被销毁"', /不存在|已销毁/.test(r2.message || ''), r2.message)

  console.log('\n===== 用例 3：不存在的/非法 ID 必须报错（修复前是"销毁成功"）=====')
  const r3a = J((await req('POST', '/admin/deleteGoods', { g_id: 999999 }, auth)).body)
  check('g_id=999999 → code=102', r3a.code === 102, JSON.stringify(r3a))
  const r3b = J((await req('POST', '/admin/deleteGoods', { g_id: 'abc' }, auth)).body)
  check('g_id=abc → code=102', r3b.code === 102, JSON.stringify(r3b))
  const r3c = J((await req('POST', '/admin/deleteGoods', {}, auth)).body)
  check('缺 g_id → code=102', r3c.code === 102, JSON.stringify(r3c))
  const r3d = J((await req('POST', '/admin/deleteGoods', { id: victim.g_id }, auth)).body)
  check('传旧的 id 字段 → code=102（不再假装成功）', r3d.code === 102, JSON.stringify(r3d))

  console.log('\n===== 用例 4：局部更新（修复前必然 ER_BAD_NULL_ERROR）=====')
  await q('UPDATE goods SET is_delete=1 WHERE g_id=?', [victim.g_id])   // 先恢复
  const r4 = J((await req('POST', '/admin/updateGoods', { g_id: victim.g_id, is_sale: 0 }, auth)).body)
  check('只传 {g_id,is_sale} → code=200', r4.code === 200, JSON.stringify(r4))
  const after4 = await one('SELECT goodsname,price,stock,is_sale FROM goods WHERE g_id=?', [victim.g_id])
  check('is_sale 已改为 0', Number(after4.is_sale) === 0, JSON.stringify(after4))
  check('其他字段未被清空（商品名/价格/库存保持）',
    after4.goodsname === touched[victim.g_id].goodsname &&
    Number(after4.price) === Number(touched[victim.g_id].price) &&
    Number(after4.stock) === Number(touched[victim.g_id].stock),
    JSON.stringify(after4))
  await q('UPDATE goods SET is_sale=? WHERE g_id=?', [touched[victim.g_id].is_sale, victim.g_id])

  console.log('\n===== 用例 5：新增商品的字段校验（修复前吐 MySQL NULL 错误）=====')
  const bad = [
    ['缺商品名', { price: 1, stock: 1, img: 'x.jpg', c_id: 1, introduce: 'i', is_sale: 1 }],
    ['价格为负', { goodsname: '校验用例', price: -1, stock: 1, img: 'x.jpg', c_id: 1, introduce: 'i', is_sale: 1 }],
    ['库存为负', { goodsname: '校验用例', price: 1, stock: -1, img: 'x.jpg', c_id: 1, introduce: 'i', is_sale: 1 }],
    ['分类非法', { goodsname: '校验用例', price: 1, stock: 1, img: 'x.jpg', c_id: 'abc', introduce: 'i', is_sale: 1 }]
  ]
  for (const [name, payload] of bad) {
    const r = J((await req('POST', '/admin/addGoods', payload, auth)).body)
    check(`${name} → code=102`, r.code === 102, JSON.stringify(r))
  }

  console.log('\n===== 用例 6：正常新增 → 可查 → 再销毁 =====')
  const r6 = J((await req('POST', '/admin/addGoods', {
    goodsname: '验证用临时商品', price: 9.9, stock: 3, img: '', c_id: 1, introduce: '验证脚本创建', is_sale: 1
  }, auth)).body)
  check('新增返回 code=200 且带 g_id', r6.code === 200 && r6.data && r6.data.g_id > 0, JSON.stringify(r6))
  const newId = r6.data && r6.data.g_id
  if (newId) {
    createdGoodsIds.push(newId)
    const inAdminList = J((await req('GET', '/admin/goodsList', null, auth)).body).data.some(g => g.g_id === newId)
    check('能在后台列表里查到', inAdminList)
    const r6b = J((await req('POST', '/admin/deleteGoods', { g_id: newId }, auth)).body)
    check('新增后可以销毁', r6b.code === 200, JSON.stringify(r6b))
  }

  console.log('\n===== 还原测试数据 =====')
  // 恢复被测试的商品原始 is_delete / is_sale
  for (const [gid, snap] of Object.entries(touched)) {
    await q('UPDATE goods SET is_delete=?, is_sale=?, version=? WHERE g_id=?', [snap.is_delete, snap.is_sale, snap.version, gid])
  }
  // 删除本次新建的临时商品
  for (const id of createdGoodsIds) {
    await q('DELETE FROM goods WHERE g_id=?', [id])
  }
  const restored = await one('SELECT is_delete,is_sale FROM goods WHERE g_id=?', [victim.g_id])
  const total = (await one('SELECT COUNT(*) c FROM goods')).c
  const leftover = await one('SELECT COUNT(*) c FROM goods WHERE goodsname=?', ['验证用临时商品'])
  console.log(`  g_id=${victim.g_id} 已还原: is_delete=${restored.is_delete} is_sale=${restored.is_sale}`)
  console.log(`  商品总数: ${total}，临时商品残留: ${leftover.c}`)
  check('数据已还原',
    Number(restored.is_delete) === Number(touched[victim.g_id].is_delete) &&
    Number(restored.is_sale) === Number(touched[victim.g_id].is_sale) &&
    leftover.c === 0 && total === 79,
    `total=${total} leftover=${leftover.c}`)

  console.log(`\n===== 结果：通过 ${pass} / 失败 ${fail} =====`)
  db.end()
})()
