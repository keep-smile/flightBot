let {app} = require('lib/app');


let {adapter, flightBot} = require('lib/flightBot');





app.use('/api/messages', function (req, res, next) {

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
