// const { Mongoose } = require("mongoose");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const slug = require('mongoose-slug-generator');
// const mongooseDelete = require('mongoose-delete');

const Producer = new Schema({
    name: { type: String },
},
{ timestamps: true }); // timestamps is createdAt and updatedAt

// Add plugin
// mongoose.plugin(slug);

// Course.plugin(mongooseDelete, { 
//   deletedAt: true,
//   overrideMethods: 'all',
// });

module.exports  = mongoose.model('Producer', Producer);
