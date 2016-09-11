module.exports = function(grunt) {

  // configure the tasks
  grunt.initConfig({

    clean: {
      build: {
        src: [ 'build' ]
      },
      scripts: {
        src: [ 'build/**/*.js', '!build/activeresource.min.js' ]
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
          'spec/spec.js': [ 'spec/support/*.coffee', 'spec/support/**/*.coffee', 'spec/**/*.coffee' ]
        }
      }
    },
    uglify: {
      build: {
        options: {
          mangle: false
        },
        files: {
          'build/activeresource.min.js': [
            'build/root.js',
            'build/config.js',
            'build/typing.js',
            'build/collection.js',
            'build/attributes.js',
            'build/errors.js',
            'build/persistence.js',
            'build/reflection.js',
            'build/relation.js',
            'build/interfaces/base.js',
            'build/interfaces/json_api.js',
            'build/associations.js',
            'build/associations/association.js',
            'build/associations/collection_proxy.js',
            'build/associations/collection_association.js',
            'build/associations/has_many_association.js',
            'build/associations/singular_association.js',
            'build/associations/has_one_association.js',
            'build/associations/belongs_to_association.js',
            'build/associations/belongs_to_polymorphic_association.js',
            'build/associations/builder/association.js',
            'build/associations/builder/collection_association.js',
            'build/associations/builder/has_many.js',
            'build/associations/builder/singular_association.js',
            'build/associations/builder/has_one.js',
            'build/associations/builder/belongs_to.js',
            'build/base.js'
          ]
        }
      }
    },
    watch: {
      scripts: {
        files: 'src/**/*.js.coffee',
        tasks: [ 'compile' ]
      }
    },
    connect: {
      server: {
        options: {
          port: 4000,
          base: 'build',
          hostname: '*'
        }
      }
    },
    jasmine: {
      pivotal: {
        src: [
          'lib/jquery.min.js',
          'lib/underscore.min.js',
          'lib/underscore.string.js',
          'lib/underscore.inflection.js',
          'node_modules/jasmine-ajax/lib/mock-ajax.js',
          'build/activeresource.min.js'
        ],
        options: {
          specs: 'spec/spec.js'
        }
      }
    }

  });

  // load the tasks
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  // define the tasks
  grunt.registerTask(
    'compile',
    'Compiles the JavaScript files.',
    [ 'coffee', 'uglify', 'clean:scripts' ]
  );

  grunt.registerTask(
    'build',
    'Compiles all of the assets and copies the files to the build directory, then runs specs on the build.',
    [ 'clean:build', 'clean:specs', 'compile', 'jasmine' ]
  );

  grunt.registerTask(
    'default',
    'Watches the project for changes, automatically builds them and runs a server.',
    [ 'build', 'connect', 'watch' ]
  );
};
