var path = require("path")

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'public'),
        publicPath: '/dist/',
        filename: 'bundle.js'
    },
    devtool: 'source-map',
    devServer: {
        inline: true,
        hot: true,
        // stats: 'errors-only',
        contentBase: './public',
        publicPath: '/dist/',
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.frag$|\.vert$/,
                use: 'raw-loader'
            },
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: 'source-map-loader'
            }
        ]
    }
}
