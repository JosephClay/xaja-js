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

    _promise = require('./Promise'),
    _prepareUrl = require('./prepareUrl'),
    _prepareData = require('./prepareData'),
    _prepareHeaders = require('./prepareHeaders'),
    _responseHandler = require('./responseHandler'),

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
		xhr.send(method === _POST ? data : null);

		// return the promises
		return promises;	
	};

// Return final xaja object
var api = {
	xhr2: _isVersion2,
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
	get: function(url, data, success, dataType) {
		return xaja({
			url: url,
			success: success,
			dataType: dataType
		});
	},
	post: function(url, data, success, dataType) {
		return xaja({
			url: url,
			method: _POST,
			success: success,
			dataType: dataType
		});
	}
};

if (typeof define === 'function') {
	define(api);
} else if (typeof module !== 'undefined') {
	module.exports = api;
}

root.xaja = api;