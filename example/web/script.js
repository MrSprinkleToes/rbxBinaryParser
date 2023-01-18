import { decode } from "/dist/rbxBinaryParser.js"; // ../../dist/client/rbxBinaryParser.js

const reader = new FileReader();
reader.addEventListener("load", (e) => {
	const file = e.target.result;
	console.log("Decoded:", decode(file));
});

document.getElementById("decode").addEventListener("click", () => {
	const file = document.getElementById("input").files[0];

	if (file) {
		// get file buffer
		reader.readAsArrayBuffer(file);
	}
});
