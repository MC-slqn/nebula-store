const { asyncRoute } = require('../util/errors')
var express = require('express');
var router = express.Router();
var { doLogin, doReg } = require('../controls/userCtrl')

/*
 * 说明：原先 /register 上挂了一段 multer 头像上传（存到 public/head_img），
 * 但前端从来不发文件、控制器里的 req.file 也从未被使用、users 表更没有该字段，
 * 属于死代码。这里只保留实际生效的 JSON 注册流程。
 */

// 登录
router.post('/login', asyncRoute(doLogin))

// 注册
router.post('/register', asyncRoute(doReg))

const { getProfile, updateProfile, changePassword } = require('../controls/profileCtrl')
router.get('/profile', asyncRoute(getProfile))
router.post('/profile', asyncRoute(updateProfile))
router.post('/changePassword', asyncRoute(changePassword))
module.exports = router;
