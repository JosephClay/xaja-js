module.exports = function(promises) {
	return function(evt) {
		if (!evt.lengthComputable) { return; }

		// evt.loaded the bytes browser receive
		// evt.total the total bytes seted by the header
		var percentComplete = (evt.loaded / evt.total) * 100;
		promises.tick(percentComplete);
	};
};