!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.xaja=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Based on qwest
 * https://github.com/pyrsmk/qwest
 */
var root = window,
	XML_HTTP_REQUEST = 'XMLHttpRequest',

	getXHR = function() {
		return root[XML_HTTP_REQUEST] ?
				new root[XML_HTTP_REQUEST]() :
				new ActiveXObject('Microsoft.XMLHTTP');
	},

	// Guess XHR version
	isVersion2 = (getXHR().responseType === ''),

	toString = ({}).toString,
	isString = function(obj) {
		return toString.call(obj) === '[object String]';
	},

    // Extend a given object with all the properties in passed-in object(s).
    extend = function(base) {
        var args = arguments,
            idx = 1, len = args.length;
        for (; idx < len; idx++) {
            var source = args[idx];
            if (source) {
                for (var prop in source) {
                    base[prop] = source[prop];
                }
            }
        }
        return base;
    },

    promise = require('./promise'),
    prepareUrl = require('./prepare-url'),
    prepareData = require('./prepare-data'),
    prepareHeaders = require('./prepare-headers'),
    responseHandler = require('./response-handler');

// Core function
function xaja(options) {

	var isTypeSupported = false,
		xhr             = options.xhr ? options.xhr() : getXHR(),
		overrideMime    = options.mimeType,
		beforeSend      = options.beforeSend,
		initialUrl      = options.url  || '',
		method          = options.type || options.method || 'GET',
		initialData     = options.data || null,
		async           = options.async === undefined ? true : !!options.async,
		cache           = options.cache,
		type            = options.dataType ? options.dataType.toLowerCase() : 'json',
		user            = options.user || options.username || '',
		password        = options.password || '',
		statusCode      = options.statusCode,
		callContext     = options.context,
		xhrFields       = options.xhrFields,
		headers         = extend({ 'X-Requested-With': XML_HTTP_REQUEST },
			options.contentType ? { 'Content-Type': options.contentType } : {},
			options.headers);

	var promises = promise(), func;
	if ((func = options.success))  { promises.success(func);  }
	if ((func = options.complete)) { promises.complete(func); }
	if ((func = options.error))    { promises.error(func);    }
	if ((func = options.progress)) { promises.progress(func); }

	// prepare data
	var dataPrep = prepareData(initialData, method),
		data = dataPrep.data,
		isSerialized = dataPrep.serialized;

	// prepare url
	url = prepareUrl(initialUrl, data, method, cache);

	xhr.onprogress = function(evt) {
		if (!evt.lengthComputable) { return; }

		// evt.loaded the bytes browser receive
		// evt.total the total bytes seted by the header
		var percentComplete = (evt.loaded / evt.total) * 100;
		promises.tick(percentComplete);
	};

	// Open connection
	xhr.open(method, url, async, user, password);

	// Identify supported XHR version
	if (type && isVersion2) {
		try {
			xhr.responseType = type;
			isTypeSupported = (xhr.responseType == type);
		}
		catch (e) {}
	}

	var handleResponse = responseHandler(xhr, isTypeSupported, promises, url, statusCode, callContext);
	// Plug response handler
	if (isVersion2) {

		xhr.onload = handleResponse;

	} else {

		xhr.onreadystatechange = function() {
			if (xhr.readyState !== 4) { return; }
			handleResponse();
		};
	}

	prepareHeaders(xhr, headers, method, type, isSerialized);

	if (overrideMime) {
		xhr.overrideMimeType(overrideMime);
	}

	if (beforeSend) { beforeSend.call(xhr); }

	if (xhrFields) {
		var xhrKey;
		for (xhrKey in xhrFields) {
			xhr[xhrKey] = xhrFields[xhrKey];
		}
	}

	// send the request
	xhr.send(method !== 'GET' ? data : null);

	// return the promises
	return promises;
}

// a shortcut composer for xaja methods, e.g. .get(), .post()
var shortcut = function(method) {
	return function(url, data, success, dataType) {
		return xaja({
			url: url,
			method: method,
			success: success,
			dataType: dataType
		});
	};
};

module.exports = extend(xaja, {
	xhr2: isVersion2,
	getXHR: getXHR,
	ajax: function(url, options) {
		var config;
		if (isString(url)) {
			config = options || {};
			config.url = url;
		} else {
			config = url || {};
		}
		return xaja(config);
	},
	get: shortcut('GET'),
	post: shortcut('POST'),
	put: shortcut('PUT'),
	del: shortcut('DEL')
});
},{"./prepare-data":2,"./prepare-headers":3,"./prepare-url":4,"./promise":5,"./response-handler":6}],2:[function(require,module,exports){
var root = window,
	_encodeURIComponent = encodeURIComponent;

module.exports = function(data, method) {
	var isSerialized = false;

	if (
		root.ArrayBuffer &&
		(data instanceof ArrayBuffer ||
		data instanceof Blob         ||
		data instanceof Document     ||
		data instanceof FormData)
	) {
		if (method === 'GET') {
			data = null;
		}
	} else {
		var values = [],
			key;
		for (key in data) {
			if (data[key] !== undefined) {
				values.push(_encodeURIComponent(key) + (data[key].pop ? '[]' : '') + '=' + _encodeURIComponent(data[key]));
			}
		}
		data = values.join('&');
		isSerialized = true;
	}

	return {
		data: data,
		serialized: isSerialized
	};
};
},{}],3:[function(require,module,exports){
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
	if (!headers[_CONTENT_TYPE] && isSerialized && method !== 'GET') {
		xhr.setRequestHeader(_CONTENT_TYPE, 'application/x-www-form-urlencoded');
	}

	if (!headers[_ACCEPT]) {
		xhr.setRequestHeader(_ACCEPT, _ACCEPT_MAP[type]);
	}
};
},{}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
var _makeCalls = function(arr, context, arg) {
	var args = [arg],
		idx = 0,
		func;
	while ((func = arr[idx])) {
		idx++;
		func.apply(context, args);
	}

	arr.length = 0;
};

module.exports = function() {
	var successStack  = [],
		errorStack    = [],
		progressStack = [],
		completeStack = [],

		api = {
			success: function(func) {
				successStack.push(func);
				return api;
			},
			error: function(func) {
				errorStack.push(func);
				return api;
			},
			progress: function(func) {
				progressStack.push(func);
				return api;
			},
			complete: function(func) {
				completeStack.push(func);
				return api;
			},

			tick: function(perc) {
				_makeCalls(progressStack, perc, perc);
			},
			resolve: function(xhr, response) {
				_makeCalls(successStack, xhr, response);
				_makeCalls(completeStack, xhr);
				return api;
			},
			reject: function(xhr, response) {
				_makeCalls(errorStack, xhr, response);
				_makeCalls(completeStack, xhr);
				return api;
			}
		};

	api.done   = api.success;
	api.fail   = api.error;
	api.always = api.complete;

	return api;
};
},{}],6:[function(require,module,exports){
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
},{}]},{},[1])(1)
});