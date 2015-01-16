var _ = require('./utils');

// serializeData to query string
var serializeData = function(data) {
	var values = [],
		key;
	for (key in data) {
		if (data[key] !== undefined) {
			values.push(encodeURIComponent(key) + (data[key].pop ? '[]' : '') + '=' + encodeURIComponent(data[key]));
		}
	}
	return values.join('&');
};

module.exports = function(data, method, type) {
	if (!_.exists(data)) {
		return null;
	}

	if (
		type === 'arraybuffer' ||
		type === 'formdata'    ||
		type === 'document'    ||
		type === 'file'        ||
		type === 'blob'        
	) {
		return method === 'GET' ? null : data; 
	}
	
	if (type === 'text' && _.isString(data)) {
		return data;
	}

	if (type === 'json' && !_.isString(data)) {
		data = JSON.stringify(data);
	}

	if (type === 'post') {
		return serializeData(data);
	}

	return data;
};