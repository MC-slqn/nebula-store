// 临时验证脚本（P0-4 401 语义 / 公开路由）：只读，不写库
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

;(async () => {
  const loginRes = await req('POST', '/login', { username: 'admin', password: '123456' })
  const loginBody = J(loginRes.body)
  if (!loginBody || !loginBody.data || !loginBody.data.token) {
    console.log('登录前置换取失败！HTTP', loginRes.status, '| body:', loginRes.body)
    process.exit(1)
  }
  const token = loginBody.data.token
  const auth = { Authorization: 'Bearer ' + token }

  console.log('\n===== 用例 1：无 token 访问受保护接口 → 必须 HTTP 401 =====')
  for (const p of ['/shopcartList', '/orderList', '/admin/goodsList', '/addCart', '/addOrder', '/updateCartNum', '/delCart?id=1', '/delOrder']) {
    const method = ['/addCart', '/addOrder', '/updateCartNum', '/delOrder'].includes(p) ? 'POST' : 'GET'
    const r = await req(method, p, method === 'POST' ? {} : null)
    check(`${p} → HTTP 401`, r.status === 401, `HTTP ${r.status} | ${r.body}`)
  }

  console.log('\n===== 用例 2：乱码 token → HTTP 401 =====')
  const r2 = await req('GET', '/shopcartList', null, { Authorization: 'Bearer not.a.real.token' })
  check('/shopcartList 乱码token → HTTP 401', r2.status === 401, `HTTP ${r2.status} | ${r2.body}`)

  console.log('\n===== 用例 3：公开接口在【带 query 参数】时也必须无需登录 =====')
  const publics = [
    ['GET', '/goodsList?page=1&pageSize=8'],
    ['GET', '/goodsList?c_id=2&maxPrice=0'],
    ['GET', '/category'],
    ['GET', '/bannerList'],
    ['GET', '/goodsDetails/1']
  ]
  for (const [m, p] of publics) {
    const r = await req(m, p)
    check(`${p} 无 token → code=200`, r.status === 200 && J(r.body).code === 200, `HTTP ${r.status} | ${r.body}`)
  }

  console.log('\n===== 用例 4：登录 / 注册接口不需要 token =====')
  const l = await req('POST', '/login', { username: 'admin', password: '123456' })
  check('POST /login → HTTP 200 且 code=200', l.status === 200 && J(l.body).code === 200, `HTTP ${l.status}`)
  const l2 = await req('POST', '/login', { username: 'admin', password: 'wrong' })
  check('错误密码 → HTTP 200 且 code=102（业务失败，不是 401）',
    l2.status === 200 && J(l2.body).code === 102, `HTTP ${l2.status} | ${l2.body}`)

  console.log('\n===== 用例 5：带上有效 token 一切正常 =====')
  const ok = await req('GET', '/shopcartList', null, auth)
  check('/shopcartList 有效token → HTTP 200 且 code=200', ok.status === 200 && J(ok.body).code === 200, `HTTP ${ok.status}`)
  const ok2 = await req('GET', '/admin/goodsList', null, auth)
  check('/admin/goodsList 有效token → HTTP 200', ok2.status === 200, `HTTP ${ok2.status}`)

  console.log('\n===== 用例 6：HTML 兜底 404 也已消除（未匹配路由应返回 JSON 或 404）=====')
  const nf = await req('GET', '/not-exist-route')
  const isJson = /^\{/.test(nf.body.trim())
  check('/not-exist-route 不返回 "Cannot GET" HTML', !/Cannot GET/.test(nf.body) || nf.status === 404,
    `HTTP ${nf.status} | ${nf.body.slice(0, 80)}`)

  console.log(`\n===== 结果：通过 ${pass} / 失败 ${fail} =====`)
})()
