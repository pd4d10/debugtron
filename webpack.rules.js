// @ts-check

/** @type {import('webpack').RuleSetRule[]} */
module.exports = [
  // https://www.electronforge.io/config/plugins/webpack#native-modules
  {
    // We're specifying native_modules in the test because the asset
    // relocator loader generates a "fake" .node file which is really
    // a cjs file.
    test: /native_modules\/.+\.node$/,
    use: 'node-loader',
  },
  {
    test: /\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },

  {
    test: /\.tsx?$/,
    exclude: /(node_modules|.webpack)/,
    use: [
      {
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  {
    test: /\.css$/,
    use: ['style-loader', 'css-loader'],
  },
  {
    test: /\.png$/,
    use: ['url-loader'],
  },
]
