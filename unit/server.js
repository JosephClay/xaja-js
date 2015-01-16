// set up ==================================================
var express        = require('express'),
    path           = require('path'),
    methodOverride = require('method-override'),
	bodyParser     = require('body-parser'),

    // App setup
    app  = module.exports = express();

// http://stackoverflow.com/questions/12497358/handling-text-plain-in-express-3-via-connect/12497793#12497793
app.use(function(req, res, next) {
	if (req.is('text/*')) {
		req.text = '';
		req.setEncoding('utf8');
		req.on('data', function(chunk) {
			req.text += chunk;
		});
		req.on('end', next);
		return;
	}

	next();
});
app.use(bodyParser.urlencoded({ extended: false })); // get information from html forms
app.use(bodyParser.json()); // get information from json forms
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// routes ==================================================
var routes = require('./tests');

app.get('/test/async/', routes.async);
app.post('/test/async/', routes.async);
app.put('/test/async/', routes.async);
app.delete('/test/async/', routes.async);

app.get('/test/multiple/one', routes.multiple);
app.get('/test/multiple/two', routes.multiple);

app.get('/test/timeout', routes.timeout);
app.get('/test/before', routes.before);
app.get('/test/cache', routes.cache);
app.post('/test/cache', routes.cache);
app.get('/test/auth', routes.auth);
app.get('/test/get-json', routes.getJSON);
app.get('/test/get-text', routes.getText);
app.get('/test/get-array-buffer', routes.getArrayBuffer);
app.get('/test/get-blob', routes.getBlob);
app.post('/test/send-post', routes.sendPost);
app.post('/test/send-json', routes.sendJSON);
app.post('/test/send-text', routes.sendText);
app.post('/test/send-form-data', routes.sendForm);
app.post('/test/send-blob', routes.sendBlob);
app.post('/test/send-document', routes.sendDocument);
app.post('/test/send-array-buffer', routes.sendArrayBuffer);

// launch ==================================================
app.listen(3000, function() {
    console.log('express listening on port %d\n', 3000);
});