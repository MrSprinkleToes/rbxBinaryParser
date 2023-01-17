module.exports = {
	entry: "./src/index.js",
	experiments: {
		outputModule: true,
	},
	output: {
		path: __dirname + "/dist/client",
		filename: "rbxBinaryParser.js",
		library: {
			type: "module",
		},
	},
	mode: "production",
};
