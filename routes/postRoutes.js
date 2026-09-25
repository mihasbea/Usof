const express = require('express');
const PostController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadPostMedia = require('../middlewares/uploadPostMedia');

const router = express.Router();

router.post('/', authMiddleware, uploadPostMedia, PostController.create);
router.get('/', PostController.getAll);
router.get('/:post_id', PostController.getById);

module.exports = router;
