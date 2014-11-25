var gulp       = require('gulp'),
    unpathify  = require('unpathify'),
    buffer     = require('vinyl-buffer'),
    uglify     = require('gulp-uglify'),
    gzip       = require('gulp-gzip'),
    source     = require('vinyl-source-stream'),
    browserify = require('browserify');

var build = function() {
    return browserify('./src/index.js', {
            standalone: 'xaja'
        })
        .bundle();
};

var minify = function() {
    return build()
        .pipe(unpathify())
        .pipe(source('xaja.min.js'))
        .pipe(buffer())
        .pipe(uglify({
            "mangle": {
                "sort": true,
                "toplevel": true,
                "eval": true
            },
            "compress": {
                "properties": true,
                "unsafe": true,
                "sequences": true,
                "dead_code": true,
                "conditionals": true,
                "booleans": true,
                "unused": true,
                "if_return": true,
                "join_vars": true,
                "drop_console": true,
                "comparisons": true,
                "loops": true,
                "cascade": true,
                "warnings": true,
                "negate_iife": true,
                "pure_getters": true
            }
        }));
};

gulp.task('default', function() {
    build()
        .pipe(source('xaja.js'))
        .pipe(gulp.dest('./'));
});

gulp.task('dev', function() {
    gulp.watch('./src/**/*.js', function() {
        gulp.start('default');
    });
});

gulp.task('min', function() {
    minify()
        .pipe(gulp.dest('./'));
});

gulp.task('zip', function() {
    minify()
        .pipe(gzip())
        .pipe(gulp.dest('./'));
});