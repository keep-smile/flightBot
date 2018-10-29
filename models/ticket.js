const mongoose = require('lib/mongoose'),
    Schema = mongoose.Schema;

const ticket = new Schema({
    firstName: {type: String},
    lastName: {type: String},
    cityFrom: {type: String},
    cityTo: {type: String},
    ticketType: {type: String}

});


exports.Ticket = mongoose.model('Ticket', ticket);
