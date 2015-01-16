var ACCEPT_MAP = {
		text: '*/*',
		xml:  'application/xml, text/xml',
		html: 'text/html',
		json: 'application/json, text/javascript',
		js:   'application/javascript, text/javascript'
	},

	CONTENT_MAP = {
		text: 'text/plain',
		json: 'application/json'
	},

	rKeyFormatter = /(^|-)([^-])/g,
	toUpper = function(match, str1, str2) {
		return (str1 + str2).toUpperCase();
	};

module.exports = function(xhr, headers, method, type) {
	var headerKey, formattedHeaderKey;
	for (headerKey in headers) {
		formattedHeaderKey = headerKey.replace(rKeyFormatter, toUpper);
		xhr.setRequestHeader(formattedHeaderKey, headers[headerKey]);
	}

	// ensure a content type
	if (!headers['Content-Type'] && method !== 'GET') {
		xhr.setRequestHeader('Content-Type', CONTENT_MAP[type] || 'application/x-www-form-urlencoded');
	}

	if (!headers['Content-Type']) {
		xhr.setRequestHeader('Accept', ACCEPT_MAP[type]);
	}
};