const express = require('express');
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/password-reset', AuthController.requestPasswordReset);
router.post('/password-reset/:confirm_token', AuthController.confirmPassReset);
router.get('/confirm-email/:token', AuthController.confirmEmail);

module.exports = router;
