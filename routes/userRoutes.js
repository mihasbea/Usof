const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController")
const AuthMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");
const requireOwnerOrAdmin = require('../middlewares/requireOwnerOrAdmin');
const upload = require('../middlewares/uploadAvatar');

router.get('/', UserController.getAll);
router.patch('/avatar', AuthMiddleware, upload.single('avatar'), UserController.uploadAvatar);
router.get('/:user_id', UserController.getById);
router.post('/', AuthMiddleware, requireAdmin, UserController.create);
router.patch('/:user_id', AuthMiddleware, requireOwnerOrAdmin, UserController.update);
router.delete('/:user_id', AuthMiddleware, requireOwnerOrAdmin, UserController.delete);

module.exports = router;