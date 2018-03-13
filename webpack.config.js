const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';
const extractCSS = new ExtractTextPlugin('app.css');

module.exports = {
  mode: env,

  entry: './src/js/app.js',

  output: {
    filename: 'app.js',
    path: path.resolve('./static/assets')
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader?cacheDirectory'
      },
      {
        test: /\.css$/,
        use: extractCSS.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: isProd,
                importLoaders: 1
              }
            },
            'postcss-loader'
          ]
        })
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(['./static/assets/*.*']),
    extractCSS
  ]
};
