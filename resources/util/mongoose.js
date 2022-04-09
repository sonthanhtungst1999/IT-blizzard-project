module.exports = {
    multipleMongooseToObject: function(mongoose) {
        return mongoose.map(game => game.toObject());
    },
    mongooseToObject: function(mongoose) {
        return mongoose ? mongoose.toObject() : mongoose;
    }
}
