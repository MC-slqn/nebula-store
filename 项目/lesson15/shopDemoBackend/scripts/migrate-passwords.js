/*
 * 明文密码 -> bcrypt 哈希 的一次性迁移脚本
 *
 * 为什么需要它：
 *   改造前 users.password 存的是明文，登录靠 `WHERE username=? AND password=?` 匹配。
 *   改成 bcrypt 之后哈希无法用 SQL 等值匹配，历史数据必须先哈希化，
 *   否则 admin / Twistzz / 7878 三个账号会全部登不进去。
 *
 * 用法（在 shopDemoBackend 目录下执行）：
 *   node scripts/migrate-passwords.js            # 预演：只报告会改什么，不动数据（默认）
 *   node scripts/migrate-passwords.js --apply    # 真正写入
 *
 * 特性：
 *   - 默认 dry-run，避免手滑
 *   - 幂等：已经是 bcrypt 哈希的记录自动跳过，可以反复执行
 *   - 执行前请先备份数据库
 */
const bcrypt = require('bcrypt')
const { dbsqlAsync, pool } = require('../model/index')
const { isHashed } = require('../controls/userCtrl')

const APPLY = process.argv.includes('--apply')
const SALT_ROUNDS = 10

;(async () => {
    const rows = await dbsqlAsync('SELECT u_id, username, password FROM users ORDER BY u_id;', [])
    console.log(`共读取到 ${rows.length} 个用户\n`)

    const todo = []
    for (const r of rows) {
        const pwd = String(r.password == null ? '' : r.password)
        if (isHashed(pwd)) {
            console.log(`  skip   u_id=${r.u_id}  ${r.username}  已是 bcrypt 哈希`)
        } else if (pwd === '') {
            console.log(`  warn   u_id=${r.u_id}  ${r.username}  密码为空，跳过`)
        } else {
            todo.push(r)
            console.log(`  plan   u_id=${r.u_id}  ${r.username}  明文 ${pwd.length} 位，待哈希`)
        }
    }

    if (todo.length === 0) {
        console.log('\n没有需要迁移的记录。')
        pool.end()
        return
    }

    if (!APPLY) {
        console.log(`\n[预演] 共 ${todo.length} 条待迁移，本次没有改动任何数据。`)
        console.log('确认无误后加 --apply 真正执行（建议先备份数据库）。')
        pool.end()
        return
    }

    console.log(`\n开始写入 ${todo.length} 条…`)
    for (const r of todo) {
        const hash = await bcrypt.hash(String(r.password), SALT_ROUNDS)
        await dbsqlAsync('UPDATE users SET password=? WHERE u_id=?;', [hash, r.u_id])
        console.log(`  done   u_id=${r.u_id}  ${r.username}`)
    }
    console.log('\n迁移完成。请用原密码登录三个测试账号验证。')
    pool.end()
})().catch((err) => {
    console.error('\n迁移失败：', err.message)
    pool.end()
    process.exit(1)
})
