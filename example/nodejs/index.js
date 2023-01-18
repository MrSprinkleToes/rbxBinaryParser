const fs = require("fs");
const { decode } = require("../../dist/server/rbxBinaryParser");

const file = fs.readFileSync(__dirname + "/../test.rbxm");
const decoded = decode(file.buffer);

console.log("Decoded:", decoded);
