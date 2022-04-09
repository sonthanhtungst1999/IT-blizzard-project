const Account = require('../models/Accounts');
const { mongooseToObject } = require('../../util/mongoose');
var express =require('express');
var app = express();
const jwt = require('jsonwebtoken');

class authorization {

    // Check User is login ???
    async islogin(req, res, next) {
        const accessToken = req.cookies.token;
        let isUser;
        if(!accessToken) {
            next();
        }else {
            try {
                isUser = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
                // const user = await Account.findOne({_id: isUser.sub});
                // res.locals.user = mongooseToObject(user);
                res.locals.user = isUser;
                next();
            }catch(err) {
                if(err.name == 'TokenExpiredError') {
                    res.clearCookie('token');
                    return res.redirect('back');
                } else if(err.name == 'JsonWebTokenError'){
                    res.clearCookie('token');
                    return res.redirect('/me/login') ;
                } 
            }
        }
    }

    // Required roll USER
    async loginRequire(req, res, next){
        let accessToken = req.cookies.token; // Access Token JWT
        try {
            const isUser = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            // const user = await Account.findOne({_id: isUser.sub});
            // res.locals.user = mongooseToObject(user);
            res.locals.user = isUser;
            next();
            return;
        }catch(err) {
            if(err.name == 'JsonWebTokenError'){
                res.clearCookie('token');
                return res.redirect('/me/login') ;
            } else if (err.name == 'TokenExpiredError'){
                //Sweet alert message
                req.session.message = {
                    type: process.env.SWAL_WARNING,
                    title: 'Opps...!',
                    content: 'Login session expired please login again'
                }
                res.clearCookie('token');
                return res.redirect('back');
            }
        }
    }

    // Require roll ADMIN
    async adminLoginRequire(req, res, next) {
        let accessToken = req.cookies.token;
        try {
            const isUser = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            // const user = await Account.findOne({_id: isUser.sub});
            // if(!user.isAdmin) return res.status(403).json('Access denied !!!');
            if(!isUser.isAdmin) return res.status(403).json('Access denied !!!');
            let user = await Account.findOne({_id: isUser.sub})
            res.locals.user = mongooseToObject(user);
            // res.locals.user = isUser;
            return next();
        }catch(err) {
            if(err.name == 'JsonWebTokenError'){
                res.clearCookie('token');
                return res.redirect('/me/login') ;
            } else if (err.name == 'TokenExpiredError'){
                //Sweet alert message
                req.session.message = {
                    type: process.env.SWAL_WARNING,
                    title: 'Opps...!',
                    content: 'Login session expired please login again'
                }
                res.clearCookie('token');
                return res.redirect('back');
            }
        }
    }

}


module.exports = new authorization;
 