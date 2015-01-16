// https://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
var rVerifyStatus = /^2|1223/;

var attemptOrThrow = function(fn) {
	try {
		return fn();
	} catch (e) {
		throw e.message;
	}
};

var attemptXML = function(fn) {
	var response;
	try {
		response = fn();
	} catch (e) {}
	if (!response || !response.documentElement || response.getElementsByTagName('parsererror').length) {
		throw 'Invalid XML';
	}
	return response;
};

var parseDocument = function(response) {
	var frame = document.createElement('iframe');
    frame.style.display = 'none';
    document.body.appendChild(frame);
    frame.contentDocument.open();
    frame.contentDocument.write(response);
    frame.contentDocument.close();
    response = frame.contentDocument;
    document.body.removeChild(frame);
    return response;
};

module.exports = function(xhr, type, isTypeSupported, promises, url, statusCode, timer) {

	var handler = function() {
		clearTimeout(timer());
		
		var response;

		// verify status code
		if (!rVerifyStatus.test(xhr.status)) {
			response = 'Request to "'+ url +'" aborted: '+ xhr.status + ' ('+ xhr.statusText +')';
			promises.reject(xhr, response);
			if (statusCode && statusCode[xhr.status]) {
				statusCode[xhr.status].call(xhr, response);
			}
			return;
		}

		if (isTypeSupported && xhr.response !== undefined) {

			response = xhr.response;

		} else {

			if (type === 'json') {
				response = attemptOrThrow(function() {
					return JSON.parse(xhr['responseText']);
				});
			} else if (type === 'xml') {
				response = attemptXML(function() {
					return (new DOMParser()).parseFromString(xhr['responseText'], 'text/xml');
				});
			} else if (type === 'document') {
				response = attemptOrThrow(function() {
					return parseDocument(xhr.response);
				});
			} else {
				response = xhr['responseText'];
			}

		}

		promises.resolve(xhr, response);
		if (statusCode && statusCode[xhr.status]) {
			statusCode[xhr.status].call(xhr, response);
		}

		return response;
	};

	// Plug response handler
	handler.bind = function(isCrossOrigin, isVersion2) {
		if (isCrossOrigin || isVersion2) {
			xhr.onload = handler;
			return;
		}

		xhr.onreadystatechange = function() {
			if (xhr.readyState !== 4) { return; }
			handler();
		};
	};

	return handler;
};