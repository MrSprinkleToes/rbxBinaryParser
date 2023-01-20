/**
 * This script is used for testing rbxBinaryParser.
 *
 * To run a test, use the following command:
 * node src/testing.js <testName> <testFile>
 */

const fs = require("fs");
const { decode } = require("../dist/server/rbxBinaryParser");

const testName = process.argv[2];
const testFile = process.argv[3];

function floatingPointEquals(a, b) {
	return Math.abs(a - b) < 0.0001;
}

fs.readFile(__dirname + testFile, (err, data) => {
	const decoded = decode(data.buffer);
	var passed = 0;
	var total = 0;

	switch (testName) {
		// case "CFrameComponents":
		// 	const testData = [
		// 		-5, 1.7677860260009766, 22, 0.7071067690849304, -0.7071067690849304, 0,
		// 		0.7071067690849304, 0.7071067690849304, 0, 0, 0, 1,
		// 	];
		// 	console.log("test data:", testData);
		// 	console.log("decoded data:", decoded[0].CFrame.Orientation);
		// 	break;
		case "Double":
			total = 1;
			if (decoded[0].Value == 123.45) passed++;
			break;
		case "UDim":
			total = 2;
			if (floatingPointEquals(decoded[0].Padding.Scale, 0.1)) passed++;
			if (decoded[0].Padding.Offset == 234) passed++;
			break;
	}

	console.log("Passed", passed, "out of", total, "tests.");
});
