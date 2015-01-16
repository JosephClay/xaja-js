var TESTS = {
	cors:            'http://sandbox.dreamysource.fr/cors/',

	async:           '/test/async/',
	sync:            '/test/sync/',
	multiple:        '/test/multiple/one',
	multiple2:       '/test/multiple/two',
	timeout:         '/test/timeout/',
	before:          '/test/before/',
	cache:           '/test/cache/',
	auth:            '/test/auth/',
	getJSON:         '/test/get-json/',
	getText:         '/test/get-text/',
	getArrayBuffer:  '/test/get-array-buffer/',
	getBlob:         '/test/get-blob/',
	sendPost:        '/test/send-post/',
	sendJSON:        '/test/send-json/',
	sendText:        '/test/send-text/',
	sendFormData:    '/test/send-form-data/',
	sendBlob:        '/test/send-blob/',
	sendDocument:    '/test/send-document/',
	sendArrayBuffer: '/test/send-array-buffer/',

	getXML:          '/static/document.xml',
	getDocument:     '/static/document.html'
};

var METHODS = [
	'get',
	'post',
	'put',
	'delete'
];