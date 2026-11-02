/*
 * 数据层 —— 操作数据库
 * 1) dbsql        : 原有的回调式查询，保持向后兼容（其余控制层无需改动）
 * 2) query        : Promise 版查询（供事务内使用）
 * 3) transaction  : 事务包装，自动 begin / commit / rollback / release
 */
const mysql = require('mysql')
const { db } = require('../config')

//连接池配置统一来自 config.js（可用环境变量覆盖）
const pool = mysql.createPool({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    database: db.database,
    multipleStatements: true
})

/**
 * 从连接池取一个连接（Promise 版）
 * @returns {Promise<mysql.PoolConnection>}
 */
const getConnection = () => new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
        if (err) return reject(err)
        resolve(conn)
    })
})

/**
 * 用指定连接执行 SQL（Promise 版，供事务内使用）
 * @param {mysql.PoolConnection} conn
 * @param {string} sql
 * @param {Array} [params]
 * @returns {Promise<any>}
 */
const query = (conn, sql, params = []) => new Promise((resolve, reject) => {
    conn.query(sql, params, (err, results) => {
        if (err) return reject(err)
        resolve(results)
    })
})

/**
 * 事务包装：回调内的所有 SQL 要么全部成功，要么全部回滚
 * @param {(conn: mysql.PoolConnection, q: (sql: string, params?: Array) => Promise<any>) => Promise<any>} fn
 * @returns {Promise<any>} fn 的返回值
 */
const transaction = async (fn) => {
    const conn = await getConnection()
    try {
        await query(conn, 'START TRANSACTION')
        const result = await fn(conn, (sql, params) => query(conn, sql, params))
        await query(conn, 'COMMIT')
        return result
    } catch (err) {
        try {
            await query(conn, 'ROLLBACK')
        } catch (rollbackErr) {
            console.log('事务回滚失败:', rollbackErr.message)
        }
        throw err
    } finally {
        conn.release()
    }
}

/**
 * Promise 版 dbsql：给 async/await 流程用（登录要用 bcrypt 异步比对，回调风格会很别扭）
 * @param {string} sql
 * @param {Array} [params]
 * @returns {Promise<any>}
 */
const dbsqlAsync = (sql, params = []) => new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
        if (err) return reject(err)
        conn.query(sql, params, (err, results) => {
            conn.release()
            if (err) return reject(err)
            resolve(results)
        })
    })
})

module.exports = {
    pool,
    getConnection,
    query,
    transaction,
    dbsqlAsync,
    // 原有回调接口保持不变
    dbsql: (sql, params, callback) => {
        pool.getConnection((err, conn) => {
            if (err) {
                console.log(err.message)
                return callback(err, null)
            }
            conn.query(sql, params, (err, results) => {
                conn.release()
                if (err) {
                    return callback(err, null)
                }
                callback(null, results)
            })
        })
    }
}
