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