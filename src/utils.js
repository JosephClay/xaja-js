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