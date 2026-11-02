// 临时验证脚本（P0-5 管理员权限）：走真实接口断言，不写库（只读接口）
const http = require('http')

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
const login = async (u, p) => {
  const r = await req('POST', '/login', { username: u, password: p })
  return { status: r.status, body: J(r.body) }
}

;(async () => {
  console.log('\n===== 用例 1：登录接口返回 role =====')
  const adminLogin = await login('admin', '123456')
  check('admin 登录 → role=1', adminLogin.body.code === 200 && adminLogin.body.data.role === '1',
    JSON.stringify(adminLogin.body.data))
  const userLogin = await login('Twistzz', '123456')
  check('Twistzz 登录 → role=0', userLogin.body.code === 200 && userLogin.body.data.role === '0',
    JSON.stringify(userLogin.body.data))
  const u3 = await login('7878', '123456')
  check('7878 登录 → role=0', u3.body.code === 200 && u3.body.data.role === '0', JSON.stringify(u3.body.data))

  const adminAuth = { Authorization: 'Bearer ' + adminLogin.body.data.token }
  const userAuth = { Authorization: 'Bearer ' + userLogin.body.data.token }

  console.log('\n===== 用例 2：管理员可以访问后台接口 =====')
  const a1 = await req('GET', '/admin/goodsList', null, adminAuth)
  check('/admin/goodsList → HTTP 200 且 code=200', a1.status === 200 && J(a1.body).code === 200,
    `HTTP ${a1.status} | ${a1.body.slice(0, 120)}`)
  check('返回商品数量 > 0', Array.isArray(J(a1.body).data) && J(a1.body).data.length > 0)

  console.log('\n===== 用例 3：普通用户（修复前可以随意改价删商品）→ 必须 403 =====')
  const endpoints = [
    ['GET', '/admin/goodsList', null],
    ['POST', '/admin/addGoods', { goodsname: '越权测试', price: 1, stock: 1, img: '', c_id: 1, introduce: 'x', is_sale: 1 }],
    ['POST', '/admin/updateGoods', { g_id: 1, price: 0.01 }],
    ['POST', '/admin/deleteGoods', { g_id: 1 }]
  ]
  for (const [m, p, b] of endpoints) {
    const r = await req(m, p, b, userAuth)
    check(`普通用户 ${m} ${p} → HTTP 403`, r.status === 403 && J(r.body).code === 403,
      `HTTP ${r.status} | ${r.body.slice(0, 120)}`)
  }

  console.log('\n===== 用例 4：未登录访问后台 → HTTP 401（不是 403）=====')
  const r4 = await req('GET', '/admin/goodsList')
  check('无 token → HTTP 401', r4.status === 401, `HTTP ${r4.status} | ${r4.body.slice(0, 100)}`)

  console.log('\n===== 用例 5：普通用户的非后台接口不受影响 =====')
  const r5 = await req('GET', '/shopcartList', null, userAuth)
  check('Twistzz /shopcartList → HTTP 200', r5.status === 200 && J(r5.body).code === 200,
    `HTTP ${r5.status} | ${r5.body.slice(0, 100)}`)
  const r5b = await req('GET', '/orderList', null, userAuth)
  check('Twistzz /orderList → HTTP 200', r5b.status === 200, `HTTP ${r5b.status}`)

  console.log('\n===== 用例 6：公开接口仍无需登录 =====')
  const r6 = await req('GET', '/goodsList?page=1&pageSize=2')
  check('未登录 /goodsList → code=200', r6.status === 200 && J(r6.body).code === 200, `HTTP ${r6.status}`)

  console.log('\n===== 用例 7：数据库里 role 字段的分布 =====')
  const { mysql, dbConfig } = require('./_db')
  const db = mysql.createPool(dbConfig)
  const rows = await new Promise((res, rej) => db.query('SELECT username, role, status FROM users ORDER BY u_id', (e, r) => e ? rej(e) : res(r)))
  console.log('  ', JSON.stringify(rows))
  const admins = rows.filter(r => String(r.role) === '1')
  check('恰好只有 admin 一个管理员', admins.length === 1 && admins[0].username === 'admin', JSON.stringify(admins))
  db.end()

  console.log(`\n===== 结果：通过 ${pass} / 失败 ${fail} =====`)
})()
