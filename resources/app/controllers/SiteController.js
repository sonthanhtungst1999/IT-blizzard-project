const Game = require('../models/Games');
const Producer = require('../models/Producers');
const Account = require('../models/Accounts');
const { multipleMongooseToObject, mongooseToObject } = require('../../util/mongoose');
const jwt = require('jsonwebtoken');

class SiteController {

    //[GET] /home
    index(req, res, next) {
        let isUser = res.locals.user || undefined;
        if(isUser){ // if user login system
            Account.findOne({_id: isUser.sub})
                .then(user => {
                    res.locals.user = mongooseToObject(user);
                })
                .catch(next)
        }
        Promise.all([Producer.find({}), Game.find({})])
            .then( ([producers, games]) => {
                res.render('home', {
                    producers: multipleMongooseToObject(producers),
                    games: multipleMongooseToObject(games),
                });
                return;
            })
            .catch(next)
    }
}
module.exports = new SiteController;
