(function(xaja) {

	QUnit.test('Existance', function(assert) {
		assert.expect(3);

		assert.ok(!!xaja, 'xaja does not exist');
		assert.ok(_.isFunction(xaja), 'xaja is not invokable');
		assert.ok(_.keys(xaja).length, 'xaja does not have methods');
	});

	QUnit.test('XHR2', function(assert) {
		assert.expect(1);

		assert.ok(Modernizr.xhr2 === xaja.xhr2);
	});

	(function() {
		_.each(METHODS, function(method) {
			var METHOD = method.toUpperCase();

			QUnit.test('Asynchronous REST requests: ' + METHOD, function(assert) {
				assert.expect(1);
				
				var done = assert.async(),
					url = TESTS.async + '?method=' + METHOD;

				xaja.ajax({
						url: url,
						method: method
					})
					.then(function(response) {
						assert.ok(JSON.parse(response).status === 'ok', METHOD + ' request');
						done();
					})
					.catch(function(message) {
						assert.ok(false, message);
						done();
					});
			});
		});
	}());

	QUnit.test('Multiple promises (async)', function(assert) {
		assert.expect(2);

		var counter = function() {
			var count = 0,
				fn = function() {
					count += 1;
				};
			fn.val = function() { return count; };
			fn.reset = function() { count = 0; };
			return fn;
		};

		var done = assert.async(),
			a = counter(),
			b = counter(),
			c = counter();

		xaja.get(TESTS.multiple)
			 .then(a)
			 .catch(b)
			 .then(a)
			 .always(c)
			 .always(function() {
				c();

				assert.ok(a.val() === 3 && b.val() === 0 && c.val() === 2, a.val() +'-'+ b.val() +'-'+ c.val());

				a.reset();
				b.reset();
				c.reset();

				xaja.get(TESTS.multiple2)
					 .then(a)
					 .catch(b)
					 .then(a)
					 .always(c)
					 .always(function() {
						c();
						assert.ok(a.val() === 3 && b.val() === 0 && c.val() === 2, a.val() +'-'+ b.val() +'-'+ c.val());
					 })
					 .then(a)
					 .catch(b)
					 .always(function() { done(); });
			 })
			 .then(a)
			 .catch(b);
	});

	QUnit.test('Timeout (async)', function(assert) {
		assert.expect(1);

		var done = assert.async(),
			begin = Date.now();
		xaja.ajax({
				url: TESTS.timeout,
				method: 'GET',
				timeout: 250,
				retries: 4
			})
			.then(function(response) {
				assert.ok(false, (Date.now() - begin) + 'ms');
				done();
			})
			.catch(function(message) {
				assert.ok((Date.now() - begin) >= 1000, (Date.now() - begin) + 'ms');
				done();
			});
	});

	QUnit.test('CORS', function(assert) {
		assert.expect(1);

		var done = assert.async();
		xaja.get(TESTS.cors)
			.then(function(response) {
				assert.ok(JSON.parse(response).status === 'ok');
				done();
			})
			.catch(function(message) {
				assert.ok(false, message);
				done();
			});
	});

	QUnit.test('Before promise', function(assert) {
		assert.expect(1);

		var done = assert.async();
		xaja.ajax({
				url: TESTS.before,
				before: function() {
					this.setRequestHeader('X-Running-Test', 'before');
				}
			})
			.then(function(response) {
				assert.ok(JSON.parse(response).status === 'ok');
				done();
			})
			.catch(function(message) {
				assert.ok(false, message);
				done();
			});
	});

	QUnit.test('Cache', function(assert) {
		assert.expect(2);

		var done = assert.async();

		xaja.ajax({
				url: TESTS.cache,
				method: 'GET',
				dataType: 'text'
			})
			.then(function(response) {
				assert.ok(true, 'GET cached');

				xaja.get({
						url: TESTS.cache,
						method: 'GET',
						dataType: 'text',
						cache: false
					})
					.then(function(response) {
						assert.ok(true, 'GET cache bust');
						done();
					})
					.catch(function(message) {
						assert.ok(false, message);
						done();
					});

			})
			.catch(function(message) {
				assert.ok(false, message);
				done();
			});
	});

	QUnit.test('Authentication', function(assert) {
		assert.expect(1);
		
		var done = assert.async();
		xaja.ajax({
				url: TESTS.auth,
				method: 'GET',
				user: 'pyrsmk',
				password: 'test'
			})
			.always(function(message) {
				assert.ok(true, 'ok');
				done();
			});
	});

	QUnit.test('Get JSON response', function(assert) {
		assert.expect(1);

		var done = assert.async();
		xaja.ajax({
				url: TESTS.getJSON,
				method: 'GET',
				dataType: 'json'
			})
			.then(function(response) {
				assert.ok(response.status === 'ok');
				done();
			})
			.catch(function(message) {
				assert.ok(false, message);
				done();
			});
	});

	QUnit.test('Get DOMString response', function(assert) {
		assert.expect(1);

		var done = assert.async();
		xaja.ajax({
				url: TESTS.getText,
				method: 'GET',
				dataType: 'text'
			})
			.then(function(response) {
				assert.ok(response === 'ok');
				done();
			})
			.catch(function(message) {
				assert.ok(false, message);
				done();
			});
	});

	QUnit.test('Get XML response', function(assert) {
		assert.expect(1);

		var done = assert.async();
		xaja.ajax({
				url: TESTS.getXML,
				method: 'GET',
				dataType: 'xml'
			})
			.then(function(response) {
				assert.ok(response.getElementsByTagName('status')[0].textContent === 'ok');
				done();
			})
			.catch(function(message) {
				assert.ok(false, message);
				done();
			});
	});

	if (window.ArrayBuffer) {
		QUnit.test('Get ArrayBuffer response', function(assert) {
			assert.expect(1);

			var done = assert.async();
			xaja.ajax({
					url: TESTS.getArrayBuffer,
					method: 'GET',
					dataType: 'arraybuffer'
				})
				.then(function(response) {
					var arrayBuffer = new Uint8Array(response),
						length = arrayBuffer.length;
					assert.ok(
						arrayBuffer[0].toString(16) === 'ff'        &&
						arrayBuffer[1].toString(16) === 'd8'        &&
						arrayBuffer[length-2].toString(16) === 'ff' &&
						arrayBuffer[length-1].toString(16) === 'd9'
					);
					done();
				})
				.catch(function(message) {
					assert.ok(false, message);
					done();
				});
		});
	}

	if (window.Blob) {
		QUnit.test('Get Blob response', function(assert) {
			assert.expect(1);

			var done = assert.async();
			xaja.ajax({
					url: TESTS.getBlob,
					method: 'GET',
					dataType: 'blob'
				})
				.then(function(response) {
					assert.ok(response.size);
					done();
				})
				.catch(function(message) {
					assert.ok(false, message);
					done();
				});
		});
	}

	if (xaja.xhr2) {
		QUnit.test('Get Document response', function(assert) {
			assert.expect(1);

			var done = assert.async();
			xaja.ajax({
					url: TESTS.getDocument,
					method: 'GET',
					dataType: 'document'
				})
				.then(function(response) {
					assert.ok(Object.prototype.toString.call(response) === '[object HTMLDocument]');
					done();
				})
				.catch(function(message) {
					assert.ok(false, message);
					done();
				});
		});
	}

	QUnit.test('Send basic POST data', function(assert) {
		assert.expect(1);

		var done = assert.async();
		xaja.post(TESTS.sendPost, {
				foo: 'bar'
			})
			.then(function(response) {
				assert.ok(JSON.parse(response).status === 'ok');
				done();
			})
			.catch(function(message) {
				assert.ok(false, message);
				done();
			});
	});

	QUnit.test('Send JSON data', function(assert) {
		assert.expect(1);

		var done = assert.async();
		xaja.ajax({
				url: TESTS.sendJSON,
				method: 'POST',
				dataType: 'json',
				data: {
					foo: 'bar',
					bar: [ { foo: 'bar' } ]
				}
			})
			.then(function(response) {
				assert.ok(response.status === 'ok');
				done();
			})
			.catch(function(message) {
				assert.ok(false,message);
				done();
			});
	});

	QUnit.test('Send DOMString data', function(assert) {
		assert.expect(1);
		
		var done = assert.async();
		xaja.ajax({
				url: TESTS.sendText,
				method: 'POST',
				data: 'text',
				dataType: 'text'
			})
			.then(function(response) {
				assert.ok(JSON.parse(response).status === 'ok');
				done();
			})
			.catch(function(message) {
				assert.ok(false, message);
				done();
			});
	});

	if (window.FormData) {
		QUnit.test('Send FormData data', function(assert) {
			assert.expect(1);

			var done = assert.async(),
				formData = new FormData();
			formData.append('firstname', 'Pedro');
			formData.append('lastname', 'Sanchez');
			xaja.post(TESTS.sendFormData, formData)
				.then(function() {
					assert.ok(true);
					done();
				})
				.catch(function(message) {
					assert.ok(false);
					done();
				});
		});
	}

	if (window.Blob) {
		QUnit.test('Send Blob data', function(assert) {
			assert.expect(1);

			var done = assert.async(),
				blob = new Blob(['test'], { type:'text/plain' });
			xaja.post(TESTS.sendBlob, blob)
				.then(function() {
					assert.ok(true);
					done();
				})
				.catch(function(message) {
					assert.ok(false, message);
					done();
				});
		});
	}

	/*
	if (xaja.xhr2) {
		QUnit.test('Send Document data', function(assert) {
			assert.expect(1);

			var done = assert.async();
			xaja.post(TESTS.sendDocument, document)
				.then(function() {
					assert.ok(true);
					done();
				})
				.catch(function(message) {
					assert.ok(false, message);
					done();
				});
		});
	}
	*/

	if (window.ArrayBuffer) {
		QUnit.test('Send ArrayBuffer data', function(assert) {
			assert.expect(1);

			var done = assert.async(),
				arrayBuffer = new Uint8Array([1,2,3]);
			xaja.post(TESTS.sendArrayBuffer, arrayBuffer)
				.then(function() {
					assert.ok(true);
					done();
				})
				.catch(function(message) {
					assert.ok(false, message);
					done();
				});
		});
	}

}(window.xaja));
