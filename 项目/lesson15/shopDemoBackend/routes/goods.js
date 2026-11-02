var express = require('express');
var router = express.Router();
var { showGoodsList, showCategory, showGoodsDetails } = require('../controls/goodsCtrl')

// 获取所有商品信息（上架、未删除、支持分页）
router.get('/goodsList', showGoodsList)

// 获取分类列表
router.get('/category', showCategory)

// 获取商品详情
router.get('/goodsDetails/:id', showGoodsDetails)

module.exports = router;
