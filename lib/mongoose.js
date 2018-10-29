const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_CONNECT, { useNewUrlParser: true } );

module.exports = mongoose;
