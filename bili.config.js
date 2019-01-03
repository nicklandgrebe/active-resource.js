var babel = require('rollup-plugin-babel');

module.exports = {
  input: 'build/active-resource.js',
  outDir: 'build',
  format: 'umd',
  global: {
    'axios': 'axios',
    'es6-promise': 'es6Promise',
    'qs': 'Qs',
    'underscore': '_',
    'underscore.string': 's',
    'underscore.inflection': null
  },
  name: 'active-resource',
  moduleName: 'ActiveResource',
  inline: false,
  filename: '[name].js',
  plugins: [
    babel({
      exclude: './node_modules/**'
    })
  ]
};
