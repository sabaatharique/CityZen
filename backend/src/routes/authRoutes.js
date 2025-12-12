const express = require('express');
const router = express.Router();
const { signup, login, verify } = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const { signupRules, loginRules } = require('../utils/validators');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', signupRules(), validateRequest, signup);
router.post('/login', loginRules(), validateRequest, login);
router.get('/verify', authMiddleware, verify);

module.exports = router;
