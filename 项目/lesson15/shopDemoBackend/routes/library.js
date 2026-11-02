const router = require('express').Router()
const { asyncRoute } = require('../util/errors')
const { claimGame, myGames } = require('../controls/libraryCtrl')
router.post('/claimGame', asyncRoute(claimGame))
router.get('/myGames', asyncRoute(myGames))
module.exports = router
