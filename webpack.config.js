var path = require('path')
var webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: {
    'vue-multianalytics': './src/index.js',
    'vue-multianalytics.min': './src/index.js'
  },
  output: {
    path: __dirname + "/dist",
    filename: "[name].js",
    libraryTarget: 'commonjs2'
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        uglifyOptions: {
          compress: false,
          ecma: 6,
          mangle: true
        },
        sourceMap: true
      }),
    ],
  },
  resolve: {
    extensions: [ '*', '.js', '.json' ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: [ 'env', 'stage-2' ],
          plugins: [
            "transform-async-to-generator",
            "transform-object-assign",
          ],
        },
        exclude: /node_modules/
      }
    ]
  }
}
