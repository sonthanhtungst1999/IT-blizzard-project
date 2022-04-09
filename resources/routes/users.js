const express = require('express');
var router = express.Router();
const userController = require('../app/controllers/UsersController');
const auth0Middleware = require('../app/middlewares/Auth0Middleware');

router.get('/register', userController.register);
router.post('/register', userController.handleRegister);
router.get('/login', userController.login);
router.post('/login', userController.handleLogin);
router.get('/logout', userController.logout);
router.get('/setting' , auth0Middleware.loginRequire, userController.setting);
router.post('/giftcode', auth0Middleware.loginRequire, userController.handleGiftCode);

module.exports = router;