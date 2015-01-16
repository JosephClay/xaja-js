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