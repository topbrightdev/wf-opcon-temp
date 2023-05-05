const path = require('path');
const root = './frontend';
const dest = path.join(__dirname, './public/dashboard');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const DotenvPlugin = require('dotenv-webpack');
const DefinePlugin = require('webpack').DefinePlugin;

require('dotenv').config({
    path: './.env',
});

module.exports = {
    entry: ['@babel/polyfill', `${root}/src/index.js`],
    devtool: process.env.NODE_ENV === "development" ? 'source-map' : false,
    output: {
        path: `${dest}/js`,
        filename: 'app.js'
    },
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin([dest]),
        new CopyWebpackPlugin([
            { from: `${root}/index.html`, to: `${dest}/index.html` },
            { from: `${root}/config.json`, to: `${dest}/config.json` },
            { from: `${root}/favicon.ico`, to: `${dest}/favicon.ico` },
            { from: `${root}/css`, to: `${dest}/css` },
            { from: `${root}/lib`, to: `${dest}/lib` },
            { from: `${root}/assets`, to: `${dest}/assets` },
        ]),
        new DotenvPlugin({
            path: './.env.frontend',
            defaults: './.env.frontend.defaults',
        }),
        new DefinePlugin({
            "VERSION": JSON.stringify(process.env.npm_package_version),
        }),
    ]
};
