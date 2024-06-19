const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  mode: 'production',
  plugins: [
    new NodePolyfillPlugin()
  ],
  performance: {
    hints: false,
  }
};
