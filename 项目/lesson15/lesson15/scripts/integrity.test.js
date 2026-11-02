import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, basename } from 'node:path'
import { buildGoodsUpdate } from '../src/utils/goodsPayload.js'

const original = { g_id: 1, goodsname: 'game', price: 10, stock: 10, version: 2 }
test('只修改名称不提交旧库存', () => {
  assert.deepEqual(buildGoodsUpdate({ ...original, goodsname: 'new' }, original), { g_id: 1, goodsname: 'new' })
})
test('修改库存时携带读取时的版本', () => {
  assert.deepEqual(buildGoodsUpdate({ ...original, stock: 11 }, original), { g_id: 1, stock: 11, version: 2 })
})
test('未修改时不发起更新', () => assert.equal(buildGoodsUpdate({ ...original }, original), null))
test('路由组件路径在区分大小写的系统上也可解析', () => {
  const router = fileURLToPath(new URL('../src/router/index.js', import.meta.url))
  for (const match of readFileSync(router, 'utf8').matchAll(/import\(['"]([^'"]+\.vue)['"]\)/g)) {
    const target = resolve(dirname(router), match[1])
    assert.ok(readdirSync(dirname(target)).includes(basename(target)), match[1])
  }
})
