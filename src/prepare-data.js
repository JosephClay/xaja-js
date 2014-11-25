var root = window,
	_encodeURIComponent = encodeURIComponent;

module.exports = function(data, method) {
	var isSerialized = false;

	if (
		root.ArrayBuffer &&
		(data instanceof ArrayBuffer ||
		data instanceof Blob         ||
		data instanceof Document     ||
		data instanceof FormData)
	) {
		if (method === 'GET') {
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