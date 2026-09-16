const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController")
const AuthMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");

router.get('/', UserController.getAll);
router.get('/:user_id', UserController.getById);
router.post('/', AuthMiddleware, requireAdmin, UserController.create);

module.exports = router;