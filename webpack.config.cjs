const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

/**
 * Note:
 *
 * .cjs extention must be used for this file in order for
 * webpack-cli to parse it properly. This is necessary because
 * package.json defines the code to be ESM via the `type` param,
 * but webpack-cli doesn't support ESM yet, even though webpack
 * core does.
 *
 * More info:
 * https://github.com/webpack/webpack-cli/issues/1622#issuecomment-677740453
 **/

function generateConfig(name) {
  const compress = name.indexOf('min') > -1
  return {
    target: 'web',
    mode: compress ? 'production' : 'development',
    entry: {
      main: path.resolve(__dirname, 'src/builder.js')
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: `${name}.js`,
      sourceMapFilename: `${name}.map`,
      library: 'rest-api-builder',
      libraryTarget: 'umd',
      globalObject: 'this',
      umdNamedDefine: true
    },
    devtool: 'source-map',
    plugins: [
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [] // disable initial clean
      })
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [ 'babel-loader' ]
        }
      ]
    }
  }
}

module.exports = async (env, argv) => {
  return ['rest-api-builder', 'rest-api-builder.min'].map(name => generateConfig(name))
}
