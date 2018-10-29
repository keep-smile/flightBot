const createError = require('http-errors');
const express = require('express');
const path = require('path');

const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');

const Ticket = require('models/ticket').Ticket;
let ticket = new Ticket({firstName: "asdasdasd"}).save();

let app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/admin', adminRouter);

let {adapter, flightBot } = require('lib/flightBot');

app.use('/api/messages', function(req, res, next) {

    // Route received a request to adapter for processing
    adapter.processActivity(req, res, async (turnContext) => {
        // route to bot activity handler.
        await flightBot.onTurn(turnContext);
    });
});



// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {

    console.log(err);


    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
