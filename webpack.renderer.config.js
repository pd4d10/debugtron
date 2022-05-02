// @ts-check

/** @type {import('webpack').Configuration} */
module.exports = {
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
}
