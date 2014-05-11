module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-rquirejs');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.initConfig({
        watch: {
            scripts: {
                files: ['src/**/*.js'],
                tasks: ['rquire'],
                options: {
                    spawn: false,
                }
            },
        },
        rquire: {
            options: {
                globals: {
                    'root' : "window",
                    '_POST': "'POST'",
                    '_GET' : "'GET'"
                },
                src_root: 'src/',
                main: 'xaja.js',
                safe_undefined: true
            },
            dev: {
                options: {
                    dest: 'dist/xaja.js'
                }
            },
            prod: {
                options: {
                    dest: 'xaja.js',
                    micro_paths: true
                }
            }
        },
        uglify: {
            prod: {
                files: {
                    'xaja.min.js': 'xaja.js'
                }
            }
        }
    });

    grunt.registerTask('default', ['rquire:dev', 'watch']);
    grunt.registerTask('prod', ['rquire:prod', 'uglify:prod']);
    grunt.registerTask('all', ['rquire:dev', 'rquire:prod', 'uglify:prod']);
};
