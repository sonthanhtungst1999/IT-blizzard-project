const Game = require('../models/Games');
const Producer = require('../models/Producers');
const Account = require('../models/Accounts');
const Transaction = require('../models/Transactions');
const { mongooseToObject } = require('../../util/mongoose');
const { multipleMongooseToObject }    = require('../../util/mongoose');
const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
var paypal = require('paypal-rest-sdk');

require('dotenv').config({ path: './resources/.env' }) // Environments Place

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.SB_CLIENT_ID,
  'client_secret': process.env.SB_CLIENT_SECRET
});

var textUppercase = function(string){
  return string
      .toLowerCase()
      .split(' ')
      .map(function(Word) {
          return Word[0].toUpperCase() + Word.substr(1);
      })
      .join(' ');
}

var total = 1.00;
var slug_game = 0;
var version_game =0;

class PaymentController {

  //[POST] /payment
  async handler(req, res, next) {
    total = (req.query.p)/100; //price
    slug_game = req.query.g;
    version_game = req.query.v;
    let game = await Game.findOne({ slug: req.query.g});
    var create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": `http://localhost:5000/payment/success`,
          "cancel_url": `${req.headers.referer}`
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": textUppercase(game.name),
                  "sku": req.query.v,
                  "price": (req.query.p)/100,
                  "currency": "USD",
                  "quantity": 1
              }]
          },
          "amount": {
              "currency": "USD",
              "total": (req.query.p)/100
          },
          "description": ""
      }]
    };
    
    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
          // throw error;
          res.json('')
      } else {
          // console.log("Create Payment Response");
          // console.log(payment);
          // res.json(payment)
          payment.links.forEach(link => {
            if(link.rel == 'approval_url') res.redirect(link.href);
          });
      }
    });
  }


  async success(req, res, next) {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const isUser = res.locals.user; //recieve user from middleware
    let user = await Account.findOne({_id: isUser.sub})
    user = mongooseToObject(user); // toObject user rule handlebars
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
              "currency": "USD",
              "total": total
          }
      }]
    };
  
    paypal.payment.execute(paymentId, execute_payment_json,async function (error, payment) {
      if (error) {
         console.log(error.response);
         throw error;
      } else {
        // console.log('get payment response');
        // console.log(JSON.stringify(payment))
        let game = await Game.findOne({ slug: slug_game});
        // let user = await Account.findOne({_id: req.signedCookies.userId});

        // --------------- Generate Code ---------------
        var code = Math.random().toString(36).substring(2, 12)

        //Create instance Transaction Database
        const transaction = new Transaction({
          owner: user.email,
          game: game.name,
          version: version_game,
          price: total*100,
          code: code
        });
        await transaction.save(); //Save transaction on database

        //Send mail
        //step 1
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.NM_USERNAME,
              pass: process.env.NM_PASSWORD
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

        //step 2
        let nameGame = game.name.toUpperCase();
        let versionGame = version_game.toUpperCase();
        let mailOptions = {
            from: 'nodejsb1706778@gmail.com',
            to: user.email,
            subject: 'Blizzard - Successful Transaction !!! ('+nameGame+ ':  '+versionGame+')',
            template: 'nodeMailer',
            context: {
                user,
                code: code.toUpperCase()
            }
        }

        //step 3
        transporter.sendMail(mailOptions)
        .then(response => {
            return;
        })
        .catch(err => {
            transaction.status = 'Pending';
            transaction.save();
            return;
        })
        //Link redirect
        let link = '/product/gift/' + slug_game + '?v=' + version_game;

        //Sweet alert message
        req.session.message = {
          type: process.env.SWAL_SUCCESS,
          title: 'Successful Transaction',
          content: 'Code will be sent to your email'
        }
        //Start redirect
        res.redirect(link);
        return;
      }
  });
  }

}
module.exports = new PaymentController;