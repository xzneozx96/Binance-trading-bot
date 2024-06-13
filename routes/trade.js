const express = require("express");
const router = express.Router();

const tradeController = require("../controllers/trade");

router.post("/new-future-order", tradeController.newFutureOrder);

module.exports = router;
