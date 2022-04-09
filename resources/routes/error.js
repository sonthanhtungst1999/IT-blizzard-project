const express = require('express');
var router = express.Router()
const errorController = require('../app/controllers/ErrorController')

router.get("/", errorController.error404);

module.exports = router;