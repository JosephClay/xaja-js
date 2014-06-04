(function(root, _POST, _GET, _PUT, _DEL, undefined) {
    (function(config, definitions, undefined) {

        var modules = {

        };

        var moduleCache = {

        };

        var aliases = {

        };

        for (var alias in config.aliases) {
            aliases[alias] = config.aliases[alias];
        }

        var require = function(path) {
            path = aliases[path] || path;
            return moduleCache[path] || (moduleCache[path] = modules[path]());
        };

        var define = function(path, definition) {
            var module;

            modules[path] = function() {
                if (module) {
                    return module.exports;
                }
                module = { exports: {} };
                definition(require, module, module.exports);
                return module.exports;
            };
        };

        for (var path in definitions) {
            define(path, definitions[path]);
        }

        require(config.main);

    }(
        {
            "main": "/xaja.js",
            "aliases": {}
        },
        {
            "/xaja.js": function(require, module, exports) {
                /**
                 * Based on qwest
                 * https://github.com/pyrsmk/qwest
                 */
                var _XML_HTTP_REQUEST = 'XMLHttpRequest',

                	_getXHR = function() {
                		return root[_XML_HTTP_REQUEST] ?
                				new root[_XML_HTTP_REQUEST]() :
                				new ActiveXObject('Microsoft.XMLHTTP');
                	},

                	// Guess XHR version
                	_isVersion2 = (_getXHR().responseType === ''),

                	_isString = function(obj) {
                		return Object.prototype.toString.call(obj) === '[object String]';
                	},

                    // Extend a given object with all the properties in passed-in object(s).
                    _extend = function(obj) {
                        var args = arguments,
                            base = args[0],
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

                    _promise = require('/Promise.js'),
                    _prepareUrl = require('/prepareUrl.js'),
                    _prepareData = require('/prepareData.js'),
                    _prepareHeaders = require('/prepareHeaders.js'),
                    _responseHandler = require('/responseHandler.js'),

                	// Core function
                	xaja = function(options) {

                		var isTypeSupported = false,
                			xhr             = options.xhr ? options.xhr() : _getXHR(),
                			overrideMime    = options.mimeType,
                			beforeSend      = options.beforeSend,
                			initialUrl      = options.url  || '',
                			method          = options.type || options.method || _GET,
                			initialData     = options.data || null,
                			async           = options.async === undefined ? true : !!options.async,
                			cache           = options.cache,
                			type            = options.dataType ? options.dataType.toLowerCase() : 'json',
                			user            = options.user || options.username || '',
                			password        = options.password || '',
                			statusCode      = options.statusCode,
                			callContext     = options.context,
                			xhrFields       = options.xhrFields,
                			headers         = _extend({ 'X-Requested-With': _XML_HTTP_REQUEST },
                				options.contentType ? { 'Content-Type': options.contentType } : {},
                				options.headers);

                		var promises = _promise(), func;
                		if ((func = options.success))  { promises.success(func);  }
                		if ((func = options.complete)) { promises.complete(func); }
                		if ((func = options.error))    { promises.error(func);    }
                		if ((func = options.progress)) { promises.progress(func); }

                		// prepare data
                		var dataPrep = _prepareData(initialData, method),
                			data = dataPrep.data,
                			isSerialized = dataPrep.serialized;

                		// prepare url
                		url = _prepareUrl(initialUrl, data, method, cache);

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
                		if (type && _isVersion2) {
                			try {
                				xhr.responseType = type;
                				isTypeSupported = (xhr.responseType == type);
                			}
                			catch (e) {}
                		}

                		var handleResponse = _responseHandler(xhr, isTypeSupported, promises, url, statusCode, callContext);
                		// Plug response handler
                		if (_isVersion2) {

                			xhr.onload = handleResponse;

                		} else {

                			xhr.onreadystatechange = function() {
                				if (xhr.readyState !== 4) { return; }
                				handleResponse();
                			};
                		}

                		_prepareHeaders(xhr, headers, method, type, isSerialized);

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
                		xhr.send(method !== _GET ? data : null);

                		// return the promises
                		return promises;
                	};

                // a shortcut composer for xaja methods, e.g. .get(), .post()
                var _shortcut = function(method) {
                	return function(url, data, success, dataType) {
                		return xaja({
                			url: url,
                			method: method,
                			success: success,
                			dataType: dataType
                		});
                	};
                };

                // Return final xaja object
                var api = {
                	xhr2: _isVersion2,
                	getXHR: _getXHR,
                	ajax: function(url, options) {
                		var config;
                		if (_isString(url)) {
                			config = options || {};
                			config.url = url;
                		} else {
                			config = url || {};
                		}
                		return xaja(config);
                	},
                	get: _shortcut(_GET),
                	post: _shortcut(_POST),
                	put: _shortcut(_PUT),
                	del: _shortcut(_DEL)
                };

                if (typeof define === 'function') {
                	define(api);
                } else if (typeof module !== 'undefined') {
                	module.exports = api;
                }

                root.xaja = api;
            },
            "/Promise.js": function(require, module, exports) {
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
            },
            "/prepareUrl.js": function(require, module, exports) {
                var _rHasQuery = /\?/,
                	_now = Date.now || function() { return new Date().getTime(); };

                module.exports = function(url, data, method, cache) {
                	var vars = '';

                	// Prepare URL
                	if (method === _GET) {
                		vars += data;
                	}

                	if (cache !== undefined) {
                		cache = (method === _POST);
                	}

                	if (!cache) {
                		if (vars) { vars += '&'; }
                		vars += '___=' + _now();
                	}

                	if (vars) {
                		url += (_rHasQuery.test(url) ? '&' : '?') + vars;
                	}

                	return url;
                };
            },
            "/prepareData.js": function(require, module, exports) {
                var _encodeURIComponent = encodeURIComponent;

                module.exports = function(data, method) {
                	var isSerialized = false;

                	if (
                		root.ArrayBuffer &&
                		(data instanceof ArrayBuffer ||
                		data instanceof Blob         ||
                		data instanceof Document     ||
                		data instanceof FormData)
                	) {
                		if (method === _GET) {
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
            },
            "/prepareHeaders.js": function(require, module, exports) {
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
            },
            "/responseHandler.js": function(require, module, exports) {
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
            }
        }
    ));
}(window, 'POST', 'GET', 'PUT', 'DELETE'));
