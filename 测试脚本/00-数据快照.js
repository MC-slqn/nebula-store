// 数据完整性哨兵：记录/比对数据库关键状态，用于抓出回归脚本造成的数据漂移
// 用法：
//   node "测试脚本\00-数据快照.js" save     记录当前状态
//   node "测试脚本\00-数据快照.js" check    与上次记录比对（有差异则退出码 1）
const fs = require('fs')
const path = require('path')
const { mysql, dbConfig } = require('./_db')

const SNAP = path.join(__dirname, '.snapshot.json')

const db = mysql.createPool(dbConfig)
const q = (sql, p = []) => new Promise((res, rej) => db.query(sql, p, (e, r) => e ? rej(e) : res(r)))

const collect = async () => {
  const tables = ['users', 'goods', 'banners', 'category', 'shopcart', 'orders', 'order_details']
  const counts = {}
  for (const t of tables) counts[t] = (await q(`SELECT COUNT(*) c FROM ${t}`))[0].c
  // 关键业务明细：购物车全表 + 订单表 + 每个商品的库存
  const cart = await q('SELECT cart_id,u_id,g_id,num FROM shopcart ORDER BY cart_id')
  const orders = await q('SELECT order_id,u_id,recipient,totalprice,is_delete FROM orders ORDER BY order_id')
  const details = await q('SELECT details_id,order_id,g_id,num FROM order_details ORDER BY details_id')
  const stock = await q('SELECT g_id,stock,is_sale,is_delete FROM goods ORDER BY g_id')
  const users = await q('SELECT u_id,username,role,status FROM users ORDER BY u_id')
  return { counts, cart, orders, details, stock, users }
}

;(async () => {
  const mode = process.argv[2] || 'check'
  const now = await collect()

  if (mode === 'save') {
    fs.writeFileSync(SNAP, JSON.stringify(now, null, 2), 'utf8')
    console.log('已记录数据快照到', SNAP)
    console.log('表行数:', JSON.stringify(now.counts))
    console.log('购物车:', JSON.stringify(now.cart))
    db.end()
    return
  }

  if (!fs.existsSync(SNAP)) {
    console.log('尚无快照，先执行 save')
    db.end()
    process.exit(0)
  }
  const before = JSON.parse(fs.readFileSync(SNAP, 'utf8'))

  let diff = 0
  const report = (label, a, b) => {
    const same = JSON.stringify(a) === JSON.stringify(b)
    console.log(`  ${same ? '✅' : '❌'} ${label}`)
    if (!same) {
      diff++
      console.log('      记录:', JSON.stringify(a))
      console.log('      现在:', JSON.stringify(b))
    }
  }
  console.log('===== 数据完整性比对 =====')
  report('各表行数', before.counts, now.counts)
  report('购物车明细', before.cart, now.cart)
  report('订单表', before.orders, now.orders)
  report('订单明细表', before.details, now.details)
  report('商品库存/上下架', before.stock, now.stock)
  report('用户与角色', before.users, now.users)

  console.log(diff === 0 ? '\n✅ 数据与快照完全一致，无漂移' : `\n❌ 发现 ${diff} 处数据漂移`)
  db.end()
  process.exit(diff === 0 ? 0 : 1)
})()
