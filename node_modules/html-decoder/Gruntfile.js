/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['src/*.js'],
      options: {
        scripturl: true,
        camelcase: true
      }
    },
    browserify: {
      standalone: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.js',
        options: {
          browserifyOptions: {
            standalone: 'HTMLDecoder'
          }
        }
      },
    },
    wget: {
      htmlentities: {
        files: {
          'data/entities.json': 'https://html.spec.whatwg.org/multipage/entities.json'
        }
      }
    },
    execute: {
      buildtrie: {
        options: {
          args: ['data/entities.json']
        },
        src: ['bin/genhtmlentities']
      }
    },
    mocha_istanbul: {
      target: {
        src: 'tests/unit',
        options: {
          coverage:true,
          check: {
            lines: 80,
            statements: 80
          }
        }
      }
    },
    clean: {
      all: ['xunit.xml', 'artifacts', 'coverage', 'node_modules'],
      buildResidues: ['xunit.xml', 'artifacts', 'coverage']
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-wget');

  grunt.registerTask('test', ['clean:buildResidues', 'jshint', 'dist', 'mocha_istanbul']);
  grunt.registerTask('dist', ['browserify']);
  grunt.registerTask('gen',  ['wget:htmlentities', 'execute:buildtrie']);
  grunt.registerTask('default', ['test']);

};
