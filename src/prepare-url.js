var _rHasQuery = /\?/,
	_now = Date.now || function() { return new Date().getTime(); };

module.exports = function(url, data, method, cache) {
	var vars = '';

	// Prepare URL
	if (method === 'GET') {
		vars += data;
	}

	if (cache !== undefined) {
		cache = (method === 'POST');
	}

	if (!cache) {
		if (vars) { vars += '&'; }
		vars += '_=' + _now();
	}

	if (vars) {
		url += (_rHasQuery.test(url) ? '&' : '?') + vars;
	}

	return url;
};