const { transaction, dbsqlAsync } = require('../model/index')
const { BusinessError } = require('../util/errors')

exports.claimGame = async (req, res) => {
    const g_id = req.body?.g_id
    if (!Number.isSafeInteger(g_id) || g_id <= 0) throw new BusinessError('商品ID不合法')
    const result = await transaction(async (conn, q) => {
        const users = await q('SELECT status FROM users WHERE u_id=? FOR UPDATE', [req.data.u_id])
        if (!users.length || String(users[0].status) !== '1') throw new BusinessError('账号不可用', 403)
        const owned = await q('SELECT g_id FROM user_games WHERE u_id=? AND g_id=?', [req.data.u_id, g_id])
        if (owned.length) return { g_id, alreadyOwned: true }
        const rows = await q('SELECT goodsname, img, price, is_sale, is_delete FROM goods WHERE g_id=? FOR UPDATE', [g_id])
        const game = rows[0]
        if (!game || game.is_sale !== 1 || game.is_delete !== 1 || Number(game.price) !== 0) throw new BusinessError('该游戏目前不可免费领取')
        // 免费数字游戏的领取不占商城购买库存。
        await q('INSERT INTO user_games(u_id,g_id,goodsname_snapshot,img_snapshot) VALUES(?,?,?,?)', [req.data.u_id, g_id, game.goodsname, game.img])
        return { g_id, alreadyOwned: false }
    })
    res.send({ code: 200, message: result.alreadyOwned ? '游戏已在游戏库中' : '已加入我的游戏库', data: result })
}

exports.myGames = async (req, res) => {
    const rows = await dbsqlAsync('SELECT g_id, goodsname_snapshot AS goodsname, img_snapshot AS img, claimed_at FROM user_games WHERE u_id=? ORDER BY claimed_at DESC, g_id DESC', [req.data.u_id])
    res.send({ code: 200, message: '', data: rows })
}
