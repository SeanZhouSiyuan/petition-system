const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var counterSchema = new Schema({
    count: Number
});

var Counter = mongoose.model('counter', counterSchema);

module.exports = Counter;