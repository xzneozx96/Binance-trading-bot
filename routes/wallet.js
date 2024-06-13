const express = require("express");
const router = express.Router();

const walletController = require("../controllers/wallet");

router.get("/total-balance", walletController.getBalance);

module.exports = router;
