const { DefinePlugin } = require('webpack')

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.js',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  plugins: [
    new DefinePlugin({
      DEBUGTRON_GITHUB_TOKEN: JSON.stringify(
        process.env.DEBUGTRON_GITHUB_TOKEN,
      ),
    }),
  ],
  externals: [
    function(context, request, callback) {
      if (request === '../../build/Release/registry.node') {
        return callback(
          null,
          'commonjs ./native_modules/build/Release/registry.node',
        )
      }
      callback()
    },
  ],
}
