const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');

const getConfig = () => { return {
	entry: path.resolve(__dirname, "src", "entry_3d.ts"),
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "plocks.js",
		library: "plocks",
		libraryTarget: "var",
	},
	resolve: {
		extensions: ['.js', '.ts', '.tsx', ".json", ".css"]
	},
	devServer: {
		contentBase: path.resolve(__dirname, "dist"),
		port: 3000,
		proxy: {
			"/login": {target: "http://vc-studio-dev.herokuapp.com", secure: false, changeOrigin: true},
			"/asset/*": {target: "http://vc-studio-dev.herokuapp.com", secure: false, changeOrigin: true}
		}
	},
	devtool: 'source-map',	
	module: {
		rules: [
			{ 
				test: /.ts(x?)$/, 
				exclude: /node_modules/,
				use: "ts-loader"
			}
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "src", "index.html"),
			filename: 'index.html',
			showErrors: true,
			title: 'plocks',
			path: path.resolve(__dirname, "dist"),
			hash: true
		}),
		new BundleAnalyzerPlugin({
			//analyzerMode: 'disabled',
			analyzerMode: 'static',
			openAnalyzer: false
		})
	]
}
}

module.exports = (env, argv) => {
    return  getConfig();
}