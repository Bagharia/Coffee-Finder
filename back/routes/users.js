const express = require('express');
const router = express.Router();
const { register, login, getProfile, changePassword } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.put('/change-password', authenticateToken, changePassword);

module.exports = router;
