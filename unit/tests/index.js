var url    = require('url'),
    path   = require('path'),
    stdRes = require('./std-res'),
    fs     = require('fs'),
    cache  = 0;

module.exports = {
    async: function(req, res) {
        res.send(stdRes(req));
    },

    multiple: function(req, res) {
        res.send({ status: 'ok' });
    },

    cache: function(req, res) {
        res.send('cache-' + cache);
        cache++;
    },

    timeout: function(req, res) {
        setTimeout(function() {

            res.send({ status: 'ok' });

        }, 1000);
    },

    before: function(req, res) {
        var headers = req.headers;

        res.send({
            status: headers['x-running-test'] === 'before' ? 'ok' : 'error',
            debug: {
                'x-running-test': headers['x-running-test']
            }
        });
    },

    getJSON: function(req, res) {
        var headers = req.headers;
        res.send({
            status: headers.accept.indexOf('application/json') > -1 ? 'ok' : 'error',
            debug: {
                Accept: headers.accept
            }
        });
    },

    getText: function(req, res) {
        var headers = req.headers;
        res.send(headers.accept === '*/*' ? 'ok' : 'error');
    },

    getArrayBuffer: function(req, res) {
        var img = path.resolve('./tests/img.jpg'),
            file = fs.readFileSync(img);

        res.header['Content-Type'] = 'image/jpeg';
        res.header['Content-Length'] = fs.statSync(img).size;
        res.send(file);
    },

    getBlob: function(req, res) {
        var img = path.resolve('./tests/img.jpg'),
            file = fs.readFileSync(img);

        res.header['Content-Type'] = 'image/jpeg';
        res.header['Content-Length'] = fs.statSync(img).size;
        res.send(file);
    },

    sendArrayBuffer: function(req, res) {
        var body = req.body;
        res.send({
            status: 'ok',
            debug: {
                body: body
            }
        });
    },

    sendBlob: function(req, res) {
        var body = req.body;
        res.send({
            status: body === 'test' ? 'ok' : 'error',
            debug: {
                body: body
            }
        });
    },

    sendDocument: function(req, res) {
        var body = req.body;

        res.send({
            status: Object.keys(body).length ? 'ok' : 'error',
            debug: {
                doc: body
            }
        });
    },

    sendForm: function(req, res) {
        var body = req.body;
        res.send({
            status: (body.firstname === 'Pedro' && body.lastname === 'Sanchez') ? 'ok' : 'error'
        });
    },

    sendJSON: function(req, res) {
        var body = req.body,
            contentType = req.headers['content-type'];

        res.send({
            'status': (contentType.indexOf('application/json') > -1 && body.foo === 'bar' && body.bar[0].foo === 'bar') ? 'ok' : 'error',
            'debug': {
                'Content-Type': contentType,
                'body': body
            }
        });
    },

    sendPost: function(req, res) {
        var body = req.body,
            contentType = req.headers['content-type'];
        
        res.send({
            status: (contentType.indexOf('application/x-www-form-urlencoded') > -1 && body.foo === 'bar') ? 'ok' : 'error',
            debug: {
                'Content-Type': contentType,
                'body': body
            }
        });
    },

    sendText: function(req, res) {
        var contentType = req.headers['content-type'];

        res.send({
            status: (contentType.indexOf('text') > -1 && req.text === 'text') ? 'ok' : 'error',
            debug: {
                'Content-Type': contentType,
                'input': req.text
            }
        });
    },

    auth: function(req, res) {
        res.send(stdRes(req));
    }
};