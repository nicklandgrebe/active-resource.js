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
          'build/**/*.js', '!build/init.js',
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
    umd: {
      build: {
        options: {
          src: 'build/active-resource.js',
          objectToExport: 'ActiveResource',
          deps: {
            'default': [
              'axios',
              { 'es6-promise': 'es6Promise' },
              { 'underscore': '_' },
              { 'underscore.string': 's' },
              { 'qs': 'Qs' },
              { 'underscore.inflection': null }
            ]
          }
        }
      },
      specs: {
        options: {
          src: 'spec/spec.js',
          deps: {
            'default': [
              { 'active-resource': 'ActiveResource' },
              'axios',
              'moxios',
              { 'jquery': '$' },
              { 'jasmine-jquery': null },
              { 'jasmine-ajax': null },
              { 'jasmine-promises': null }
            ]
          }
        }
      }
    },
    uglify: {
      build: {
        options: {
          mangle: false,
          sourceMap: true,
        },
        files: {
          'build/active-resource.min.js': 'build/active-resource.js'
        }
      }
    },
    concat: {
      release: {
        options: {
          banner:
          '/*\n' +
          '\tactive-resource <%= pkg.version %>\n' +
          '\t(c) <%= grunt.template.today("yyyy") %> Nick Landgrebe && Peak Labs, LLC DBA Occasion App\n' +
          '\tactive-resource may be freely distributed under the MIT license\n' +
          '\tPortions of active-resource were inspired by or borrowed from Rail\'s ActiveRecord library\n' +
          '*/\n\n'
        },
        files: {
          'dist/active-resource.js': ['build/active-resource.js'],
          'dist/active-resource.min.js': ['build/active-resource.min.js'],
          'dist/active-resource.min.js.map': ['build/active-resource.min.js.map']
        }
      },
      build: {
        src: [
          'build/init.js',
          'build/modulizing.js',
          'build/typing.js',
          'build/resource_library.js',
          'build/interfaces/base.js',
          'build/interfaces/json_api.js',
          'build/associations.js',
          'build/attributes.js',
          'build/callbacks.js',
          'build/collection.js',
          'build/collection_response.js',
          'build/errors.js',
          'build/fields.js',
          'build/links.js',
          'build/persistence.js',
          'build/query_params.js',
          'build/reflection.js',
          'build/relation.js',
          'build/base.js',
          'build/associations/association.js',
          'build/associations/collection_association.js',
          'build/associations/collection_proxy.js',
          'build/associations/has_many_association.js',
          'build/associations/singular_association.js',
          'build/associations/has_one_association.js',
          'build/associations/belongs_to_association.js',
          'build/associations/belongs_to_polymorphic_association.js',
          'build/associations/builder/association.js',
          'build/associations/builder/collection_association.js',
          'build/associations/builder/has_many.js',
          'build/associations/builder/singular_association.js',
          'build/associations/builder/belongs_to.js',
          'build/associations/builder/has_one.js'
        ],
        dest: 'build/active-resource.js'
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
                "axios": '/node_modules/axios/dist/axios',
                "moxios": '/node_modules/moxios/dist/moxios.min',
                "es6-promise": '/node_modules/es6-promise/dist/es6-promise',
                "qs": '/node_modules/qs/dist/qs',
                "underscore": '/node_modules/underscore/underscore-min',
                "underscore.string": '/node_modules/underscore.string/dist/underscore.string',
                "underscore.inflection": '/node_modules/underscore.inflection/lib/underscore.inflection',
                "active-resource": '/build/active-resource',
                "jquery": '/node_modules/jquery/dist/jquery.min',
                "jasmine-jquery": '/node_modules/jasmine-jquery/lib/jasmine-jquery',
                "jasmine-ajax": '/node_modules/jasmine-ajax/lib/mock-ajax',
                "jasmine-promises": '/node_modules/jasmine-promises/dist/jasmine-promises',
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
  grunt.loadNpmTasks('grunt-umd');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  // define the tasks
  grunt.registerTask(
    'compile',
    'Compiles the source files into 1) a raw UMD module file and 2) a minified UMD module file.',
    [ 'coffee:build', 'concat:build', 'umd:build', 'uglify', 'clean:build' ]
  );

  grunt.registerTask(
    'spec',
    'Compiles and runs the Javascript spec files for ActiveResource.js source code.',
    [ 'clean:specs', 'coffee:specs', 'umd:specs', 'connect:test', 'jasmine:activeresource' ]
  )

  grunt.registerTask(
    'build',
    'Creates a temporary build of the library in the build folder, then runs the specs on it.',
    [ 'clean:build', 'compile', 'spec' ]
  );

  grunt.registerTask(
    'release',
    'Creates a new release of the library in the dist folder',
    [ 'clean:dist', 'compile', 'concat:release' ]
  );

  grunt.registerTask(
    'default',
    'Watches the project for changes, automatically builds them and runs specs.',
    [ 'build', 'watch' ]
  );
};
