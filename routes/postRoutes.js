const express = require('express');
const router = express.Router();
const PostController = require('../controllers/PostController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const uploadPostMedia = require('../middlewares/uploadPostMedia');

router.post('/', AuthMiddleware, uploadPostMedia, PostController.create);
router.get('/', PostController.getAll);
router.get('/:post_id', PostController.getById);

module.exports = router;