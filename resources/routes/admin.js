const express = require('express');
let multer = require('multer');
var fs = require('fs');
const path = require('path');
var router = express.Router();
const adminController = require('../app/controllers/AdminController');
// const authMiddleware = require('../app/middlewares/AuthenMiddleware');


//create folder + upload multi file in folder Multer 
let upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, callback) => {
        let type = req.params.slug;
        let pathFolder = `./resources/public/image/${type}`;   
        // console.log(path.join(__dirname, pathFolder))
        await fs.mkdir(pathFolder, (err) => {
            if (err) {
                if (err.code == 'EEXIST'){
                  callback(null,pathFolder);
                } else {
                  callback(err);
                }
            } else {
              callback(null,pathFolder);  // console.log('Directory created successfully!');
            }
        });
    },
    filename: (req, file, callback) => {
      //originalname is the uploaded file's name with extn
      callback(null, file.originalname);
    }
  })
});


//upload file in folder multer
let uploadSingleFile = multer({
  storage: multer.diskStorage({
    destination: async (req, file, callback) => {
        let type = req.params.slug;
        let pathFolder = `./resources/public/image/${type}`;   
        // console.log(pathFolder)
        callback(null, pathFolder);
    },
    filename: (req, file, callback) => {
      //originalname is the uploaded file's name with extn
      callback(null, file.originalname);
    }
  })
});

let uploadFileUpdate = multer({
  storage: multer.diskStorage({
    destination: async (req, file, callback) => {
        let type = req.params.slug;
        let imageName = req.query.image;
        let pathFileDelete = `./resources/public${imageName}`;
        let pathFolder = `./resources/public/image/${type}`;   
        await fs.unlink(pathFileDelete, (err) => {
            if (err) {
              callback(err);
            } else {
              callback(null,pathFolder);  // console.log('Directory created successfully!');
            }
        });
    },
    filename: (req, file, callback) => {
      //originalname is the uploaded file's name with extn
      callback(null, file.originalname);
    }
  })
});



router.get('/logout', adminController.logout);
router.get('/products/list', adminController.productShow);
router.delete('/products/:slug', adminController.handleDeleteProduct);
router.get('/products/insert', adminController.insertProduct);
router.get('/products/:id/detail', adminController.detailProductShow);
router.get('/products/:id/version', adminController.versionProductShow);
router.delete('/products/:id/version',  adminController.deleteProductVersion);
router.put('/products/:slug/version', uploadFileUpdate.single('versionImage'), adminController.handleVersionEdit);
router.post('/products/:slug/version', uploadSingleFile.single('versionImage'), adminController.versionProductAdd);
router.get('/products/:id/:version/edit', adminController.versionProductEdit);
router.get('/products/:id/viewbox', adminController.viewBoxProductShow);
router.post('/products/:id/viewbox', adminController.viewBoxProductAdd);
router.delete('/products/:id/viewbox', adminController.viewBoxProductDelete);
router.get('/products/:id/:title/viewbox', adminController.viewBoxProductEdit);
router.post('/products/:slug/viewboxcard', uploadSingleFile.single('cardImage'), adminController.viewBoxCardAdd);
router.delete('/products/:slug/viewboxcard', adminController.viewBoxCardDelete);
router.get('/products/:id/:cardname/viewboxcard', adminController.viewBoxCardEdit);
router.put('/products/:slug/viewboxcard', uploadFileUpdate.single('cardImage'), adminController.handleCardEdit);
router.get('/products/:id/category', adminController.categoryEdit);
router.put('/products/:slug/category', uploadFileUpdate.single('iconImage') , adminController.handleCategoryEdit);
router.get('/products/:id/other', adminController.otherEdit);

router.put('/products/:slug/other', adminController.handleOtherEdit);

router.post('/products/insert/:slug', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'category', maxCount: 1 },
  { name: 'background', maxCount: 1 }
]), adminController.handleInsertProduct);

router.get('/transaction', adminController.transaction);
router.get('/transaction/:id', adminController.transactionEdit);
router.put('/transaction/:id', adminController.handleTransactionEdit);
router.get('/customer', adminController.customer);
router.get('/customer/insert', adminController.insert);
router.post('/customer/insert', adminController.handleInsert);
router.get('/customer/details', adminController.detailCustomer);
router.put('/customer/:userId/edit', adminController.customerEdit);
router.delete('/customer/:customerId', adminController.deleteCustomer);
router.get('/customer/banned-customer', adminController.bannedCustomer);
router.patch('/customer/:userId', adminController.restore);
router.delete('/customer/:customerId/force', adminController.forceDelete);
router.get('/', adminController.show);



module.exports = router;