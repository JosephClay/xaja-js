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