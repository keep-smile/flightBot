const mongoose = require('lib/mongoose'),
    Schema = mongoose.Schema;

const conversation = new Schema({
    conversationId: {type: String},
    conversation: {type: Object},
    cityFrom: {type: String},
    cityTo: {type: String},
    ticketType: {type: String}

});


exports.Ticket = mongoose.model('Ticket', ticket);
