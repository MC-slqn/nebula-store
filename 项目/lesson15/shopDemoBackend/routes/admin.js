var express = require('express');
var router = express.Router();
var isAdmin = require('../middleware/isAdmin')
var { adminGetGoodsList, adminAddGoods, adminUpdateGoods, adminDeleteGoods } = require('../controls/adminGoodsCtrl')

/*
 * 注意：这里必须逐条路由挂 isAdmin，不能用 router.use(isAdmin)。
 * 因为 express.Router() 的 use() 中间件会对所有流经该 Router 的请求执行，
 * 不论路径是否匹配 —— 写成 router.use 会把 /login、/goodsList 等所有请求一起拦下。
 */

// 获取全局商品列表（后台管理）
router.get('/admin/goodsList', isAdmin, adminGetGoodsList)

// 入库新商品
router.post('/admin/addGoods', isAdmin, adminAddGoods)

// 修改商品信息
router.post('/admin/updateGoods', isAdmin, adminUpdateGoods)

// 销毁商品
router.post('/admin/deleteGoods', isAdmin, adminDeleteGoods)

module.exports = router;
