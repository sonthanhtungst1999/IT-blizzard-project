const Account = require('../models/Accounts');
const Transaction = require('../models/Transactions');
const currencyFormat = require('../../util/currency');
const Code = require('../models/Codes');
const { mongooseToObject } = require('../../util/mongoose');
const { multipleMongooseToObject } = require('../../util/mongoose');
const md5 = require('md5');
var dateFormat = require("dateformat");
const jwt = require('jsonwebtoken');

class UsersController {

    //[GET] me/register
    register(req, res ,next){
        return res.render('users/register');
    }

    //[GET] me/login
    login(req, res, next){
        if(req.cookies.token) return res.redirect('back');
        return res.render('users/login');
    }

    //[GET] me/logout
    logout(req, res, next){
        res.clearCookie('token');
        res.redirect('/');
        return;
    }

    //[POST] me/login
    async handleLogin(req, res, next){
        let accessToken; 
        let username = req.body.email;
        let password = req.body.password;
        let hashedPassword = md5(password);
        let user = await Account.findOneWithDeleted({
            email: username,
            password: hashedPassword,
        })

        if(!user) {
            //Sweet alert message
            req.session.message = {
                type: process.env.SWAL_ERROR,
                title: 'Opps...!',
                content: 'Your mail or password does not exists'
            }
            return res.redirect('back');
        } else if(user.deletedAt) {
            //Sweet alert message
            req.session.message = {
                type: process.env.SWAL_WARNING,
                title: 'Sorry...!',
                content: 'Your account has been locked'
            }
            return res.redirect('back')              
        } else {
            //Data in Payload (JWT)
            const data = {
                sub: user.id,
                isAdmin: user.isAdmin
            }
            // Sign token PWT
            accessToken = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, {expiresIn: process.env.MAX_AGE}); 
            //Save Token JWT into Cookie
            res.cookie('token', accessToken);
            //isAdmin redirect ????
            return user.isAdmin ? res.redirect('/admin') : res.redirect('/');
        }
    }

    //[POST] me/register
    handleRegister(req, res, next){
        //validation input zip isNumber
        const account = new Account({
            fullName: req.body.fullName,
            blizzardName: req.body.blizzardName,
            email: req.body.email,
            password: md5(req.body.password), // Hash password 
            gender: req.body.gender,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            zip: req.body.zip,
            blizzardBalance: 0
        });

        Account.findOne({ email: req.body.email })
            .then(user =>  {
                if(!user){      
                    // Save user to DB
                    account.save()
                    //Sweet alert message
                    req.session.message = {
                        type: process.env.SWAL_SUCCESS,
                        title: 'Successful Register',
                        content: 'Thanks for trusting us !!!'
                    }
                    res.redirect('/me/login');
                } else {
                    //Sweet alert message
                    req.session.message = {
                        type: process.env.SWAL_ERROR,
                        title: 'Opps...!',
                        content: 'Your mail is already exists'
                    }
                    res.redirect('back');
                }
            })
            .catch(err => {
                res.status(500).json('Error Server !!!')
            })
    }


    //[GET] me/setting
    async setting(req, res, next) {
        let pageNumber = req.query.page || 1;
        let page_size = parseInt(process.env.TRANSACTION_PAGESIZE);
        // const user = res.locals.user; // recieve user from middleware
        const isUser = res.locals.user || undefined;
      
        let user = await Account.findOne({_id: isUser.sub})
        // console.log(user)
        // res.locals.user = await mongooseToObject(user); // toObject user render view

        // Select Transaction Account
        // let transaction = await Transaction.find({owner: user.email}).skip((pageNumber-1)*page_size).limit(page_size).sort({'createdAt': -1});
        let transaction = await Transaction.find({owner: user.email}).sort({'createdAt': -1});
        // Define user Balance
        var userBalance = currencyFormat.format((user.blizzardBalance/100).toFixed(2));
        transaction = multipleMongooseToObject(transaction); // toObject Transaction
        // Format Date User Transaction History
        transaction.map(transaction => {
            transaction.createdAt = dateFormat(transaction.createdAt, "mediumDate");
        })

        user = mongooseToObject(user); // to Object user
        // Format Date User games and subscriptions
        user.games.map(game => {
            game.activatedSince = dateFormat(game.activatedSince, "mediumDate");
        })
        //Render view setting
        res.render('users/setting' , {
            user,
            userBalance,
            transaction
        });
    }


    //[POST] me/giftcode
    async handleGiftCode(req, res, next) {
        let giftCode = req.body.giftcode.toLowerCase();
        let intanceGiftCode = await Code.findOne({code: giftCode});
        let userID = res.locals.user.sub; //recieve user from middleware
        let user = await Account.findOne({_id: userID})
        if (intanceGiftCode == undefined || intanceGiftCode == null || intanceGiftCode == ''){
            //Sweet alert message
            req.session.message = {
                type: process.env.SWAL_ERROR,
                title: 'Opps...!',
                content: 'Gift code does not exist !!!'
            }
            res.redirect('back'); 
            return;
        }

        if(!user){
            res.redirect('/me/login'); 
            return;
        }
       
        // All good 
        let newBlizzardBalance = user.blizzardBalance + intanceGiftCode.items;
        user.blizzardBalance = newBlizzardBalance;
        try {
            await Account.updateOne({_id: user._id}, user)
            //Sweet alert message
            req.session.message = {
                type: process.env.SWAL_SUCCESS,
                title: `+${(intanceGiftCode.items/100).toFixed(2)}$`,
                content: 'The gift has been sent to your account'
            }
            res.redirect('back');        
        } catch (error) {
            res.json('DB error !!! does not save');
        }         
    }
}

module.exports = new UsersController;
