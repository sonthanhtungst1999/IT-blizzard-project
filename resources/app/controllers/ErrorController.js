
class ErrorController {
    //[GET] 404 not found
    error404(req, res, next) {
        res.render('404');
    }
}
module.exports = new ErrorController;
