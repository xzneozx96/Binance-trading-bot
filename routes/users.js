const express = require("express");
const router = express.Router();

const userController = require("../controllers/users");

router.get("/user-list", userController.getUsers);
router.post("/create-user", userController.createUser);
router.post("/status", userController.updateStatus);
router.post("/update-user", userController.updateUser);

module.exports = router;
