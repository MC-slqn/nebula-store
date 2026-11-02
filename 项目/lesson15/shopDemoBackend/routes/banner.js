var express = require('express');
var router = express.Router();
var { showBannerList } = require('../controls/bannerCtrl')

// 获取首页轮播图列表
router.get('/bannerList', showBannerList)

module.exports = router;
