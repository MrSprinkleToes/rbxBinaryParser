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
		case "UDim2":
			total = 8;
			if (floatingPointEquals(decoded[0].Position.X.Scale, 1)) passed++;
			if (decoded[0].Position.X.Offset == 23) passed++;
			if (floatingPointEquals(decoded[0].Position.Y.Scale, 4)) passed++;
			if (decoded[0].Position.Y.Offset == 56) passed++;

			if (floatingPointEquals(decoded[0].Size.X.Scale, 7)) passed++;
			if (decoded[0].Size.X.Offset == 89) passed++;
			if (floatingPointEquals(decoded[0].Size.Y.Scale, 0)) passed++;
			if (decoded[0].Size.Y.Offset == 12) passed++;
			break;
		case "Ray":
			total = 6;
			if (floatingPointEquals(decoded[0].Value.Origin.X, 1)) passed++;
			if (floatingPointEquals(decoded[0].Value.Origin.Y, 2)) passed++;
			if (floatingPointEquals(decoded[0].Value.Origin.Z, 3)) passed++;

			if (floatingPointEquals(decoded[0].Value.Direction.X, 4)) passed++;
			if (floatingPointEquals(decoded[0].Value.Direction.Y, 5)) passed++;
			if (floatingPointEquals(decoded[0].Value.Direction.Z, 6)) passed++;
			break;
		case "Faces":
			total = 1;
			if (
				decoded[0].Faces.Back == true &&
				decoded[0].Faces.Bottom == true &&
				decoded[0].Faces.Front == false &&
				decoded[0].Faces.Left == false &&
				decoded[0].Faces.Right == true &&
				decoded[0].Faces.Top == true
			)
				passed++;
			break;
		case "Axes":
			total = 1;
			if (
				decoded[0].Axes.X == true &&
				decoded[0].Axes.Y == true &&
				decoded[0].Axes.Z == true
			)
				passed++;
			break;
		case "BrickColor":
			total = 1;
			if (decoded[0].BrickColor == "Lime green") passed++;
			break;
		case "Vector2":
			total = 2;
			if (floatingPointEquals(decoded[0].AnchorPoint.X, 0.5)) passed++;
			if (floatingPointEquals(decoded[0].AnchorPoint.Y, 1)) passed++;
			break;
	}

	console.log("Passed", passed, "out of", total, "tests.");
});
