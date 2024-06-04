const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const { EnvironmentPlugin, } = require('webpack');
module.exports = {
  mode: 'production',
  resolve: {
    fallback: {
      "timers": require.resolve("timers-browserify")
    }
  },
  plugins: [
    new NodePolyfillPlugin(),
    new EnvironmentPlugin({
      NODE_ENV: 'production', // use 'development' unless process.env.NODE_ENV is defined
      DEBUG: false,
    })
  ],
  optimization: {
    nodeEnv: 'production',
  },
  performance: {
    hints: false,
  }
}
