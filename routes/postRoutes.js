const express = require('express');
const CommentController = require('../controllers/commentController');
const LikeController = require('../controllers/likeController');
const PostController = require('../controllers/postController');
const { requireAuth, optionalAuth } = require('../middlewares/authMiddleware');
const loadPost = require('../middlewares/loadPost');
const uploadPostMedia = require('../middlewares/uploadPostMedia');

const router = express.Router();

router.get('/', optionalAuth, PostController.getAll);
router.post('/', requireAuth, uploadPostMedia, PostController.create);

router.get('/:post_id', optionalAuth, loadPost, PostController.getById);
router.patch('/:post_id', requireAuth, loadPost, PostController.update);
router.delete('/:post_id', requireAuth, loadPost, PostController.delete);

router.get('/:post_id/categories', optionalAuth, loadPost, PostController.getCategories);

router.get('/:post_id/comments', optionalAuth, loadPost, CommentController.getByPost);
router.post('/:post_id/comments', requireAuth, loadPost, CommentController.createForPost);

router.get('/:post_id/like', optionalAuth, loadPost, LikeController.getByPost);
router.post('/:post_id/like', requireAuth, loadPost, LikeController.createForPost);
router.delete('/:post_id/like', requireAuth, loadPost, LikeController.deleteForPost);

module.exports = router;
