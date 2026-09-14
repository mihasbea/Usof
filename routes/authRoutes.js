const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const AuthMiddleware = require("../middlewares/authMiddleware");

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", AuthMiddleware, AuthController.logout);
router.post("/password-reset", AuthController.requestPasswordReset);
router.post("/password-reset/:confirm_token", AuthController.confirmPassReset);

module.exports = router;