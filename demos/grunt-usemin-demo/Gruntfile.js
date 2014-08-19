var mozjpeg = require('imagemin-mozjpeg');

module.exports = function(grunt) {
    grunt.initConfig({
        clean: {
            dist: {
                src: ['dist/']
            }
        },

        useminPrepare: {
            options: {
                dest: 'dist'
            },
            html: {
                src: ['./*.html']
            }
        },

        copy: {
            html: {
                files: [
                    {
                        expand: true,
                        cwd: './',
                        src: ['*.html'],
                        dest: 'dist'
                    }
                ]
            }
        },

        imagemin: {
            options: {
                optimizationLevel: 3,
                use: [mozjpeg()]
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'img/',
                        src: ['**/*.{png,jpg,gif}'],
                        dest: 'dist/img/'
                    }
                ]
            }
        },

        rev: {
            dist: {
                options: {
                    algorithm: 'sha1',
                    length: 6
                },
                src: [
                    'dist/js/**/*.js',
                    'dist/css/**/*.css',
                    'dist/img/**/*.{jpg,jpeg,png,gif}'
                ]
            }
        },

        usemin: {
            html: ['dist/*.html', 'dist/css/**/*.css']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-rev');
    grunt.loadNpmTasks('grunt-usemin');

    grunt.registerTask('default', function() {
        grunt.task.run('clean');
        grunt.task.run('copy:html');
        grunt.task.run('useminPrepare');
        grunt.task.run('imagemin');
        grunt.task.run('concat:generated');
        grunt.task.run('uglify:generated');
        grunt.task.run('cssmin:generated');
        grunt.task.run('rev');
        grunt.task.run('usemin');
    });
};
