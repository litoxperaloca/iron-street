const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const { DefinePlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/main.ts', // Asegúrate de que esta ruta sea correcta
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      "timers": require.resolve("timers-browserify")
    }
  },
  plugins: [
    new NodePolyfillPlugin(),
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'), // Define la variable de entorno
      'process.env.DEBUG': JSON.stringify('false'),
    })
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
    splitChunks: {
      chunks: 'all',
    },
    nodeEnv: 'production',
  },
  performance: {
    hints: false,
  }
};
