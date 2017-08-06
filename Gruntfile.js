module.exports = function(grunt) {

  // configure the tasks
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      dist: {
        src: [ 'dist' ]
      },
      build: {
        src: [
          'build/**/*.js', '!build/module.js',
          '!build/active-resource.js', '!build/active-resource.min.js'
        ]
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
          'build/active-resource.js': 'build/module.js'
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
          mangle: false
        },
        files: {
          'build/active-resource.min.js': 'build/active-resource.js'
        }
      }
    },
    concat: {
      options: {
        banner:
          '/*\n' +
          '\tactive-resource <%= pkg.version %>\n' +
          '\t(c) <%= grunt.template.today("yyyy") %> Nick Landgrebe && Peak Labs, LLC DBA Occasion App\n' +
          '\tactive-resource may be freely distributed under the MIT license\n' +
          '\tPortions of active-resource were inspired by or borrowed from Rail\'s ActiveRecord library\n' +
          '*/\n\n'
      },
      raw: {
        src: 'build/active-resource.js',
        dest: 'dist/active-resource.js'
      },
      min: {
        src: 'build/active-resource.min.js',
        dest: 'dist/active-resource.min.js'
      }
    },
    watch: {
      source: {
        files: 'src/**/*.coffee',
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
                "activeresource": '/build/active-resource',
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
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-umd-wrapper');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  // define the tasks
  grunt.registerTask(
    'compile',
    'Compiles the source files into 1) a raw UMD module file and 2) a minified UMD module file.',
    [ 'coffee:build', 'umd_wrapper:build', 'uglify', 'clean:build' ]
  );

  grunt.registerTask(
    'spec',
    'Compiles and runs the Javascript spec files for ActiveResource.js source code.',
    [ 'clean:specs', 'coffee:specs', 'umd_wrapper:specs', 'connect:test', 'jasmine:activeresource' ]
  )

  grunt.registerTask(
    'build',
    'Creates a temporary build of the library in the build folder, then runs the specs on it.',
    [ 'clean:build', 'compile', 'spec' ]
  );

  grunt.registerTask(
    'release',
    'Creates a new release of the library in the dist folder',
    [ 'clean:dist', 'compile', 'concat' ]
  );

  grunt.registerTask(
    'default',
    'Watches the project for changes, automatically builds them and runs specs.',
    [ 'build', 'watch' ]
  );
};
