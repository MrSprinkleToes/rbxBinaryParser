const fs = require("fs");
const { decode } = require("./rbxBinaryParser");

const file = fs.readFileSync(__dirname + "/../test.rbxm");
const decoded = decode(file.buffer);

console.log("Decoded:", decoded);
