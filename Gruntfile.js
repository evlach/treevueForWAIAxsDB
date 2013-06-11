module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! jQuery Treevue ' + 
                        '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'jquery.treevue.js',
                dest: 'jquery.treevue.min.js'
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Default task.
    grunt.registerTask('default', ['uglify']);

};