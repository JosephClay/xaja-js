var _ = require('lodash'),
    through = require('through2');

var strReplace = function(content, value, key) {
    var regex = new RegExp("'"+ key +"'", 'g');
    return content.replace(regex, value);
};

var varReplace = function(content, value, key) {
    var regex = new RegExp(key, 'g');
    return content.replace(regex, value);
};

var Wrapper = function(options) {
    var opts = options || {},
        strings = options.strings || {},
        variables = options.variables || {};

    // return the stream
    return through.obj(function(file, enc, callback) {
        var contents = file.contents.toString();

        contents = _.reduce(strings, strReplace, contents);
        contents = _.reduce(variables, varReplace, contents);

        if (file.isBuffer()) {
            file.contents = new Buffer(contents);
        }

        if (file.isStream()) {
            var stream = through();
            stream.write(new Buffer(contents));
            stream.on('error', this.emit.bind(this, 'error'));
            file.contents = file.contents.pipe(stream);
        }

        // make sure the file goes through the next gulp plugin
        this.push(file);
        // tell the stream engine that we are done with this file
        callback();
    });
};

module.exports = Wrapper;