// const { Mongoose } = require("mongoose");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-currency').loadType(mongoose);
var Currency = mongoose.Types.Currency;
// const slug = require('mongoose-slug-generator');
// const mongooseDelete = require('mongoose-delete');


const Transaction = new Schema({
    owner: {type: String},
    game: {type: String},
    version: {type: String},
    price: {type: Currency},
    code: {type: String},
    isActive: {type: Boolean, default: false},
    status: {type: String, default: "Complete"},
    slug: { type: String, slug: 'game' , unique: true }
},
{ timestamps: true }); // timestamps is createdAt and updatedAt

// Add plugin
// mongoose.plugin(slug);

// Course.plugin(mongooseDelete, { 
//   deletedAt: true,
//   overrideMethods: 'all',
// });

module.exports  = mongoose.model('Transaction', Transaction);
