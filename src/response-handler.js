var _PARSE_ERROR   = 'parseError',
	_RESPONSE_TEXT = 'responseText',
	_RESPONSE_XML  = 'responseXML',

	_rVerifyStatus = /^2/;

module.exports = function(xhr, isTypeSupported, promises, url, statusCode, callContext) {
	return function() {
		var response;

		// Handle response
		try {
			// Verify status code
			if (!_rVerifyStatus.test(xhr.status)) {
				throw xhr.status + ' ('+ xhr.statusText +')';
			}

			// Init
			// Process response
			if (isTypeSupported && xhr.response !== undefined) {

				response = xhr.response;

			} else {

				switch (type) {
					case 'json':
						try {
							response = JSON.parse(xhr[_RESPONSE_TEXT]);
						} catch (e) {
							throw e.message;
						}
						break;
					case 'js':
						/* jshint ignore:start */
						response = (new Function('"use strict";' + xhr[_RESPONSE_TEXT])).call(callContext);
						/* jshint ignore:end */
						break;
					case 'xml':
						if (!xhr[_RESPONSE_XML] || (xhr[_RESPONSE_XML][_PARSE_ERROR] && xhr[_RESPONSE_XML][_PARSE_ERROR].errorCode && xhr[_RESPONSE_XML][_PARSE_ERROR].reason)) {
							throw 'Error while parsing XML body';
						} else {
							response = xhr[_RESPONSE_XML];
						}
						break;
					default:
						response = xhr[_RESPONSE_TEXT];
				}

			}

			promises.resolve(xhr, response);
			if (statusCode && statusCode[xhr.status]) { statusCode[xhr.status].call(xhr, response); }

		} catch (e) {

			response = 'Request to "'+ url +'" aborted: '+ e;
			promises.reject(xhr, response);
			if (statusCode && statusCode[xhr.status]) { statusCode[xhr.status].call(xhr, response); }

		}
	};
};