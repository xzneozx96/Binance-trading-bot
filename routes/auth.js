const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth");

router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.get("/refreshToken", authController.refreshToken);

module.exports = router;
