const express = require('express');
const UserController = require('../controllers/userController');
const { requireAuth } = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');
const requireOwnerOrAdmin = require('../middlewares/requireOwnerOrAdmin');
const uploadAvatar = require('../middlewares/uploadAvatar');

const router = express.Router();

router.get('/', UserController.getAll);
router.patch('/avatar', requireAuth, uploadAvatar, UserController.uploadAvatar);
router.get('/:user_id', UserController.getById);
router.post('/', requireAuth, requireAdmin, UserController.create);
router.patch('/:user_id', requireAuth, requireOwnerOrAdmin, UserController.update);
router.delete('/:user_id', requireAuth, requireOwnerOrAdmin, UserController.delete);

module.exports = router;
