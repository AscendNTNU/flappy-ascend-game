var path = require("path")
var webpack = require("webpack")

// Env vars from .env file loaded into process.env
var dotenv = require('dotenv')
dotenv.config()

module.exports = {
  entry: {
    host: './src/host.js',
    client: './src/client.js'
  },
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    publicPath: '/dist/',
    filename: '[name].bundle.js'
  },
  devtool: 'source-map',
  devServer: {
    inline: true,
    hot: true,
    // stats: 'errors-only',
    contentBase: './public',
    publicPath: '/dist/',
    filename: '[name].bundle.js'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        PORT: JSON.stringify(process.env.PORT || 8080),
        INTERVAL: JSON.stringify(process.env.INTERVAL || 1500)
      }
    }),
  ],
  module: {
    rules: [
      {
        test: /\.frag$|\.vert$/,
        use: 'raw-loader'
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader'
      }
    ]
  }
}
