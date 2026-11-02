const { sendError } = require('../util/errors')
const { dbsql } = require('../model/index')

// 获取首页轮播图列表
exports.showBannerList = (req, res) => {
    // 按照 sort 字段降序排列，数字越大的轮播图排在最前面
    let sql = `SELECT * FROM banners ORDER BY sort DESC;`

    dbsql(sql, [], (err, results) => {
        if (err) {
            return sendError(res, err)
        }
        res.send({ code: 200, message: null, data: results })
    })
}
