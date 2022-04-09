const Game = require('../models/Games');
const Account = require('../models/Accounts');
const Transaction = require('../models/Transactions');
const Producer = require('../models/Producers');
const { mongooseToObject } = require('../../util/mongoose');
const { multipleMongooseToObject }    = require('../../util/mongoose');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');
var dateFormat = require("dateformat");
const currencyFormat = require('../../util/currency');
const md5 = require('md5');
const { rejects } = require('assert');
const fs = require('fs');
const { findOne, find } = require('../models/Games');
const { resolve } = require('dns');


class AdminController {
    

    //[GET] /admin/logout
    logout(req, res, next){
        res.clearCookie('token');
        res.redirect('/');
        return;        
    }
    

    //[GET] /admin
    async show(req, res, next){
        let TransactionPending = await Transaction.find({status: 'Pending'})
        let transaction = await Transaction.find({});
        let countBannedAccount = await Account.countDocumentsDeleted();
        let revenue = transaction.reduce(function(accumulator, currentValue){
            return accumulator + currentValue.price;
        }, 0);
        res.render('admin/index',{
            layout: 'admin',
            countTransactionPending: TransactionPending.length,
            countTransaction: transaction.length,
            revenue,
            countBannedAccount
        });
    }

    //[GET] /admin/products/list
    productShow(req, res, next){
        Game.find({})
            .then(games => {
                res.render('admin/products/products-list',{
                    layout: 'admin',
                    games: multipleMongooseToObject(games)
                })
            })
            .catch(next)
    }
    //[POST] /admim/products/:slug
    handleDeleteProduct(req, res, next) {
        let path = `/image/${req.params.slug}`;
        // fs.rmdir(path, (err) => {
        //     if(err){
        //         reject(err);
        //     } else {
        //         resolve();
        //     }
        // })
        Game.deleteOne({ slug: req.params.slug })
            .then(success => {
                res.redirect('back');
            })
            .catch(failed => {
                res.json('Delete failed game');
            })
    }

    //[GET] /admin/products/insert
    insertProduct(req, res, next){
        Producer.find({})
            .then(producers => {
                res.render('admin/products/products-insert', {
                    layout: 'admin',
                    producers: multipleMongooseToObject(producers)
                });
            })
            .catch(next)
    }

    //[POST] /admin/products/insert
    handleInsertProduct(req, res, next){
        var thumbnailPath='';
        var logoPath='';
        var categoryPath='';
        var backgroundPath='';
        
        {   
                //format linkPath save with MongoDB
            if(req.files.thumbnail){
                thumbnailPath = req.files.thumbnail[0].path;
                thumbnailPath = '/' + thumbnailPath.split('\\').slice(2).join('/');
            } 
            if(req.files.logo) {
                logoPath = req.files.logo[0].path;
                logoPath = '/' + logoPath.split('\\').slice(2).join('/');
            }

            if(req.files.category) {
                categoryPath =req.files.category[0].path;
                categoryPath = '/' + categoryPath.split('\\').slice(2).join('/');
            }
            if(req.files.background) {
                backgroundPath = req.files.background[0].path; 
                backgroundPath = '/' + backgroundPath.split('\\').slice(2).join('/');
            }
        }
        // res.json([thumbnailPath,logoPath,categoryPath,backgroundPath])
        // res.json(req.files);
        // res.json(req.body)
        var intanceGame = new Game({
            name: req.body.productName,
            isGame: req.body.producer,
            extendedPlay: req.body.extendPlay,
            media: {
                title: req.body.mediaTitle,
                content: req.body.mediaContent
            },
            image: thumbnailPath,
            background: backgroundPath,
            icon: logoPath,
            category: [categoryPath, req.body.titleCategory, req.body.typeCategory]
        })

        intanceGame.save()
            .then(() => {
                res.redirect('/admin/products/list');
                return;
            })
            .catch(err => {
                res.json('Error added product');
                return;
            })
    }

    //[GET] /admin/products/:id/detail
    detailProductShow(req, res, next) {
        Game.findOne({ _id: req.params.id })
            .then(game => {
                res.render('admin/products/products-detail', {
                    layout: 'admin',
                    game: mongooseToObject(game),
                    countVersion: game.version.length,
                    countViewBox: game.viewBox.length
                })
            })
            .catch(next)
    }


    //[GET] /admin/product/:id/version
    async versionProductShow(req, res, next) {
        let game = await Game.findOne({ _id: req.params.id });
        res.render('admin/products/products-version', {
            layout: 'admin',
            game: mongooseToObject(game)
        })
    }

    //[DELETE] /admin/product/:id/version
    async deleteProductVersion(req, res, next) {
        let game = await Game.findOne({ _id: req.params.id });
        let instanceVersionUpdateDB =  game.version.filter(version => { if(version._id != req.query.v) return version })
        let instanceVersionRemoveFile = game.version.filter(version => { if(version._id == req.query.v) return version })
        await Game.updateOne({ _id: req.params.id }, { version: instanceVersionUpdateDB })
        instanceVersionRemoveFile =  mongooseToObject(...instanceVersionRemoveFile);
        
        fs.unlink(path.join(__dirname,'../../public',instanceVersionRemoveFile.image), err => {
            if(err) res.json('Version does not exsit!!!');
            res.redirect('back');
        })
        
    }


    //[POST] /admin/product/:id/version
    async versionProductAdd(req, res, next) {
        var versionPath='';

        if(req.file){
            versionPath = req.file.path;
            versionPath = '/' + versionPath.split('\\').slice(2).join('/');
        }
        const intanceVersion = {
            name: req.body.versionName,
            price: req.body.cost,
            discount: req.body.discount,
            image: versionPath
        }
        await Game.updateOne(
            { slug: req.params.slug},
            {$push: { version: intanceVersion } }
        )
        res.redirect('back');
    }
    //[PUT] /admin/product/:id/version
    async handleVersionEdit(req, res, next) {
       
        //format Path Image and set discount when discount illegal
        if(req.file) req.body.imageName = `/${req.file.path.split('\\').slice(2).join('/')}`;
        if(req.body.discount=="$" || req.body.discount=='') req.body.discount = null;
    
        const intanceVersion = {
            name: req.body.versionName,
            price: req.body.cost,
            discount: req.body.discount,
            image: req.body.imageName
        }
        console.log(req.body.versionName)
        // await Game.updateOne({ slug: req.params.slug },{version: intanceVersion});
        // const game = Game.findOne({slug: req.params.slug})
        // res.json(game)

        var game = await Game.findOne({ slug: req.params.slug });
        
        // change element in array
        var newVersionArray = game.version.map(version =>  {
            if(version.name == req.body.versionName) version = intanceVersion;   
            return version;
        })
        // save element
        await Game.updateOne({ slug: req.params.slug }, {version: newVersionArray});
        const redirectPath = `/admin/products/${game._id}/version`;
        res.redirect(redirectPath);
    }

    //[GET] /admin/product/:id/:version/edit
    async versionProductEdit(req, res ,next) {
        // res.json(`product:${req.params.id}  version:${req.params.version}`);
        let game = await Game.findOne({ _id: req.params.id})
   
        let gameVersion = game.version.filter(function(version) {
            if(version.name == req.params.version){
                return version;
            }
        })
        res.render('admin/products/version-edit', {
            layout: 'admin',
            game: mongooseToObject(game),
            version: mongooseToObject(...gameVersion)
        })
    }


    //[GET] /admin/products/:id/viewbox
    async viewBoxProductShow(req, res, next) {
        let game = await Game.findOne({ _id: req.params.id })
        const viewTable = [];
        game.viewBox.forEach(view => viewTable.push(view.title));
        res.render('admin/products/products-viewbox', {
            layout: 'admin',
            game: mongooseToObject(game),
            viewTable
        });
    }

    //[POST] /admin/products/:id/viewbox
    async viewBoxProductAdd(req, res, next) {
        let game = await Game.findOne({ _id: req.params.id })
        const newViewBox = { title:req.body.viewName }
        game.viewBox.push(newViewBox);
        await game.save();
        res.redirect('back');
    }

    //[DEKETE] /admin/products/:id/viewbox
    async viewBoxProductDelete(req, res, next) {
        let game = await Game.findOne({ _id: req.params.id })
        let arrayView = [];
        arrayView  = game.viewBox.filter(view => {
            if(view.title != req.query.view) return view;
        })
        await Game.updateOne({ _id: req.params.id }, {viewBox: arrayView});
        res.redirect('back');
    }

    //[GET] /admin/products/:id/:title/viewbox
    async viewBoxProductEdit(req, res, next) {
        let game = await Game.findOne({ _id: req.params.id })
        
        res.render('admin/products/viewbox-edit', {
            layout: 'admin',
            game: mongooseToObject(game)
        })
    }

    //[POST] /admin/products/:id/viewboxcard
    async viewBoxCardAdd(req, res, next) {
        let cardImagePath;
        //format link File submit
        if(req.file){
            cardImagePath = req.file.path;
            cardImagePath = '/' + cardImagePath.split('\\').slice(2).join('/');
        }
        let game = await Game.findOne({ slug: req.params.slug })
        //Select view to add element in container
        let viewBox = game.viewBox.filter(view => {
            if(view.title == req.body.viewName) return view;
        })

        let newViewBox = mongooseToObject(...viewBox);

        let newObjectContainer = {
            image: cardImagePath,
            title: req.body.cardTitle,
            content: req.body.cardContent
        };

        //insert Card in container
        newViewBox.container.push(newObjectContainer);

        //Select the old views (element before)
        let oldViewBox = game.viewBox.filter(view => {
            if(view.title != req.body.viewName) return view;
        })

        // push new view box inside array old view box
        oldViewBox.push(newViewBox);

        // handle update viewBox 
        await Game.updateOne({ slug: req.params.slug }, { viewBox: oldViewBox });

        res.redirect('back')
    }

    //[DELETE] /admin/products/:slug/viewboxcard
    async viewBoxCardDelete(req, res ,next) {
        let game = await Game.findOne({ slug: req.params.slug });
    
        let viewBox = game.viewBox.filter(view => {
            if(view.title == req.query.vname) return view;
        })
        let newViewBox = mongooseToObject(...viewBox);

        //delete element
        newViewBox.container.forEach((card, index) => {
            if(card.title == req.query.card) newViewBox.container.splice(index,1);
        })

        //Select the old views (element before)
        let oldViewBox = game.viewBox.filter(view => {
            if(view.title != req.query.vname) return view;
        })

        // push new view box inside array old view box
        oldViewBox.push(newViewBox);

        // handle update viewBox 
        await Game.updateOne({ slug: req.params.slug }, { viewBox: oldViewBox });
        res.redirect('back');
    }

    //[GET] /admin/products/:id/:cardname/viewboxcard
    async viewBoxCardEdit(req, res, next) {
        let game = await Game.findOne({ _id: req.params.id});

        let viewBox = game.viewBox.find(view => {
            if(view.title == req.query.view) return view;
        })

        let viewEdit = viewBox.container.find(card => {
            if(card.title == req.params.cardname) return card;
        })

        const viewTable = [];
        game.viewBox.forEach(view => viewTable.push(view.title));
        res.render('admin/products/viewboxcard-edit', {
            layout: 'admin',
            game: mongooseToObject(game),
            viewEdit: mongooseToObject(viewEdit),
            viewTable,
            view: req.query.view
        });
    }

    //[PUT] /admin/products/insert/:slug
    async handleCardEdit(req, res, next) {
        let game = await Game.findOne({ slug: req.params.slug });
        if(req.file) req.body.cardImage = `/${req.file.path.split('\\').slice(2).join('/')}`;

        let instanceCard = {
            title: req.body.cardTitle,
            content: req.body.cardContent,
            image: req.body.cardImage
        }

        //B1: delete old card container in viewBox
        let viewBox = game.viewBox.find(view => {
            if(view.title == req.body.hiddenViewName) return view;
        })
        viewBox.container.forEach( (card, index) => {
            if(card.title == req.body.hiddenCardTitle) viewBox.container.splice(index, 1);
        })
       
        //B2: add new card container in viewBox
        let newViewBox = game.viewBox.find(view => {
            if(view.title == req.body.viewName) return view;
        })
        
        newViewBox.container.push(instanceCard);
        
        //B3: select old view not delete and not add
        let oldViewBox;
        if(req.body.hiddenViewName != req.body.viewName) {
            oldViewBox = game.viewBox.filter(view => {
                if(view.title != req.body.hiddenViewName && view.title != req.body.viewName) return view;
            })
        } else {
            oldViewBox = game.viewBox.filter(view => {
                if(view.title != req.body.hiddenViewName) return view;

            })
        }
        //B4:push view after delete and push view after add
        if(req.body.hiddenViewName != req.body.viewName) {
            oldViewBox.push(newViewBox, viewBox);
        } else {
            oldViewBox.push(viewBox);
        }

        // res.json(newViewBox)
        
        //update collection with oldViewBox
        await Game.updateOne({ slug: req.params.slug }, { viewBox: oldViewBox });
        const redirectPath = `/admin/products/${game._id}/viewbox`;
        res.redirect(redirectPath);
    }

    //[GET] /admin/products/:id/category
    async categoryEdit(req, res, next){
        const game = await Game.findOne({ _id:req.params.id });
        res.render('admin/products/category-edit', {
            layout: 'admin',
            game: mongooseToObject(game)
        })
    }

    //[PUT] /admin/products/:id/category
    async handleCategoryEdit(req, res ,next){

        if(req.file) req.body.iconPath = `/${req.file.path.split('\\').slice(2).join('/')}`;
        let instanceCategory = [
            req.body.iconPath,
            req.body.titleCategory,
            req.body.typeCategory
        ];
        
        //update category
        await Game.updateOne({slug: req.params.slug}, {category: instanceCategory})
        //update extendPlay
        await Game.updateOne({slug: req.params.slug}, {extendedPlay: req.body.extendPlay})
        // req.body.extendPlay
        res.redirect('back');
        
    }

    //[GET] /admin/products/:id/other
    async otherEdit(req, res, next) {
        let game = await Game.findOne({ _id:req.params.id });
        let producers = await Producer.find({});
        res.render('admin/products/other-edit', {
            layout: 'admin',
            game: mongooseToObject(game),
            producers: multipleMongooseToObject(producers)
        })
    }

    //[PUT] /admin/products/:id/other
    async handleOtherEdit(req, res, next) {

        await Game.updateOne({ slug:req.params.slug }, {
            isGame: req.body.producer,
            media: {
                title: req.body.mediaTitle,
                content: req.body.mediaContent
            }
        })

        res.redirect('back');
    }


    //[GET] /admin/transaction  
    transaction(req, res, next){
        Transaction.find({})
            .then( transactions => {
                var transactions = multipleMongooseToObject(transactions);

                //format Date createdAt in Transaction
                transactions.map( transaction => {
                    transaction.createdAt = dateFormat(transaction.createdAt);
                })
                res.render('admin/transactions', {
                    layout: 'admin',
                    transactions
                });
            })
            .catch(next)
    }

    //[GET] /admin/transaction/edit
    async transactionEdit(req, res, next){
        let instanceTransaction = await Transaction.findOne({ _id: req.params.id});
        res.render('admin/transactionEdit', {
            layout: 'admin',
            transaction: mongooseToObject(instanceTransaction)
        })
    }
    async handleTransactionEdit(req, res ,next){
        let instanceTransaction = await Transaction.findOne({ _id:req.params.id });
        await Transaction.updateOne({ _id:req.params.id }, { $set: { status: req.body.status } })
        res.redirect('back');
    }

   
    
    ////[GET] /admin/customer
    customer(req, res, next){
        Promise.all([Account.find({}), Account.countDocumentsDeleted()])
            .then(([accounts, countDeleted]) => {
                accounts = multipleMongooseToObject(accounts);
                accounts.map(account => {
                    account.createdAt = dateFormat(account.createdAt);
                })
                res.render('admin/customers/show', {
                    layout: 'admin',
                    accounts,
                    countDeleted,
                })
            })
            .catch(next)
    }

    //[GET] /admin/custmer/details
    detailCustomer(req, res, next){
        let customerId = req.query.user;
        Account.findOne({ _id: customerId })
            .then( account => {
                account = mongooseToObject(account);
                    account.createdAt = dateFormat(account.createdAt);
                    account.updatedAt = dateFormat(account.updatedAt);
                    account.blizzardBalance = currencyFormat.format((account.blizzardBalance/100).toFixed(2));
                    account.games.map(game => {
                        game.activatedSince = dateFormat(game.activatedSince)
                    })
                res.render('admin/customers/details', {
                    layout: 'admin',
                    account
                })
            })
            .catch(next)
    }

    //[PUT] /admin/customer
    customerEdit(req, res, next){
            Account.findOne({ _id:req.params.userId })
                .then(account => {
                    if(account.password != req.body.password){
                        req.body.password = md5(req.body.password);
                    }
                })
                .then(() => {
                    Account.updateOne({ _id:req.params.userId }, req.body)
                        .then(() => res.redirect('/admin/customer'))
                        .catch(next)
                })
                .catch(next)
    }

    //[GET] /admin/customer/insert
    insert(req, res,next){
        res.render('admin/customers/insert', {
            layout: 'admin'
        })
    }

    //[POST] /admin/customer/insert
    handleInsert(req, res, next){
        const intanceAccount = new Account(req.body);
        Account.findOne({ email:req.body.email })
            .then( account => {
                if(!account){
                    intanceAccount.password = md5(intanceAccount.password);
                    intanceAccount.save()
                    res.redirect('/admin/customer');
                    return;
                }
                else {
                    res.json('This email already exists !!!');
                    return;
                }
            })
            .catch(next)
    }

    //[DELETE] /admin/customer/:customerId
    deleteCustomer(req, res, next){
        
        Account.delete({ _id:req.params.customerId })
            .then(() => {
                res.redirect('/admin/customer');
                return;
            })
            .catch(err => {
                res.json('Delete customer failed !!!');
                return;
            })
    }

    //[GET] /admin/customer/store-trash 
    bannedCustomer(req, res, next){
        Account.findDeleted({})
            .then( accounts => {
                res.render('admin/customers/banned-customer', {
                    layout: 'admin',
                    accounts: multipleMongooseToObject(accounts)
                })
            })
            .catch(next)
    }

    //[PATCH] /admin/customer/restore
    restore(req, res,next){
        Account.restore({ _id: req.params.userId })
            .then(() => {
                res.redirect('back');
                return;
            })
            .catch(err => {
                res.json('Restore failed !!!');
                return;
            })
    }

    //[DELETE] /admin/customer/:customerId/force
    forceDelete(req, res, next){
        Account.deleteOne({ _id: req.params.customerId})
            .then(() => {
                res.redirect('back');
                return;
            })
            .catch(err => {
                res.json('Remove customer failed !!!');
                return;
            })
    }
}

module.exports = new AdminController;
