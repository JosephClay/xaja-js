!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.xaja=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var _ = require('./utils'),

	getXHR = function() {
		return window['XMLHttpRequest'] ?
			new window['XMLHttpRequest']() :
			new ActiveXObject('Microsoft.XMLHTTP');
	},

	getXDR = function() {
		// CORS with IE8/9
		return new XDomainRequest();
	},

	// Guess XHR version
	isVersion2 = (getXHR().responseType === ''),

	promise         = require('./promise'),
	prepareHeaders  = require('./prepare-headers'),
	prepareUrl      = require('./prepare-url'),
	prepareData     = require('./prepare-data'),
	responseHandler = require('./response-handler'),
	progressHandler = require('./progress-handler');

// determine if we're dealing with a cross origin request
var determineIfCrossOrigin = function(url) {
	var host = url.match(/\/\/(.+?)\//);
	return host && host[1] ? host[1] !== location.host : false;
};

var getMethod = function(method, isCrossOrigin) {
	method = (method || '').toUpperCase();
	return (isCrossOrigin && method !== 'GET' && method !== 'POST') ? 'POST' : method || 'GET';
};

var determineType = function(data) {
	var def = xaja.default,
		arrBuff = window.ArrayBuffer;
	if (!arrBuff) { return def; }

	if (data instanceof arrBuff            || 
		data instanceof window.Uint16Array || 
		data instanceof window.Uint32Array || 
		data instanceof window.Uint8Array  || 
		data instanceof window.Uint8ClampedArray) { return 'arraybuffer'; }

	if (data instanceof window.Blob)        { return 'blob';     }
	if (data instanceof window.Document)    { return 'document'; }
	if (data instanceof window.FormData)    { return 'formdata'; }
	return def;
};

var parseOptions = function(urlParam, config) {
	if (_.isString(urlParam)) {
		var options = options || {};
		options.url = urlParam;
		return options;
	}
	return urlParam || {};
};

function xaja(urlParam, config) {
	var options         = parseOptions(urlParam, config),
		initialUrl      = options.url || '',
		isCrossOrigin   = options.crossDomain || determineIfCrossOrigin(initialUrl),

		timerTimeout,
		getTimer        = function() { return timerTimeout; },
		timeoutDur      = options.timeout ? +options.timeout : xaja.timeout,

		currentTries    = 0,
		retries         = options.retries ? +options.retries : 0,

		async           = options.async !== undefined ? !!options.async : true,
		createXHR       = options.xhr ? options.xhr : isCrossOrigin && window.XDomainRequest ? getXDR : getXHR,
		overrideMime    = options.mimeType,
		beforeSend      = options.before || options.beforeSend,
		withCredentials = options.withCredentials,
		method          = getMethod(options.type || options.method, isCrossOrigin),
		initialData     = options.data || null,
		cache           = options.cache === undefined ? true : !!options.cache,
		type            = options.dataType ? options.dataType.toLowerCase() : determineType(initialData),
		user            = options.user || options.username || '',
		password        = options.password || '',
		statusCode      = options.statusCode,
		xhrFields       = options.xhrFields,
		headers         = _.extend({ 'X-Requested-With': 'XMLHttpRequest' }, options.headers),

		xhr;

	// prepare the promise
	var promises = promise(), func;
	if ((func = options.success))  { promises.done(func);     }
	if ((func = options.complete)) { promises.complete(func); }
	if ((func = options.error))    { promises.error(func);    }
	if ((func = options.progress)) { promises.progress(func); }

	var data = prepareData(initialData, method, type),
		url  = prepareUrl(initialUrl, data, method, cache);

	var send = function() {
		var isTypeSupported,
			xhr = createXHR();

		xhr.onprogress = progressHandler(promises);

		// Open connection
		if (isCrossOrigin) {
	        xhr.open(method, url);
	    } else {
			xhr.open(method, url, async, user, password);
	    }

		if (isVersion2 && async) {
	        xhr.withCredentials = withCredentials;
	    }

		// Identify supported XHR version
		if (type && isVersion2) {
			_.attempt(function() {
				xhr.responseType = type;
				// Don't verify for 'document' since we're using an internal routine
				isTypeSupported = (xhr.responseType === type && type !== 'document');
			});
		}

		var handleResponse = xhr._handleResponse = responseHandler(xhr, type, isTypeSupported, promises, url, statusCode, getTimer);
		handleResponse.bind(isCrossOrigin, isVersion2);
		
		if (!isCrossOrigin) {
			prepareHeaders(xhr, headers, method, type);
		}

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

		if (isCrossOrigin) {
	        // https://developer.mozilla.org/en-US/docs/Web/API/XDomainRequest
	        setTimeout(function() { xhr.send(); }, 0);
	    } else {
			xhr.send(method !== 'GET' ? data : null);
	    }

	    return xhr;
	};

	xhr = send();

	// Timeout/retries
    var timeout = function() {
	    timerTimeout = setTimeout(function() {
	        xhr.abort();
	        xhr.response = 'Timeout ('+ url +')';
	        
	        if (currentTries >= retries) {
	        	if (async) { xhr._handleResponse(); }
	        	return;
	        }

	        currentTries++;
	    	xhr = send();
	    	timeout();
			
	    }, timeoutDur);
	};

	timeout();

	// return the promises
	return promises.promise();
}

// a shortcut composer for xaja methods, e.g. .get(), .post()
var shortcut = function(method) {
	return function(url, data, success, dataType) {
		// url isnt a string, assume
		// an object was passed to a
		// shortcut method
		if (!_.isString(url)) {
			return xaja(url);
		}

		// compose a xaja object with 
		// the parameters passed
		if (method === 'GET' && _.isFunction(data)) {
			success = data;
			data = null;
		}

		return xaja({
			url:      url,
			data:     data,
			method:   method,
			success:  success,
			dataType: dataType
		});
	};
};

module.exports = _.extend(xaja, {
	timeout:  3000,
	default:  'post',
	xhr2:     isVersion2,
	getXHR:   getXHR,
	ajax:     xaja,
	get:      shortcut('GET'),
	post:     shortcut('POST'),
	put:      shortcut('PUT'),
	del:      shortcut('DELETE')
});
},{"./prepare-data":2,"./prepare-headers":3,"./prepare-url":4,"./progress-handler":5,"./promise":6,"./response-handler":7,"./utils":8}],2:[function(require,module,exports){
var _ = require('./utils');

// serializeData to query string
var serializeData = function(data) {
	var values = [],
		key;
	for (key in data) {
		if (data[key] !== undefined) {
			values.push(encodeURIComponent(key) + (data[key].pop ? '[]' : '') + '=' + encodeURIComponent(data[key]));
		}
	}
	return values.join('&');
};

module.exports = function(data, method, type) {
	if (!_.exists(data)) {
		return null;
	}

	if (
		type === 'arraybuffer' ||
		type === 'formdata'    ||
		type === 'document'    ||
		type === 'file'        ||
		type === 'blob'        
	) {
		return method === 'GET' ? null : data; 
	}
	
	if (type === 'text' && _.isString(data)) {
		return data;
	}

	if (type === 'json' && !_.isString(data)) {
		data = JSON.stringify(data);
	}

	if (type === 'post') {
		return serializeData(data);
	}

	return data;
};
},{"./utils":8}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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

},{"./utils":8}],5:[function(require,module,exports){
module.exports = function(promises) {
	return function(evt) {
		if (!evt.lengthComputable) { return; }

		// evt.loaded the bytes browser receive
		// evt.total the total bytes seted by the header
		var percentComplete = (evt.loaded / evt.total) * 100;
		promises.tick(percentComplete);
	};
};
},{}],6:[function(require,module,exports){
var makeCalls = function(arr, context, arg) {
	if (!arr) { return; }

	var idx = 0,
		fn;
	while ((fn = arr[idx])) {
		idx++;
		fn.call(context, arg);
	}

	arr.length = 0;
};

module.exports = function() {

	var successStack,
		errorStack,
		progressStack,
		completeStack,

		api = {
			tick: function(perc) {
				makeCalls(progressStack, perc, perc);
				return api;
			},
			resolve: function(xhr, response) {
				setTimeout(function() {
					makeCalls(successStack, xhr, response);
					makeCalls(completeStack, xhr);
				}, 0);
				return api;
			},
			reject: function(xhr, response) {
				setTimeout(function() {
					makeCalls(errorStack, xhr, response);
					makeCalls(completeStack, xhr);
				}, 0);
				return api;
			},

			promise: function() {
				var p = {
					then: function(fn, err) {
						successStack = successStack || [];
						successStack.push(fn);

						if (err) { p.catch(err); }
						
						return p;
					},
					catch: function(fn) {
						errorStack = errorStack || [];
						errorStack.push(fn);
						return p;
					},
					finally: function(fn) {
						completeStack = completeStack || [];
						completeStack.push(fn);
						return p;
					},
					progress: function(fn) {
						progressStack = progressStack || [];
						progressStack.push(fn);
						return p;
					}
				};

				// jquery methods: done, fail, always
				p.done   = p.then;
				p.fail   = p.catch;
				p.always = p.finally;

				return p;
			}
		};

	return api;
};
},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
module.exports = {
    attempt: function(fn) {
        try {
            return fn();
        } catch (e) {}
    },
    isString: function(obj) {
		return typeof obj === 'string';
	},
	isFunction: function(obj) {
		return typeof obj === 'function';
	},

	exists: function(obj) {
		return obj !== null && obj !== undefined;
	},

    // Extend a given object with all the properties in passed-in object(s).
    extend: function(base) {
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

    now: Date.now || function() {
		return +new Date();
	}
};
},{}]},{},[1])(1)
});