(function() {

	var log = function(assert) {
		return function(res) {
			if (Object.prototype.toString.call(res) === '[object XMLDocument]') {
				return assert.ok(true, '[object XMLDocument]');
			}

			assert.ok(true, JSON.stringify(res));
		};
	};

	var err = function(assert) {
		return function(res) {
			assert.ok(false, JSON.stringify(res));
		};
	};
	
	_.each(METHODS, function(method) {
		QUnit.test('$ Asynchronous REST requests: ' + method, function(assert) {
			var done = assert.async(),
				METHOD = method.toUpperCase(),
				url = TESTS.async + '?method=' + METHOD;
			
			$.ajax({
					url: url,
					method: method
				})
				.done(log(assert))
				.fail(err(assert))
				.always(done);
		});
	});

	QUnit.test('$ Multiple promises (async)', function(assert) {
		var done = assert.async();

		$.get(TESTS.multiple)
			.done(log(assert))
			.fail(err(assert))
			.always(function() {

				$.get(TESTS.multiple2)
					.done(log(assert))
		 			.fail(err(assert))
		 			.always(done);

			});
	});

	QUnit.test('$ Timeout (async)', function(assert) {
		var done = assert.async();

		$.ajax({
				url: TESTS.timeout,
				method: 'GET'
			})
			.done(log(assert))
			.fail(err(assert))
			.always(done);
	});

	QUnit.test('$ CORS', function(assert) {
		var done = assert.async();

		$.get(TESTS.cors)
			.done(log(assert))
			.fail(err(assert))
			.always(done);
	});

	QUnit.test('$ Before promise', function(assert) {
		var done = assert.async();

		$.ajax({
				url: TESTS.before,
				method: 'GET',
				beforeSend: function(xhr) {
					xhr.setRequestHeader('X-Running-Test', 'before');
				}
			})
			.done(log(assert))
 			.fail(err(assert))
 			.always(done);
	});

	QUnit.test('$ Cache', function(assert) {
		var done = assert.async();

		$.ajax({
				url: TESTS.cache,
				method: 'GET',
				responseType: 'text'
			})
			.done(log(assert))
 			.fail(err(assert))
			.always(function() {

				$.ajax({
						url: TESTS.cache,
						method: 'GET',
						responseType: 'text'
					})
					.done(log(assert))
 					.fail(err(assert))
 					.always(done);

			});
	});

	QUnit.test('$ Authentication', function(assert) {
		var done = assert.async();

		$.ajax({
				url: TESTS.auth,
				method: 'GET',
				username: 'pyrsmk',
				password: 'test'
			})
			.done(log(assert))
			.fail(err(assert))
			.always(done);
	});

	QUnit.test('$ Get JSON response', function(assert) {
		var done = assert.async();

		$.ajax({
				url: TESTS.getJSON,
				method: 'GET',
				responseType: 'json'
			})
			.done(log(assert))
			.fail(err(assert))
			.always(done);
	});

	QUnit.test('$ Get DOMString response', function(assert) {
		var done = assert.async();

		$.ajax({
				url: TESTS.getText,
				method: 'GET',
				responseType: 'text'
			})
			.done(log(assert))
			.fail(err(assert))
			.always(done);
	});

	QUnit.test('$ Get XML response', function(assert) {
		var done = assert.async();

		$.ajax({
				url: TESTS.getXML,
				method: 'GET',
				responseType: 'xml'
			})
			.done(log(assert))
			.fail(err(assert))
			.always(done);
	});

	if (window.ArrayBuffer) {
		QUnit.test('$ Get ArrayBuffer response', function(assert) {
			var done = assert.async();

			$.ajax({
					url: TESTS.getArrayBuffer,
					method: 'GET',
					responseType: 'arraybuffer'
				})
				.done(log(assert))
				.fail(err(assert))
				.always(done);
		});
	}

	if (window.Blob) {
		QUnit.test('$ Get Blob response', function(assert) {
			var done = assert.async();

			$.ajax({
					url: TESTS.getBlob,
					method: 'GET',
					responseType: 'blob'
				})
				.done(log(assert))
				.fail(err(assert))
				.always(done);
		});
	}

	if (xaja.xhr2) {
		QUnit.test('$ Get Document response', function(assert) {
			var done = assert.async();

			$.ajax({
					url: TESTS.getDocument,
					method: 'GET',
					responseType: 'document'
				})
				.done(log(assert))
				.fail(err(assert))
				.always(done);
		});
	}

	QUnit.test('$ Send basic POST data', function(assert) {
		var done = assert.async();
		
		$.ajax({
				url: TESTS.sendPost,
				method: 'POST',
				data: {
					foo: 'bar'
				}
			})
			.done(log(assert))
			.fail(err(assert))
			.always(done);
	});

	QUnit.test('$ Send JSON data', function(assert) {
		var done = assert.async();

		$.ajax({
				url: TESTS.sendJSON,
				method: 'POST',
				dataType: 'json',
				contentType: 'application/json',
				data: JSON.stringify({ foo: 'bar', bar: [ { foo: 'bar' } ] })
			})
			.done(log(assert))
			.fail(err(assert))
			.always(done);
	});

	QUnit.test('$ Send DOMString data', function(assert) {
		var done = assert.async();

		$.ajax({
				url: TESTS.sendText,
				method: 'POST',
				data: 'text',
				dataType: 'text',
				contentType: 'text/plain',
			})
			.done(log(assert))
			.fail(err(assert))
			.always(done);
	});
/*
	if (window.FormData) {
		QUnit.test('$ Send FormData data', function(assert) {
			var done = assert.async();

			var formData = new FormData();
			formData.append('firstname', 'Pedro');
			formData.append('lastname', 'Sanchez');
			$.post(TESTS.sendFormData, formData)
				.done(log(assert))
				.fail(err(assert))
				.always(done);
		});
	}
*/
/*
	if (window.Blob) {
		QUnit.test('$ Send Blob data', function(assert) {
			var done = assert.async();

			var blob = new Blob(['test'], { type:'text/plain' });
			$.post(TESTS.sendBlob, blob)
				.done(log(assert))
				.fail(err(assert))
				.always(done);
		});
	}
*/
/*
	if (xaja.xhr2) {
		QUnit.test('$ Send Document data', function(assert) {
			var done = assert.async();

			$.post(TESTS.sendDocument, document)
				.done(log(assert))
				.fail(err(assert))
				.always(done);
		});
	}
*/
	if (window.ArrayBuffer) {
		QUnit.test('$ Send ArrayBuffer data', function(assert) {
			var done = assert.async();

			var arrayBuffer = new Uint8Array([1,2,3]);
			$.post(TESTS.sendArrayBuffer, arrayBuffer)
				.done(log(assert))
				.fail(err(assert))
				.always(done);
		});
	}

}());
