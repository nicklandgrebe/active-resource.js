module.exports = function(grunt) {

  // configure the tasks
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      dist: {
        src: [ 'dist' ]
      },
      build: {
        src: [ 'build/**/*.js', '!build/module.js' ]
      },
      specs: {
        src: 'spec/spec.js'
      }
    },
    coffee: {
      build: {
        expand: true,
        cwd: 'src',
        src: [ '**/*.coffee' ],
        dest: 'build',
        ext: '.js'
      },
      specs: {
        files: {
          'spec/spec.js': [ 'spec/support/*.coffee', 'spec/**/*.coffee' ]
        }
      }
    },
    umd_wrapper: {
      build: {
        options: {},
        files: {
          'build/activeresource.tmp.js': 'build/module.js'
        }
      },
      specs: {
        options: {},
        files: {
          'spec/spec.js': 'spec/module.js'
        }
      }
    },
    uglify: {
      build: {
        options: {
          mangle: false,
          banner:
            '/*\n' +
            '\tActiveResource.js <%= pkg.version %>\n' +
            '\t(c) <%= grunt.template.today("yyyy") %> Nick Landgrebe && Peak Labs, LLC DBA Occasion App\n' +
            '\tActiveResource.js may be freely distributed under the MIT license\n' +
            '\tPortions of ActiveResource.js were inspired by or borrowed from Rail\'s ActiveRecord library\n' +
            '*/\n'
        },
        files: {
          'dist/activeresource.min.js': 'build/activeresource.tmp.js'
        }
      }
    },
    watch: {
      scripts: {
        files: 'src/**/*.js.coffee',
        tasks: [ 'build' ]
      }
    },
    connect: {
      test: {
        options: {
          port: 8000
        }
      }
    },
    jasmine: {
      activeresource: {
        options: {
          keepRunner: true,
          specs: 'spec/spec.js',
          host: 'http://127.0.0.1:8000',
          vendor: [
            '/node_modules/jquery/dist/jquery.min.js'
          ],
          template: require('grunt-template-jasmine-requirejs'),
          templateOptions: {
            requireConfig: {
              baseUrl: '/',
              paths: {
                "jquery": '/node_modules/jquery/dist/jquery.min',
                "underscore": '/node_modules/underscore/underscore-min',
                "underscore.string": '/node_modules/underscore.string/dist/underscore.string',
                "underscore.inflection": '/node_modules/underscore.inflection/lib/underscore.inflection',
                "activeresource": '/dist/activeresource.min',
                "jasmine-jquery": '/node_modules/jasmine-jquery/lib/jasmine-jquery',
                "jasmine-ajax": '/node_modules/jasmine-ajax/lib/mock-ajax'
              }
            }
          }
        }
      }
    }

  });

  // load the tasks
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-umd-wrapper');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  // define the tasks
  grunt.registerTask(
    'compile',
    'Compiles the source files into a minified UMD module file.',
    [ 'coffee:build', 'umd_wrapper:build', 'uglify', 'clean:build' ]
  );

  grunt.registerTask(
    'spec',
    'Compiles and runs the Javascript spec files for ActiveResource.js source code.',
    [ 'clean:specs', 'coffee:specs', 'umd_wrapper:specs', 'connect:test', 'jasmine:activeresource' ]
  )

  grunt.registerTask(
    'build',
    'Creates a new build of the library in the dist folder, then runs the specs on it.',
    [ 'clean:dist', 'compile', 'spec' ]
  );

  grunt.registerTask(
    'default',
    'Watches the project for changes, automatically builds them and runs specs.',
    [ 'build', 'watch' ]
  );
};
