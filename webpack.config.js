const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');

const babelLoader = {
	loader: 'babel-loader',
	options: {
		cacheDirectory: true,
		presets: [		
			"@babel/env"
		]
	}
};

const tsLoader = {
	loader: 'ts-loader'
}

const getConfig = (assetRoot, devAssets) => { return {
	entry: ["@babel/polyfill", path.resolve(__dirname, "src", "entry.ts")],  
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "widget.js",
		library: "widget",
		libraryTarget: "var",
	},
	resolve: {
		extensions: ['.js', '.ts', '.tsx', ".json", ".css"]
	},
	devServer: {
		contentBase: [path.resolve(__dirname, "dist"), devAssets ? devAssets : "Assets/"],
		port: 3000
	},
	devtool: 'source-map',	
	module: {
		rules: [
			{ 
				test: /.ts(x?)$/, 
				exclude: /node_modules/,
				use: [ babelLoader, tsLoader ]
			},
			{ test: /\.json$/, loader: 'json-loader' },
			{ test:/\.(s*)css$/, loader: [ 'style-loader', 'css-loader' ] },   
			{ test: /\.woff(\?.+)?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
			{ test: /\.woff2(\?.+)?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
			{ test: /\.ttf(\?.+)?$/, loader: 'file-loader' },
			{ test: /\.eot(\?.+)?$/, loader: 'file-loader' },
			{ test: /\.svg(\?.+)?$/, loader: 'file-loader' },
			{ test: /\.png$/, loader: 'url-loader?mimetype=image/png' },
			{ test: /\.gif$/, loader: 'url-loader?mimetype=image/gif' }
		]
	},
	plugins: [
		new DefinePlugin({
			__VERSION: JSON.stringify(process.env.npm_package_version),
			__ASSETROOT: JSON.stringify(assetRoot)
		}),
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "src", "index.html"),
			filename: 'index.html',
			showErrors: true,
			title: 'Opel Combo Viewer',
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
    return  getConfig("Assets/", argv["devAssets"]);
}