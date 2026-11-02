const { asyncRoute } = require('../util/errors')
var express = require('express');
var router = express.Router();
var { doAddOrder, showOrders, showOrderDetail, doDelOrder } = require('../controls/orderCtrl')

// 提交订单
router.post('/addOrder', asyncRoute(doAddOrder))

// 查看订单列表
router.get('/orderList', asyncRoute(showOrders))

// 查看单笔订单详情
router.get('/orderDetail/:id', asyncRoute(showOrderDetail))

// 删除订单（软删除）
router.post('/delOrder', asyncRoute(doDelOrder))

module.exports = router;
