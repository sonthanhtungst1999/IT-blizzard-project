const paymentRouter = require('./payment');
const siteRouter = require('./site');
const productRouter = require('./products');
const userRouter = require('./users');
const adminRouter = require('./admin');
const errorRouter = require('./error');
const message = require('../app/middlewares/SweetAlertMessage')
const auth0Middleware = require('../app/middlewares/Auth0Middleware');

function route(app) {
    app.use(message.getMessage); // 'Middleware' get the message returned from the server
    app.use("/product",auth0Middleware.islogin, productRouter);
    app.use("/me", userRouter);
    app.use("/",auth0Middleware.islogin, siteRouter);
    app.use("/admin", auth0Middleware.adminLoginRequire, adminRouter);
    app.use("/payment", paymentRouter);
    app.use("*", errorRouter);
}

module.exports = route;
