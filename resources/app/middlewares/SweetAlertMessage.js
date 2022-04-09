
class message {
    // Get the message returned from the server
    getMessage(req, res, next){
        res.locals.message = req.session.message;
        delete req.session.message;
        next();
    }
}

module.exports = new message;
 