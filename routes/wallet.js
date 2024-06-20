const express = require('express');
const router = express.Router();

const walletController = require('../controllers/wallet');

router.get('/total-balance', walletController.getAccountTotal);
router.get('/spot-usdt-balance', walletController.getSpotUSDT);

module.exports = router;
