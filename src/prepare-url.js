var _ = require('./utils'),
	rHasQuery = /\?/;

module.exports = function(url, data, method, cache) {
	var vars = '';

	// Prepare URL
	if (method === 'GET') {
		vars += !_.exists(data) ? '' : data;
	}

	if (cache === false && method === 'GET') {
		if (vars) { vars += '&'; }
		vars += '_=' + _.now();
	}

	if (vars) {
		url += (rHasQuery.test(url) ? '&' : '?') + vars;
	}

	return url;
};
