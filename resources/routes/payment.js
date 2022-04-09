const express = require('express');
var router = express.Router()

const paymentController = require('../app/controllers/PaymentController');

router.post("/", paymentController.handler);
router.get("/success", paymentController.success)

module.exports = router;