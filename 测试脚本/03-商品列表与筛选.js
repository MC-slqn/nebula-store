// 临时验证脚本（P0-3 商品列表筛选 / 分页健壮性）：只读，不写库
const http = require('http')
const { mysql, dbConfig } = require('./_db')

const db = mysql.createPool(dbConfig)
const one = (sql, p = []) => new Promise((res, rej) => db.query(sql, p, (e, r) => e ? rej(e) : res(r[0])))

function get(path) {
  return new Promise((resolve) => {
    const r = http.request({ host: '127.0.0.1', port: 3000, path, method: 'GET' }, (res) => {
      let out = ''
      res.on('data', (c) => (out += c))
      res.on('end', () => resolve({ status: res.statusCode, body: out }))
    })
    r.on('error', (e) => resolve({ status: 'ERR', body: e.message }))
    r.end()
  })
}
const J = (s) => { try { return JSON.parse(s) } catch { return s } }
let pass = 0, fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✅ ${name}`) }
  else { fail++; console.log(`  ❌ ${name}  →  ${detail}`) }
}

;(async () => {
  const totalSellable = (await one("SELECT COUNT(*) c FROM goods WHERE is_delete=1 AND is_sale=1")).c
  const freeCount = (await one("SELECT COUNT(*) c FROM goods WHERE is_delete=1 AND is_sale=1 AND price<=0")).c
  const cat2 = (await one("SELECT COUNT(*) c FROM goods WHERE is_delete=1 AND is_sale=1 AND c_id=2")).c
  console.log(`\n  数据库基准: 可售商品 ${totalSellable} 件 / 其中免费(price<=0) ${freeCount} 件 / c_id=2 分类 ${cat2} 件`)

  console.log('\n===== 用例 1：默认分页 =====')
  const r1 = J((await get('/goodsList')).body)
  check('code=200 且返回 list/total', r1.code === 200 && Array.isArray(r1.data.list), JSON.stringify(r1).slice(0, 150))
  check(`total 等于可售商品数(${totalSellable})`, r1.data.total === totalSellable, `实际 ${r1.data.total}`)
  check('默认每页 8 条', r1.data.list.length === 8, `实际 ${r1.data.list.length}`)

  console.log('\n===== 用例 2：page 参数鲁棒性（修复前 page=0 报 SQL 语法错）=====')
  for (const [name, qs] of [
    ['page=0', 'page=0&pageSize=4'],
    ['page=-5', 'page=-5&pageSize=4'],
    ['pageSize=abc', 'page=1&pageSize=abc'],
    ['page=abc', 'page=abc&pageSize=4'],
    ['pageSize=99999', 'page=1&pageSize=99999'],
    ['全空', 'page=&pageSize=']
  ]) {
    const r = J((await get('/goodsList?' + qs)).body)
    check(`${name} → code=200 且返回条数正常`, r.code === 200 && r.data.list.length > 0 && r.data.list.length <= 100,
      JSON.stringify(r).slice(0, 120))
  }

  console.log('\n===== 用例 3：免费开玩筛选（maxPrice=0）=====')
  const r3 = J((await get('/goodsList?maxPrice=0&page=1&pageSize=100')).body)
  check('code=200', r3.code === 200, JSON.stringify(r3).slice(0, 120))
  check(`返回条数等于免费商品数(${freeCount})`, r3.data.list.length === freeCount, `实际 ${r3.data.list.length}`)
  check(`total 也等于 ${freeCount}`, r3.data.total === freeCount, `实际 ${r3.data.total}`)
  const allFree = r3.data.list.every(g => Number(g.price) === 0)
  check('返回的每一条 price 都是 0（修复前混入付费商品）', allFree,
    '付费商品: ' + JSON.stringify(r3.data.list.filter(g => Number(g.price) !== 0).map(g => `${g.goodsname}/${g.price}`)))
  check('不再依赖 page:2 这类分页技巧', r3.data.list.length > 20 || freeCount <= 20,
    `免费商品 ${r3.data.list.length} 件`)

  console.log('\n===== 用例 4：分类筛选（c_id）=====')
  const r4 = J((await get('/goodsList?c_id=2&page=1&pageSize=100')).body)
  check('code=200', r4.code === 200, JSON.stringify(r4).slice(0, 120))
  check(`返回条数等于 c_id=2 的分类商品数(${cat2})`, r4.data.list.length === cat2, `实际 ${r4.data.list.length}`)
  check('返回的每一条 c_id 都是 2', r4.data.list.every(g => Number(g.c_id) === 2))

  console.log('\n===== 用例 5：组合筛选 + 分页边界 =====')
  const r5 = J((await get('/goodsList?c_id=2&maxPrice=0&page=1&pageSize=3')).body)
  check('c_id=2 且免费 → 返回不超过 3 条', r5.code === 200 && r5.data.list.length <= 3, JSON.stringify(r5.data.list.length))
  const r6 = J((await get('/goodsList?page=99999&pageSize=8')).body)
  check('超出范围的页码 → 空列表但不报错', r6.code === 200 && r6.data.list.length === 0 && r6.data.total === totalSellable,
    JSON.stringify(r6).slice(0, 120))
  const r7 = J((await get('/goodsList?c_id=999&page=1&pageSize=8')).body)
  check('不存在的分类 → 空列表但不报错', r7.code === 200 && r7.data.list.length === 0, JSON.stringify(r7).slice(0, 120))

  console.log(`\n===== 结果：通过 ${pass} / 失败 ${fail} =====`)
  db.end()
})()
