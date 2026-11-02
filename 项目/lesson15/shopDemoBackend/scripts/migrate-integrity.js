// 增量迁移：不删除账号或订单。MySQL DDL 会隐式提交，可重复执行恢复中断的迁移。
const { pool, getConnection, query } = require('../model/index')

const columns = [
    ['users', 'auth_version', 'INT UNSIGNED NOT NULL DEFAULT 0'],
    ['goods', 'version', 'INT UNSIGNED NOT NULL DEFAULT 0'],
    ['orders', 'request_key', 'VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL'],
    ['orders', 'request_hash', 'CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL'],
    ['order_details', 'unit_price', 'DECIMAL(10,2) NULL'],
    ['order_details', 'goodsname_snapshot', 'VARCHAR(255) NULL'],
    ['order_details', 'img_snapshot', 'VARCHAR(255) NULL']
]
const libraryDDL = `CREATE TABLE IF NOT EXISTS user_games (
    u_id INT NOT NULL,
    g_id INT NOT NULL,
    goodsname_snapshot VARCHAR(255) NOT NULL,
    img_snapshot VARCHAR(255) NULL,
    claimed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (u_id, g_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`

async function migrate() {
    const conn = await getConnection()
    let locked = false
    try {
        const rows = await query(conn, "SELECT GET_LOCK(CONCAT(DATABASE(), ':integrity-v2'), 10) AS acquired")
        locked = rows[0].acquired === 1
        if (!locked) throw new Error('另一个迁移正在运行，请稍后重试')
        // 在任何 DDL 之前检查冲突；不自动删除或合并用户。
        for (const field of ['username', 'phone']) {
            const duplicates = await query(conn, `SELECT MIN(u_id) AS first_id, COUNT(*) AS count FROM users GROUP BY ${field} HAVING COUNT(*) > 1`)
            if (duplicates.length) throw new Error(`${field} 存在重复记录（首个用户 ID: ${duplicates[0].first_id}），请核实账号归属后再迁移`)
        }
        for (const [table, column, definition] of columns) {
            const exists = await query(conn, 'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?', [table, column])
            if (!exists.length) await query(conn, `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
        }
        for (const [table, name, fields] of [
            ['users', 'uq_users_username', 'username'],
            ['users', 'uq_users_phone', 'phone'],
            ['orders', 'uq_orders_request', 'u_id, request_key']
        ]) {
            const exists = await query(conn, 'SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND INDEX_NAME=?', [table, name])
            if (!exists.length) await query(conn, `ALTER TABLE ${table} ADD UNIQUE KEY ${name} (${fields})`)
        }
        await query(conn, libraryDDL)
        // 历史成交价未知，保留 NULL；绝不将现价伪装成成交价。
        await query(conn, `UPDATE order_details d LEFT JOIN goods g ON g.g_id=d.g_id
            SET d.goodsname_snapshot=COALESCE(g.goodsname, '历史商品'), d.img_snapshot=g.img
            WHERE d.goodsname_snapshot IS NULL`)
        console.log('数据一致性迁移完成：订单快照、幂等索引、账号唯一索引、库存版本、游戏库')
    } finally {
        if (locked) await query(conn, "SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':integrity-v2'))").catch(() => {})
        conn.release()
    }
}

module.exports = { migrate, columns, libraryDDL }
if (require.main === module) migrate().catch(err => { console.error(err.message); process.exitCode = 1 }).finally(() => pool.end())
