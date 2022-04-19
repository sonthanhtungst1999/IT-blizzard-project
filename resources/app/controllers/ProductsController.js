const Game = require('../models/Games');
const Account = require('../models/Accounts');
const { google } = require('googleapis');
const Transaction = require('../models/Transactions');
const { mongooseToObject } = require('../../util/mongoose');
const { multipleMongooseToObject }    = require('../../util/mongoose');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');
const session = require('express-session');
const jwt = require('jsonwebtoken');

class ProductsController {

    //[GET] /product/:slug
    show(req, res ,next){
        let isUser = res.locals.user || undefined; // User is login ????
        let name = req.params.slug; // get slug Game
        if(isUser){ // if user login system
            Account.findOne({_id: isUser.sub})
                .then(user => {
                    res.locals.user = mongooseToObject(user);
                })
                .catch(next)
        }
        Game.findOne({"slug": name})
            .then(game => {
                res.render('products/show', {
                    game: mongooseToObject(game)
                });
            })
    }

    //[GET] /product/pay/:slug ?v=...
    pay(req, res, next){
        let isUser = res.locals.user || undefined;

        Account.findOne({_id: isUser.sub})
            .then(user => {
                res.locals.user = mongooseToObject(user);
            })
            .catch(next)
  
        Game.findOne({ slug: req.params.slug })
            .then(game => {
               var gameVersion = game.version.filter(function(version) {
                    if(version.name == req.query.v){
                        return version;
                    }
                })
                res.render('products/pay', {
                    game: mongooseToObject(game),
                    gameVersion: mongooseToObject(...gameVersion),
                });
            })
            .catch(next);
    }

    //[GET] /product/gift/:slug ?v=...
    gift(req, res, next){
        let isUser = res.locals.user || undefined;

        Account.findOne({_id: isUser.sub})
        .then(user => {
            res.locals.user = mongooseToObject(user);
        })
        .catch(next)

        Game.findOne({ slug: req.params.slug })
            .then(game => {
               var gameVersion = game.version.filter(function(version) {
                    if(version.name == req.query.v){
                        return version;
                    }
                })

                res.render('products/gift', {
                    game: mongooseToObject(game),
                    gameVersion: mongooseToObject(...gameVersion)
                });
            })
            .catch(next);
    }

    //[POST] /product/pay/:slug/transaction?v=...
    transaction(req, res, next){
        // let isUser = res.locals.user || undefined;
        const user = res.locals.user || undefined// recieve user from middleware
        Promise.all([Account.findOne({_id: user.sub}), Game.findOne({ slug: req.params.slug })])
            .then(([account, game]) => {

                //Get blizzard Balance Account
                let priceAccount;
                if(account.blizzardBalance > 0){
                    priceAccount = (account.blizzardBalance/100).toFixed(2);
                } else {
                    priceAccount = (account.blizzardBalance).toFixed(2);
                }
                
                // console.log(priceAccount)
                //Get version Game
                let getVersionGame = game.version.filter(function(version) {
                    if(version.name == req.query.v){
                        return version;
                    }
                })
                var priceVersionGame 
                if(!(mongooseToObject(...getVersionGame).discount) || (mongooseToObject(...getVersionGame).discount)==0){
                    priceVersionGame  = (mongooseToObject(...getVersionGame).price/100).toFixed(2);
                } else {
                    priceVersionGame  = (mongooseToObject(...getVersionGame).discount/100).toFixed(2);
                }
                    
                // console.log(priceVersionGame)

                // Transaction 

                let accountNewPrice = priceAccount - priceVersionGame; // Validation price of Account

                if(accountNewPrice >= 0 ){

                    // --------------- Generate Code ---------------
                    var code = Math.random().toString(36).substring(2, 12)

                    //intance Transaction 
                    const transaction = new Transaction({
                        owner: account.email,
                        game: game.name,
                        version: req.query.v,
                        price: priceVersionGame,
                        code: code
                    });

                    Promise.all([
                        Account.updateOne({_id: user.sub}, {blizzardBalance: accountNewPrice*100}),
                        transaction.save()
                    ])
                        .then(async () => {

                            //Setup oAuth2 to send mail
                            const CLIENT_ID = process.env.CLIENT_ID
                            const CLIENT_SECRET = process.env.CLIENT_SECRET
                            const REDIRECT_URI = process.env.REDIRECT_URI
                            const REFRESH_TOKEN = process.env.REFRESH_TOKEN
                            const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
                            oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN})
                            const accessToken = await oAuth2Client.getAccessToken()
                            
                            //Send Mail 
                            //Step 1

                            let transporter = nodemailer.createTransport({
                                pool: true,
                                service: 'Gmail',
                                auth: {
                                    type: 'OAuth2',
                                    user: process.env.NM_USERNAME,
                                    clientId: CLIENT_ID,
                                    clientSecret: CLIENT_SECRET,
                                    refreshToken: REFRESH_TOKEN,
                                    accessToken: accessToken
                                }
                              });
                            var options = {
                                viewEngine: {
                                    extname: '.hbs',
                                    layoutsDir:__dirname+'../../../views/layouts',
                                    defaultLayout : 'main',
                                },
                                viewPath:__dirname+'../../../views',
                                extName: '.hbs'
                            }
                            transporter.use('compile',hbs(options))

                            // ./resources/views/
                            //Step 2
                            let nameGame = game.name.toUpperCase();
                            let versionGame = req.query.v.toUpperCase();
                            let mailOptions = {
                                from: 'Blizzard Entertainment clone <nodejsb1706778@gmail.com>',
                                to: account.email,
                                subject: 'Blizzard - Successful Transaction !!! ('+nameGame+ ':  '+versionGame+')',
                                template: 'nodeMailer',
                                context: {
                                    user: mongooseToObject(account),
                                    code: code.toUpperCase()
                                }
                            }
                            //Step 3
                            transporter.sendMail(mailOptions)
                                .then(response => {
                                    return;
                                })
                                .catch(err => {
                                    transaction.status = 'Pending';
                                    transaction.save();
                                    return;
                                })                          
                            let link = '/product/gift/' + req.params.slug + '?v=' + req.query.v;

                            //Sweet alert message
                            req.session.message = {
                                type: process.env.SWAL_SUCCESS,
                                title: 'Successful Transaction',
                                content: 'Code will be sent to your email'
                            }
                            res.redirect(link);
                            return;
                        })
                        .catch(next)
                } else {
                    reject();
                }
            })
            .catch(err => {
                //Sweet alert message
                req.session.message = {
                    type: process.env.SWAL_ERROR,
                    title: 'Opps...!',
                    content: 'The account haven\'t enough money to PAY !!!'
                }
                res.redirect('back');
                return;
            })   
    }

    //[POST]  /product/gift/:slug/active
    active(req, res, next) {
        // console.log(req.query.v);
        // console.log(req.params.slug);
        // console.log(req.body.code);
        let user = res.locals.user
        Transaction.findOne({
            $and: [
                {
                    version: req.query.v,
                }, 
                {
                    code: req.body.code.toLowerCase(),
                }
            ]
        })
            .then((transaction) => {

                //checked code and version game
                // console.log(transaction)
                return new Promise((resolve, reject) => {
                    if(transaction.version==req.query.v && transaction.code==req.body.code.toLowerCase() && transaction.isActive==false){
                        resolve(transaction);
                    } else {
                        reject('err');
                    }
                })
            })
            .catch(err => {
                res.status(400).json({
                    status: 'error',
                    error: 'Code does not exist !!!',
                  });
            })
            .then((intanceTransaction) => {
                if(!intanceTransaction){
                    return;
                } else {
                    Account.findOne({_id: user.sub})
                    .then((account) => {
                        var repository = []; // games in account

                        // seclect own games
                        var games = mongooseToObject(account.games);

                        //Tat ca cac game trong kho khong bi trung voi Transaction game chuan bi add vao`'

                        var isInsert = games.every(function(game, index) {
                            return game.name != intanceTransaction.game ;
                        })

                        var intance = {
                            name: intanceTransaction.game,
                            icon: req.body.iconGame,
                            version: req.query.v
                        }
                        // push new game
                        // console.log(isInsert)
                        return new Promise((resolve, reject) => {
                            if(isInsert){
                                repository.push(...games);
                                repository.push(intance);
                                resolve([repository, intanceTransaction]);
                            } else {
                                reject();
                            }
                        }) 
                    })
                    // add game for Account and update isActive Transaction = true
                    .then(([repository, intanceTransaction]) => {
                        Promise.all([
                            Account.updateOne({_id: user.sub}, {games: repository}),
                            Transaction.updateOne({slug: intanceTransaction.slug} , {isActive: true})
                        ])
                            .then(() => {
                                res.redirect('/');
                                return;
                            })
                    })
                    .catch(err => {
                        res.json('Account has been activated this game');
                    })
                }
            })


    }

}
module.exports = new ProductsController;
