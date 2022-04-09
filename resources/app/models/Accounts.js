// const { Mongoose } = require("mongoose");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-currency').loadType(mongoose);
var Currency = mongoose.Types.Currency;
const mongooseDelete = require('mongoose-delete');
// const slug = require('mongoose-slug-generator');



const Account = new Schema({
    fullName: { type: String , require},
    blizzardName: { type: String, require },
    email: { type: String, require},
    password: { type: String, require},
    gender: { type: String },
    phoneNumber: { type: String, require},
    address: { type: String, require},
    games: [
        {
            name: String,
            version: String,
            icon: String,
            activatedSince: {type: Date, default: Date.now}
        }
    ],
    zip: { type: Number },
    blizzardBalance: {type: Currency},
    isAdmin: { type: Boolean , default: false}
},
{ timestamps: true }); // timestamps is createdAt and updatedAt

// Add plugin
// mongoose.plugin(slug);

Account.plugin(mongooseDelete, { 
  deletedAt: true,
  overrideMethods: 'all',
});

module.exports  = mongoose.model('Account', Account);
