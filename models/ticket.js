const mongoose = require('lib/mongoose'),
    Schema = mongoose.Schema;

const ticket = new Schema({
    personName: {type: String},
    ticketClass: {type: String},
    cityFrom: {type: String},
    cityTo: {type: String},
    ticketBuyConfirmed: {type: String},

});


exports.TicketDB = mongoose.model('TicketDB', ticket);
