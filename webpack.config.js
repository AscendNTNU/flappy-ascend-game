var path = require("path")

module.exports = {
    entry: {
        host: './src/host.js',
        client: './src/client.js'
    },
    output: {
        path: path.resolve(__dirname, 'public/dist'),
        publicPath: '/dist/',
        filename: '[name].bundle.js'
    },
    devtool: 'source-map',
    devServer: {
        inline: true,
        hot: true,
        // stats: 'errors-only',
        contentBase: './public',
        publicPath: '/dist/',
        filename: '[name].bundle.js'
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
