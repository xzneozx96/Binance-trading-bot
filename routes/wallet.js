const express = require('express');
const router = express.Router();

const walletController = require('../controllers/wallet');

router.get('/accountSnapshot', walletController.getBalance);

module.exports = router;
