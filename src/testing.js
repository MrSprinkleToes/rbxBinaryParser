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

fs.readFile(__dirname + testFile, (err, data) => {
	const decoded = decode(data.buffer);

	switch (testName) {
		case "CFrameComponents":
			const testData = [
				-5, 1.7677860260009766, 22, 0.7071067690849304, -0.7071067690849304, 0,
				0.7071067690849304, 0.7071067690849304, 0, 0, 0, 1,
			];
			console.log("test data:", testData);
			console.log("decoded data:", decoded[0].CFrame.Orientation);
			break;
	}
});
