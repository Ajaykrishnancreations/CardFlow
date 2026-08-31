const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/'
  },
  resolve: {
    alias: {
      'react-native$': 'react-native-web'
    },
    extensions: ['.web.js', '.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules[\\/](?!(react-native-web|lucide-react)[\\/])/,
        use: {
          loader: 'babel-loader',
          options: {
            configFile: path.resolve(__dirname, 'babel.config.js')
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
      title: 'CardFlow — Business Discovery & Digital Card Vault'
    })
  ],
  watchOptions: {
    ignored: /node_modules/,
    poll: 1000
  },
  devServer: {
    host: '127.0.0.1',
    port: 3000,
    historyApiFallback: true,
    hot: true,
    open: false,
    static: {
      directory: path.resolve(__dirname, 'public'),
      watch: false
    },
    client: {
      logging: 'warn',
      overlay: {
        errors: true,
        warnings: false
      }
    }
  }
};
