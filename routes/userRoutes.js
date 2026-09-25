const express = require('express');
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');
const requireOwnerOrAdmin = require('../middlewares/requireOwnerOrAdmin');
const uploadAvatar = require('../middlewares/uploadAvatar');

const router = express.Router();

router.get('/', UserController.getAll);
// Must stay above '/:user_id', otherwise "avatar" would be read as a user ID.
router.patch('/avatar', authMiddleware, uploadAvatar, UserController.uploadAvatar);
router.get('/:user_id', UserController.getById);
router.post('/', authMiddleware, requireAdmin, UserController.create);
router.patch('/:user_id', authMiddleware, requireOwnerOrAdmin, UserController.update);
router.delete('/:user_id', authMiddleware, requireOwnerOrAdmin, UserController.delete);

module.exports = router;
