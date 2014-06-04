var _CONTENT_TYPE = 'Content-Type',
	_ACCEPT       = 'Accept',
	_ACCEPT_MAP   = {
		xml:  'application/xml, text/xml',
		html: 'text/html',
		json: 'application/json, text/javascript',
		js:   'application/javascript, text/javascript'
	},

	_toUpper = function(match, str1, str2) {
		return (str1 + str2).toUpperCase();
	},

	_rKeyFormatter = /(^|-)([^-])/g;

module.exports = function(xhr, headers, method, type, isSerialized) {
	var headerKey, formattedHeaderKey;
	for (headerKey in headers) {
		formattedHeaderKey = headerKey.replace(_rKeyFormatter, _toUpper);
		headers[formattedHeaderKey] = headers[headerKey];

		delete headers[headerKey];

		xhr.setRequestHeader(formattedHeaderKey, headers[formattedHeaderKey]);
	}

	// ensure a content type
	if (!headers[_CONTENT_TYPE] && isSerialized && method !== _GET) {
		xhr.setRequestHeader(_CONTENT_TYPE, 'application/x-www-form-urlencoded');
	}

	if (!headers[_ACCEPT]) {
		xhr.setRequestHeader(_ACCEPT, _ACCEPT_MAP[type]);
	}
};