const express = require('express');
var router = express.Router()
const productController = require('../app/controllers/ProductsController');
const auth0Middleware = require('../app/middlewares/Auth0Middleware');

router.get("/gift/:slug", auth0Middleware.loginRequire , productController.gift);
router.post('/gift/:slug', auth0Middleware.loginRequire, productController.active);
router.get("/pay/:slug", auth0Middleware.loginRequire, productController.pay);
router.post("/pay/:slug", productController.transaction);
router.get("/:slug", productController.show);



module.exports = router;