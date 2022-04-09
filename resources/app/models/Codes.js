// const { Mongoose } = require("mongoose");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-currency').loadType(mongoose);
var Currency = mongoose.Types.Currency;
// const slug = require('mongoose-slug-generator');
// const mongooseDelete = require('mongoose-delete');

const Code = new Schema({
    code: String,
    description: String,
    action: String,
    items: { type: Currency }
},
{ timestamps: true }); // timestamps is createdAt and updatedAt

// Add plugin
// mongoose.plugin(slug);

// Course.plugin(mongooseDelete, { 
//   deletedAt: true,
//   overrideMethods: 'all',
// });

module.exports  = mongoose.model('Code', Code);
