// @ts-check
const { DefinePlugin } = require('webpack')

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: './src/main.js',
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  plugins: [
    new DefinePlugin({
      DEBUGTRON_GITHUB_TOKEN: JSON.stringify(
        process.env.DEBUGTRON_GITHUB_TOKEN
      ),
    }),
  ],
  externals: ['devtron', 'simple-plist'],
}
