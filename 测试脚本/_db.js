/*
 * 测试脚本共用的数据库连接配置
 *
 * 为什么要抽出来：
 *   以前 8 支脚本各写一份 `password: '123456'`，而且用机器绝对路径去 require 后端的 mysql 驱动，
 *   换台机器 / 换个目录就全部跑不起来，推到公开仓库还会泄露数据库口令。
 *
 * 现在：
 *   - 默认值与后端 shopDemoBackend/config.js 保持一致，可用环境变量覆盖
 *   - mysql 驱动从后端工程借用，测试脚本不必单独装依赖
 *   - 路径相对本文件定位，仓库 clone 到任何位置都能跑
 */
const path = require('path')
const { createRequire } = require('module')

// 相对本文件推出后端工程位置：测试脚本/ -> 项目/lesson15/shopDemoBackend
const backendPkg = path.join(__dirname, '..', '项目', 'lesson15', 'shopDemoBackend', 'package.json')
const backendRequire = createRequire(backendPkg)
const mysql = backendRequire('mysql')

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'vue-demo12',
    multipleStatements: true
}

module.exports = { mysql, dbConfig }
