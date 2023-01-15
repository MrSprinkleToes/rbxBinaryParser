/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 147:
/***/ ((module) => {

module.exports = require("fs");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nccwpck_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
// ESM COMPAT FLAG
__nccwpck_require__.r(__webpack_exports__);

// EXPORTS
__nccwpck_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ decode)
});

;// CONCATENATED MODULE: ./src/binaryTypeReader.js
// String:
// Length: uint32 - Length of the string
// Bytes: []uint8 - The string

// References: []zint32b~4
// Difference-encoded array of zigzag-encoded interleaved integers
// Before encoding to bytes, values in the References array are difference-encoded
// such that the current value is added to the previous value to get the actual value.

const valueTypes = {
	0x01: "String",
	0x02: "Bool",
	0x03: "Int",
	0x04: "Float",
	0x05: "Double",
	0x06: "Udim",
	0x07: "Udim2",
	0x08: "Ray",
	0x09: "Faces",
	0x0a: "Axes",
	0x0b: "BrickColor",
	0x0c: "Color3",
	0x0d: "Vector2",
	0x0e: "Vector3",
	0x0f: "Vector2int16",
	0x10: "CFrame",
	0x11: "CFrameQuat",
	0x12: "Token",
	0x13: "Reference",
	0x14: "Vector3int16",
	0x15: "NumberSequence",
	0x16: "ColorSequence",
	0x17: "NumberRange",
	0x18: "Rect",
	0x19: "PhysicalProperties",
	0x1a: "Color3uint8",
	0x1b: "Int64",
	0x1c: "SharedString",
	0x1d: null,
	0x1e: "Optional",
	0x1f: "UniqueId",
	0x20: "Font",
};

function interleaveUint32(data, offset, itemCount, callbackFn) {
	const results = new Array(itemCount);
	const byteTotal = itemCount * 4;

	for (let i = 0; i < itemCount; i++) {
		let val = data.getUint8(offset + i) << 24;
		val += data.getUint8(offset + ((i + itemCount) % byteTotal)) << 16;
		val += data.getUint8(offset + ((i + itemCount * 2) % byteTotal)) << 8;
		val += data.getUint8(offset + ((i + itemCount * 3) % byteTotal));

		if (callbackFn) {
			results[i] = callbackFn(val);
		} else {
			results[i] = val;
		}
	}

	return results;
}

function interleaveInt32(data, offset, itemCount) {
	return interleaveUint32(data, offset, itemCount, (val) =>
		val % 2 === 1 ? -(val + 1) / 2 : val / 2
	);
}

function ReadString(data, offset) {
	var length = data.getUint32(offset, true);
	var str = "";

	for (let i = 0; i < length; i++) {
		str += String.fromCharCode(data.getUint8(offset + 4 + i));
	}

	return [str, length];
}

function ReadReferences(data, offset, length) {
	const d = [];
	for (let i = 0; i < length; i++) {
		d.push(data.getUint8(offset + i));
	}
	const refs = interleaveInt32(data, offset, length);

	return refs;
}

function ReadPropertyValue(data, offset) {
	const typeId = data.getUint8(offset);
	const type = valueTypes[typeId];

	return {
		type,
	};
}



;// CONCATENATED MODULE: ./src/lz4.js
/*******************************************************************************

    lz4-block-codec-js.js
        A javascript wrapper around a pure javascript implementation of
        LZ4 block format codec.
    Copyright (C) 2018 Raymond Hill

    BSD-2-Clause License (http://www.opensource.org/licenses/bsd-license.php)

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are
    met:

    1. Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.

    2. Redistributions in binary form must reproduce the above
    copyright notice, this list of conditions and the following disclaimer
    in the documentation and/or other materials provided with the
    distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
    "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
    LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
    A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
    OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
    LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

    Home: https://github.com/gorhill/lz4-wasm

    I used the same license as the one picked by creator of LZ4 out of respect
    for his creation, see https://lz4.github.io/lz4/

*/



/******************************************************************************/

// (function (context) {
// >>>> Start of private namespace

/******************************************************************************/

let growOutputBuffer = function (instance, size) {
	if (
		instance.outputBuffer === undefined ||
		instance.outputBuffer.byteLength < size
	) {
		instance.outputBuffer = new ArrayBuffer((size + 0xffff) & 0x7fff0000);
	}
	return instance.outputBuffer;
};

let encodeBound = function (size) {
	return size > 0x7e000000 ? 0 : size + ((size / 255) | 0) + 16;
};

let encodeBlock = function (instance, iBuf, oOffset) {
	let iLen = iBuf.byteLength;
	if (iLen >= 0x7e000000) {
		throw new RangeError();
	}

	// "The last match must start at least 12 bytes before end of block"
	let lastMatchPos = iLen - 12;

	// "The last 5 bytes are always literals"
	let lastLiteralPos = iLen - 5;

	if (instance.hashTable === undefined) {
		instance.hashTable = new Int32Array(65536);
	}
	instance.hashTable.fill(-65536);

	if (iBuf instanceof ArrayBuffer) {
		iBuf = new Uint8Array(iBuf);
	}

	let oLen = oOffset + encodeBound(iLen);
	let oBuf = new Uint8Array(growOutputBuffer(instance, oLen), 0, oLen);
	let iPos = 0;
	let oPos = oOffset;
	let anchorPos = 0;

	// sequence-finding loop
	for (;;) {
		let refPos;
		let mOffset;
		let sequence =
			(iBuf[iPos] << 8) | (iBuf[iPos + 1] << 16) | (iBuf[iPos + 2] << 24);

		// match-finding loop
		while (iPos <= lastMatchPos) {
			sequence = (sequence >>> 8) | (iBuf[iPos + 3] << 24);
			let hash =
				(((sequence * 0x9e37) & 0xffff) + ((sequence * 0x79b1) >>> 16)) &
				0xffff;
			refPos = instance.hashTable[hash];
			instance.hashTable[hash] = iPos;
			mOffset = iPos - refPos;
			if (
				mOffset < 65536 &&
				iBuf[refPos + 0] === (sequence & 0xff) &&
				iBuf[refPos + 1] === ((sequence >>> 8) & 0xff) &&
				iBuf[refPos + 2] === ((sequence >>> 16) & 0xff) &&
				iBuf[refPos + 3] === ((sequence >>> 24) & 0xff)
			) {
				break;
			}
			iPos += 1;
		}

		// no match found
		if (iPos > lastMatchPos) {
			break;
		}

		// match found
		let lLen = iPos - anchorPos;
		let mLen = iPos;
		iPos += 4;
		refPos += 4;
		while (iPos < lastLiteralPos && iBuf[iPos] === iBuf[refPos]) {
			iPos += 1;
			refPos += 1;
		}
		mLen = iPos - mLen;
		let token = mLen < 19 ? mLen - 4 : 15;

		// write token, length of literals if needed
		if (lLen >= 15) {
			oBuf[oPos++] = 0xf0 | token;
			let l = lLen - 15;
			while (l >= 255) {
				oBuf[oPos++] = 255;
				l -= 255;
			}
			oBuf[oPos++] = l;
		} else {
			oBuf[oPos++] = (lLen << 4) | token;
		}

		// write literals
		while (lLen--) {
			oBuf[oPos++] = iBuf[anchorPos++];
		}

		if (mLen === 0) {
			break;
		}

		// write offset of match
		oBuf[oPos + 0] = mOffset;
		oBuf[oPos + 1] = mOffset >>> 8;
		oPos += 2;

		// write length of match if needed
		if (mLen >= 19) {
			let l = mLen - 19;
			while (l >= 255) {
				oBuf[oPos++] = 255;
				l -= 255;
			}
			oBuf[oPos++] = l;
		}

		anchorPos = iPos;
	}

	// last sequence is literals only
	let lLen = iLen - anchorPos;
	if (lLen >= 15) {
		oBuf[oPos++] = 0xf0;
		let l = lLen - 15;
		while (l >= 255) {
			oBuf[oPos++] = 255;
			l -= 255;
		}
		oBuf[oPos++] = l;
	} else {
		oBuf[oPos++] = lLen << 4;
	}
	while (lLen--) {
		oBuf[oPos++] = iBuf[anchorPos++];
	}

	return new Uint8Array(oBuf.buffer, 0, oPos);
};

let decodeBlock = function (instance, iBuf, iOffset, oLen) {
	let iLen = iBuf.byteLength;
	let oBuf = new Uint8Array(growOutputBuffer(instance, oLen), 0, oLen);
	let iPos = iOffset,
		oPos = 0;

	while (iPos < iLen) {
		let token = iBuf[iPos++];

		// literals
		let clen = token >>> 4;

		// length of literals
		if (clen !== 0) {
			if (clen === 15) {
				let l;
				for (;;) {
					l = iBuf[iPos++];
					if (l !== 255) {
						break;
					}
					clen += 255;
				}
				clen += l;
			}

			// copy literals
			let end = iPos + clen;
			while (iPos < end) {
				oBuf[oPos++] = iBuf[iPos++];
			}
			if (iPos === iLen) {
				break;
			}
		}

		// match
		let mOffset = iBuf[iPos + 0] | (iBuf[iPos + 1] << 8);
		if (mOffset === 0 || mOffset > oPos) {
			return;
		}
		iPos += 2;

		// length of match
		clen = (token & 0x0f) + 4;
		if (clen === 19) {
			let l;
			for (;;) {
				l = iBuf[iPos++];
				if (l !== 255) {
					break;
				}
				clen += 255;
			}
			clen += l;
		}

		// copy match
		let mPos = oPos - mOffset;
		let end = oPos + clen;
		while (oPos < end) {
			oBuf[oPos++] = oBuf[mPos++];
		}
	}

	return oBuf;
};

/******************************************************************************/

function LZ4BlockJS() {
	this.hashTable = undefined;
	this.outputBuffer = undefined;
}

LZ4BlockJS.prototype = {
	flavor: "js",
	init: function () {
		return Promise.resolve();
	},

	reset: function () {
		this.hashTable = undefined;
		this.outputBuffer = undefined;
	},

	bytesInUse: function () {
		let bytesInUse = 0;
		if (this.hashTable !== undefined) {
			bytesInUse += this.hashTable.byteLength;
		}
		if (this.outputBuffer !== undefined) {
			bytesInUse += this.outputBuffer.byteLength;
		}
		return bytesInUse;
	},

	encodeBlock: function (input, outputOffset) {
		if (input instanceof ArrayBuffer) {
			input = new Uint8Array(input);
		} else if (input instanceof Uint8Array === false) {
			throw new TypeError();
		}
		return encodeBlock(this, input, outputOffset);
	},

	decodeBlock: function (input, inputOffset, outputSize) {
		if (input instanceof ArrayBuffer) {
			input = new Uint8Array(input);
		} else if (input instanceof Uint8Array === false) {
			throw new TypeError();
		}
		return decodeBlock(this, input, inputOffset, outputSize);
	},
};

/******************************************************************************/
// })(this || self); // <<<< End of private namespace

/******************************************************************************/

;// CONCATENATED MODULE: ./src/ChunkReader.js
// Chunk:
// Signature: [4]uint8 - Type of chunk and structure of data
// CompressedLength: uint32 - Length of the data
// UncompressedLength: uint32 - Length of the data after decompression
// Reserved: [4]uint8 - Reserved for future use
// Data: []uint8 - The data
// Chunks are compressed using LZ4
// If the chunk is not compressed, CompressedLength == 0 and UncompressedLength == the length of the data

// var lz4 = require("lz4js");


/**
 * Reads a chunk of data
 * @param {DataView} chunk
 */
function ReadChunk(data, offset) {
	const signature = [
		String.fromCharCode(data.getUint8(offset + 0)),
		String.fromCharCode(data.getUint8(offset + 1)),
		String.fromCharCode(data.getUint8(offset + 2)),
		String.fromCharCode(data.getUint8(offset + 3)),
	].join("");

	const compressedLength = data.getUint32(offset + 4, true);
	const uncompressedLength = data.getUint32(offset + 8, true);
	const dataLength =
		compressedLength == 0 ? uncompressedLength : compressedLength;

	// might be incorrectly copying the chunk payload?
	const chunkData = new Uint8Array(dataLength);
	for (var i = 0; i < dataLength; i++) {
		chunkData[i] = data.getUint8(offset + 16 + i);
	}

	var payload;
	// Decompress the data if it is compressed
	if (compressedLength != 0) {
		payload = LZ4BlockJS.prototype.decodeBlock(
			chunkData,
			0,
			uncompressedLength
		);
	} else {
		payload = chunkData;
	}

	return {
		signature,
		compressedLength,
		uncompressedLength,
		dataLength,
		payload,
	};
}

;// CONCATENATED MODULE: ./src/util.js
/**
 * Checks if two arrays are equal
 * @param {Array} a
 * @param {Array} b
 * @returns
 */
function arraysEqual(a, b) {
	if (a.length == b.length) {
		a.forEach((v, i) => {
			if (v != b[i]) return false;
		});
		return true;
	}
	return false;
}

;// CONCATENATED MODULE: ./src/index.js




const fs = __nccwpck_require__(147);

// Decoding roblox binary files
// Starts with a signature of type [14]uint8
// Then a version of type uint16
// Then the content

// Header:
// ClassCount: uint32 - The number of unique classes in the file
// InstanceCount: uint32 - The number of instances in the file
// Reserved: [8]uint8 - Reserved for future use

// Chunk:
// Signature: [4]uint8 - Type of chunk and structure of data
// CompressedLength: uint32 - Length of the data
// UncompressedLength: uint32 - Length of the data after decompression
// Reserved: [4]uint8 - Reserved for future use
// Data: []uint8 - The data
// Chunks are compressed using LZ4
// If the chunk is not compressed, CompressedLength == 0 and UncompressedLength == the length of the data

// Chunks:
// META:
// Length: uint32 - The amount of entries
// Entries: []Entry
// Entry:
// Key: string - The key of the entry
// Value: string - The value of the entry

// SSTR:
// Version: int32 - The version of the chunk
// Length: uint32 - The amount of strings
// Strings: []SharedStringValue - The strings
// SharedStringValue:
// Hash: [16]uint8 - The hash of the string
// Value: string - The value of the string

// INST:
// ClassID: int32 - The class ID of the instance
// ClassName: string - The name of the class
// HasService: bool - Whether the chunk has service data
// Length: uint32 - The amount of instances
// IDs: References - The instances
// IsService: ?[]bool - Whether the instance is a service

const signature = [
	0x3c, 0x72, 0x6f, 0x62, 0x6c, 0x6f, 0x78, 0x21, 0x89, 0xff, 0x0d, 0x0a, 0x1a,
	0x0a,
];
const signatureLength = 14;

function decode(buffer) {
	const data = new DataView(buffer.buffer);

	// Get the position of the signature (might not be 0)
	var sigPos = 0;
	for (var i = 0; i < buffer.length; i++) {
		if (data.getUint8(i) == signature[0]) {
			sigPos = i;
			break;
		}
	}

	// Get the signature
	var sig = [];
	for (var i = 0; i < signatureLength; i++) {
		sig.push(data.getUint8(i + sigPos));
	}

	console.assert(arraysEqual(sig, signature), "Invalid file signature.");
	console.log("Valid file signature.");

	// Get the version
	var versionPos = sigPos + signatureLength;
	var version = data.getUint16(versionPos, true);
	console.log("Version:", version);

	var headerPos = versionPos + 2;
	var header = {
		classCount: data.getUint32(headerPos, true),
		instanceCount: data.getUint32(headerPos + 4, true),
	};
	console.log("Header:", header);

	// for each chunk get the signature, compressed length, uncompressed length, and data using ReadChunk(chunk: ArrayBuffer)
	var chunkPos = headerPos + 16;
	var chunk = {};
	while (chunkPos < buffer.length && chunk.signature !== "END\x00") {
		chunk = ReadChunk(data, chunkPos);
		// console.log("Chunk:", chunk);
		chunkPos += 16 + chunk.dataLength;

		const payload = new DataView(chunk.payload.buffer);

		if (chunk.signature == "META") {
			const arrayLength = payload.getUint32(0, true);
			const entries = [];

			var offset = 4;
			for (let i = 0; i < arrayLength; i++) {
				const [key, keyLength] = ReadString(payload, offset);
				offset += keyLength + 4;
				const [value, valueLength] = ReadString(payload, offset);
				offset += valueLength + 4;

				entries.push({ key, value });
			}

			console.log("META length:", arrayLength);
			console.log("META entries:", entries);
		} else if (chunk.signature == "SSTR") {
			// SSTR is currently unused
		} else if (chunk.signature == "INST") {
			const classId = payload.getInt32(0, true);
			const [className, classNameLength] = ReadString(payload, 4);
			const hasService = payload.getUint8(4 + 4 + classNameLength, true);
			const instLength = payload.getUint32(4 + 4 + classNameLength + 1, true);
			const instIds = ReadReferences(
				payload,
				4 + 4 + classNameLength + 1 + 4,
				instLength
			);
			const isService = [];
			for (let i = 0; i < instLength; i++) {
				isService.push(
					payload.getUint8(4 + 4 + classNameLength + 1 + 4 + instLength + i)
				);
			}

			console.log("INST classId:", classId);
			console.log("INST className:", className);
			console.log("INST hasService:", hasService);
			console.log("INST instLength:", instLength);
			console.log("INST instIds:", instIds);
			console.log("INST isService:", isService);
		} else if (chunk.signature == "PROP") {
			const classId = payload.getInt32(0, true);
			const [propName, propNameLength] = ReadString(payload, 4);
			const value = ReadPropertyValue(payload, 4 + 4 + propNameLength);

			console.log("PROP classId:", classId);
			console.log("PROP propName:", propName);
			console.log("PROP value type:", value.type);
		}
	}

	console.log("Finished decoding file.");

	return;
}

// test
const testFile = fs.readFileSync("test.rbxm");
decode(testFile);

})();

module.exports = __webpack_exports__;
/******/ })()
;