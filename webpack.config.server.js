module.exports = {
	entry: "./src/index.js",
	experiments: {
		outputModule: true,
	},
	output: {
		path: __dirname + "/dist/server",
		filename: "rbxBinaryParser.js",
		library: {
			type: "commonjs2",
		},
	},
	mode: "production",
};
