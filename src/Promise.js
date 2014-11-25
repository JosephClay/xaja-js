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
			then: function(func) {
				successStack.push(func);
				return api;
			},
			error: function(func) {
				errorStack.push(func);
				return api;
			},
			catch: function(func) {
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
			finally: function(func) {
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