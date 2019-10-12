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
}
