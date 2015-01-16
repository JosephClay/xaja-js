var gulp       = require('gulp'),
    unpathify  = require('bundle-collapser/plugin'),
    buffer     = require('vinyl-buffer'),
    uglify     = require('gulp-uglify'),
    gzip       = require('gulp-gzip'),
    replace    = require('gulp-replacer'),
    wrap       = require('gulp-js-wrapper'),
    source     = require('vinyl-source-stream'),
    browserify = require('browserify');

var build = function() {
    return browserify('./src/index.js', {
        standalone: 'xaja'
    });
};

var minify = function() {
    return build()
        .plugin(unpathify)
        .bundle()
        .pipe(source('xaja.min.js'))
        .pipe(buffer())
        .pipe(replace({
            strings: {
                'XMLHttpRequest': 'XML_HTTP_REQUEST',
                'responseText':   'RESPONSE_TEXT',
                'Content-Type':   'CONTENT_TYPE',
                'Accept':         'ACCEPT',
                
                'arraybuffer':    'TYPE_ARRAY_BUFFER',
                'blob':           'TYPE_BLOB',
                'document':       'TYPE_DOCUMENT',
                'formdata':       'TYPE_FORM_DATA',
                'post':           'TYPE_POST',
                'json':           'TYPE_JSON',
                'xml':            'TYPE_XML',
                'file':           'TYPE_FILE',
                'text':           'TYPE_TEXT',

                'GET':            'METHOD_GET',
                'POST':           'METHOD_POST',
                'PUT':            'METHOD_PUT',
                'DELETE':         'METHOD_DELETE'
            },
            variables: {
                'null': 'NULL'
            }
        }))
        .pipe(wrap({
            safeUndef: true,
            globals: {
                'window':               'window',
                'document':             'document',
                'Date':                 'Date',
                'encodeURIComponent':   'encodeURIComponent',
                'null':                 'NULL',
                'setTimeout':           'setTimeout',
                
                '"XMLHttpRequest"':     'XML_HTTP_REQUEST',
                '"responseText"':       'RESPONSE_TEXT',
                '"Content-Type"':       'CONTENT_TYPE',
                '"Accept"':             'ACCEPT',

                '"arraybuffer"':        'TYPE_ARRAY_BUFFER',
                '"blob"':               'TYPE_BLOB',
                '"document"':           'TYPE_DOCUMENT',
                '"formdata"':           'TYPE_FORM_DATA',
                '"post"':               'TYPE_POST',
                '"json"':               'TYPE_JSON',
                '"xml"':                'TYPE_XML',
                '"file"':               'TYPE_FILE',
                '"text"':               'TYPE_TEXT',

                '"GET"':                'METHOD_GET',
                '"POST"':               'METHOD_POST',
                '"PUT"':                'METHOD_PUT',
                '"DELETE"':             'METHOD_DELETE'
            }
        }))
        .pipe(uglify());
};

gulp.task('default', function() {
    build()
        .bundle()
        .pipe(source('xaja.js'))
        .pipe(gulp.dest('./'))
        .pipe(gulp.dest('./unit/public/js'));
});

gulp.task('dev', function() {
    gulp.watch('./src/**/*.js', ['default']);
});

gulp.task('min', function() {
    minify()
        .pipe(gulp.dest('./'))
        .pipe(gulp.dest('./unit/public/js'));
});

gulp.task('zip', function() {
    minify()
        .pipe(gzip())
        .pipe(gulp.dest('./'));
});

gulp.task('release', [ 'default', 'min', 'zip' ]);