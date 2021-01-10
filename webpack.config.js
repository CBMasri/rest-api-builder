const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

function generateConfig (name) {
  const compress = name.indexOf('min') > -1
  return {
    target: 'web',
    mode: compress ? 'production' : 'development',
    entry: {
      main: path.resolve(__dirname, 'index.js')
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
