// const { Mongoose } = require("mongoose");
const mongoose = require('mongoose');
require('mongoose-currency').loadType(mongoose);
var Currency = mongoose.Types.Currency;
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

// const mongooseDelete = require('mongoose-delete');

const Game = new Schema({
    name: { type: String },
    isGame: { type: String },
    image: { type: String },
    background: { type: String },
    icon: { type: String },
    extendedPlay: {type: Boolean},
    category: [],
    media: {
        title: String,
        content: String
    },
    version: [
        {
            name: String,
            price: { type: Currency },
            discount: { type: Currency },
            image: String
        }
    ],
    viewBox: [
        {
            title: String,
            container: [
                {
                    image: String,
                    title: String,
                    content: String
                }
            ]
        }
    ],
    slug: { type: String, slug: 'name' , unique: true },
},
{ timestamps: true }); // timestamps is createdAt and updatedAt

// Add plugin
mongoose.plugin(slug);

// Course.plugin(mongooseDelete, { 
//   deletedAt: true,
//   overrideMethods: 'all',
// });

module.exports  = mongoose.model('Game', Game);
