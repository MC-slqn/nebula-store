const { asyncRoute } = require('../util/errors')
var express = require('express');
var router = express.Router();
var { doAddCart, showCart, doUpdateCartNum, doDelCart } = require('../controls/cartCtrl')

// 加入购物车
router.post('/addCart', asyncRoute(doAddCart))

// 获取当前登录用户购物车列表
router.get('/shopcartList', asyncRoute(showCart))

// 更新购物车数量
router.post('/updateCartNum', asyncRoute(doUpdateCartNum))

// 删除购物车
router.get('/delCart', asyncRoute(doDelCart))

module.exports = router;
