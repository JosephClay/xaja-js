module.exports = function(req) {
    return {
        status: req.method === req.query.method ? 'ok' : 'error',
        debug: {
            REQUEST_METHOD: req.method,
            method: req.query.method
        }
    };
};