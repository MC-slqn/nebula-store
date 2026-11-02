// 迁移前保存完整 SQL 备份，输出位于仓库忽略的 _backup 目录。
const fs = require('fs')
const path = require('path')
const mysql = require('mysql')
const { db } = require('../config')
const conn = mysql.createConnection({ ...db, dateStrings: true, supportBigNumbers: true, bigNumberStrings: true })
const q = sql => new Promise((resolve, reject) => conn.query(sql, (err, rows) => err ? reject(err) : resolve(rows)))

async function backup() {
    const directory = path.resolve(__dirname, '../../../../_backup')
    fs.mkdirSync(directory, { recursive: true })
    const output = path.join(directory, `before-integrity-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`)
    const statements = ['SET NAMES utf8mb4;', 'SET FOREIGN_KEY_CHECKS=0;']
    await q('START TRANSACTION WITH CONSISTENT SNAPSHOT')
    try {
        const tables = await q("SHOW FULL TABLES WHERE Table_type='BASE TABLE'")
        for (const row of tables) {
            const table = mysql.escapeId(Object.values(row)[0])
            const ddl = (await q(`SHOW CREATE TABLE ${table}`))[0]['Create Table']
            statements.push(`DROP TABLE IF EXISTS ${table};`, ddl + ';')
            for (const item of await q(`SELECT * FROM ${table}`)) {
                statements.push(`INSERT INTO ${table} (${Object.keys(item).map(mysql.escapeId).join(',')}) VALUES (${Object.values(item).map(value => mysql.escape(value)).join(',')});`)
            }
        }
        await q('COMMIT')
        statements.push('SET FOREIGN_KEY_CHECKS=1;')
        fs.writeFileSync(output, statements.join('\n'), { flag: 'wx' })
        console.log(`备份完成：${output}`)
    } catch (err) {
        await q('ROLLBACK').catch(() => {})
        throw err
    }
}
backup().catch(err => { console.error(err.message); process.exitCode = 1 }).finally(() => conn.end())
