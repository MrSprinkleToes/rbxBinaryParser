/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 695:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

// lz4.js - An implementation of Lz4 in plain JavaScript.
//
// TODO:
// - Unify header parsing/writing.
// - Support options (block size, checksums)
// - Support streams
// - Better error handling (handle bad offset, etc.)
// - HC support (better search algorithm)
// - Tests/benchmarking

var xxhash = __nccwpck_require__(49);
var util = __nccwpck_require__(768);

// Constants
// --

// Compression format parameters/constants.
var minMatch = 4;
var minLength = 13;
var searchLimit = 5;
var skipTrigger = 6;
var hashSize = 1 << 16;

// Token constants.
var mlBits = 4;
var mlMask = (1 << mlBits) - 1;
var runBits = 4;
var runMask = (1 << runBits) - 1;

// Shared buffers
var blockBuf = makeBuffer(5 << 20);
var hashTable = makeHashTable();

// Frame constants.
var magicNum = 0x184D2204;

// Frame descriptor flags.
var fdContentChksum = 0x4;
var fdContentSize = 0x8;
var fdBlockChksum = 0x10;
// var fdBlockIndep = 0x20;
var fdVersion = 0x40;
var fdVersionMask = 0xC0;

// Block sizes.
var bsUncompressed = 0x80000000;
var bsDefault = 7;
var bsShift = 4;
var bsMask = 7;
var bsMap = {
  4: 0x10000,
  5: 0x40000,
  6: 0x100000,
  7: 0x400000
};

// Utility functions/primitives
// --

// Makes our hashtable. On older browsers, may return a plain array.
function makeHashTable () {
  try {
    return new Uint32Array(hashSize);
  } catch (error) {
    var hashTable = new Array(hashSize);

    for (var i = 0; i < hashSize; i++) {
      hashTable[i] = 0;
    }

    return hashTable;
  }
}

// Clear hashtable.
function clearHashTable (table) {
  for (var i = 0; i < hashSize; i++) {
    hashTable[i] = 0;
  }
}

// Makes a byte buffer. On older browsers, may return a plain array.
function makeBuffer (size) {
  try {
    return new Uint8Array(size);
  } catch (error) {
    var buf = new Array(size);

    for (var i = 0; i < size; i++) {
      buf[i] = 0;
    }

    return buf;
  }
}

function sliceArray (array, start, end) {
  if (typeof array.buffer !== undefined) {
    if (Uint8Array.prototype.slice) {
      return array.slice(start, end);
    } else {
      // Uint8Array#slice polyfill.
      var len = array.length;

      // Calculate start.
      start = start | 0;
      start = (start < 0) ? Math.max(len + start, 0) : Math.min(start, len);

      // Calculate end.
      end = (end === undefined) ? len : end | 0;
      end = (end < 0) ? Math.max(len + end, 0) : Math.min(end, len);

      // Copy into new array.
      var arraySlice = new Uint8Array(end - start);
      for (var i = start, n = 0; i < end;) {
        arraySlice[n++] = array[i++];
      }

      return arraySlice;
    }
  } else {
    // Assume normal array.
    return array.slice(start, end);
  }
}

// Implementation
// --

// Calculates an upper bound for lz4 compression.
exports.compressBound = function compressBound (n) {
  return (n + (n / 255) + 16) | 0;
};

// Calculates an upper bound for lz4 decompression, by reading the data.
exports.decompressBound = function decompressBound (src) {
  var sIndex = 0;

  // Read magic number
  if (util.readU32(src, sIndex) !== magicNum) {
    throw new Error('invalid magic number');
  }

  sIndex += 4;

  // Read descriptor
  var descriptor = src[sIndex++];

  // Check version
  if ((descriptor & fdVersionMask) !== fdVersion) {
    throw new Error('incompatible descriptor version ' + (descriptor & fdVersionMask));
  }

  // Read flags
  var useBlockSum = (descriptor & fdBlockChksum) !== 0;
  var useContentSize = (descriptor & fdContentSize) !== 0;

  // Read block size
  var bsIdx = (src[sIndex++] >> bsShift) & bsMask;

  if (bsMap[bsIdx] === undefined) {
    throw new Error('invalid block size ' + bsIdx);
  }

  var maxBlockSize = bsMap[bsIdx];

  // Get content size
  if (useContentSize) {
    return util.readU64(src, sIndex);
  }

  // Checksum
  sIndex++;

  // Read blocks.
  var maxSize = 0;
  while (true) {
    var blockSize = util.readU32(src, sIndex);
    sIndex += 4;

    if (blockSize & bsUncompressed) {
      blockSize &= ~bsUncompressed;
      maxSize += blockSize;
    } else {
      maxSize += maxBlockSize;
    }

    if (blockSize === 0) {
      return maxSize;
    }

    if (useBlockSum) {
      sIndex += 4;
    }

    sIndex += blockSize;
  }
};

// Creates a buffer of a given byte-size, falling back to plain arrays.
exports.makeBuffer = makeBuffer;

// Decompresses a block of Lz4.
exports.decompressBlock = function decompressBlock (src, dst, sIndex, sLength, dIndex) {
  var mLength, mOffset, sEnd, n, i;

  // Setup initial state.
  sEnd = sIndex + sLength;

  // Consume entire input block.
  while (sIndex < sEnd) {
    var token = src[sIndex++];

    // Copy literals.
    var literalCount = (token >> 4);
    if (literalCount > 0) {
      // Parse length.
      if (literalCount === 0xf) {
        while (true) {
          literalCount += src[sIndex];
          if (src[sIndex++] !== 0xff) {
            break;
          }
        }
      }

      // Copy literals
      for (n = sIndex + literalCount; sIndex < n;) {
        dst[dIndex++] = src[sIndex++];
      }
    }

    if (sIndex >= sEnd) {
      break;
    }

    // Copy match.
    mLength = (token & 0xf);

    // Parse offset.
    mOffset = src[sIndex++] | (src[sIndex++] << 8);

    // Parse length.
    if (mLength === 0xf) {
      while (true) {
        mLength += src[sIndex];
        if (src[sIndex++] !== 0xff) {
          break;
        }
      }
    }

    mLength += minMatch;

    // Copy match.
    for (i = dIndex - mOffset, n = i + mLength; i < n;) {
      dst[dIndex++] = dst[i++] | 0;
    }
  }

  return dIndex;
};

// Compresses a block with Lz4.
exports.compressBlock = function compressBlock (src, dst, sIndex, sLength, hashTable) {
  var mIndex, mAnchor, mLength, mOffset, mStep;
  var literalCount, dIndex, sEnd, n;

  // Setup initial state.
  dIndex = 0;
  sEnd = sLength + sIndex;
  mAnchor = sIndex;

  // Process only if block is large enough.
  if (sLength >= minLength) {
    var searchMatchCount = (1 << skipTrigger) + 3;

    // Consume until last n literals (Lz4 spec limitation.)
    while (sIndex + minMatch < sEnd - searchLimit) {
      var seq = util.readU32(src, sIndex);
      var hash = util.hashU32(seq) >>> 0;

      // Crush hash to 16 bits.
      hash = ((hash >> 16) ^ hash) >>> 0 & 0xffff;

      // Look for a match in the hashtable. NOTE: remove one; see below.
      mIndex = hashTable[hash] - 1;

      // Put pos in hash table. NOTE: add one so that zero = invalid.
      hashTable[hash] = sIndex + 1;

      // Determine if there is a match (within range.)
      if (mIndex < 0 || ((sIndex - mIndex) >>> 16) > 0 || util.readU32(src, mIndex) !== seq) {
        mStep = searchMatchCount++ >> skipTrigger;
        sIndex += mStep;
        continue;
      }

      searchMatchCount = (1 << skipTrigger) + 3;

      // Calculate literal count and offset.
      literalCount = sIndex - mAnchor;
      mOffset = sIndex - mIndex;

      // We've already matched one word, so get that out of the way.
      sIndex += minMatch;
      mIndex += minMatch;

      // Determine match length.
      // N.B.: mLength does not include minMatch, Lz4 adds it back
      // in decoding.
      mLength = sIndex;
      while (sIndex < sEnd - searchLimit && src[sIndex] === src[mIndex]) {
        sIndex++;
        mIndex++;
      }
      mLength = sIndex - mLength;

      // Write token + literal count.
      var token = mLength < mlMask ? mLength : mlMask;
      if (literalCount >= runMask) {
        dst[dIndex++] = (runMask << mlBits) + token;
        for (n = literalCount - runMask; n >= 0xff; n -= 0xff) {
          dst[dIndex++] = 0xff;
        }
        dst[dIndex++] = n;
      } else {
        dst[dIndex++] = (literalCount << mlBits) + token;
      }

      // Write literals.
      for (var i = 0; i < literalCount; i++) {
        dst[dIndex++] = src[mAnchor + i];
      }

      // Write offset.
      dst[dIndex++] = mOffset;
      dst[dIndex++] = (mOffset >> 8);

      // Write match length.
      if (mLength >= mlMask) {
        for (n = mLength - mlMask; n >= 0xff; n -= 0xff) {
          dst[dIndex++] = 0xff;
        }
        dst[dIndex++] = n;
      }

      // Move the anchor.
      mAnchor = sIndex;
    }
  }

  // Nothing was encoded.
  if (mAnchor === 0) {
    return 0;
  }

  // Write remaining literals.
  // Write literal token+count.
  literalCount = sEnd - mAnchor;
  if (literalCount >= runMask) {
    dst[dIndex++] = (runMask << mlBits);
    for (n = literalCount - runMask; n >= 0xff; n -= 0xff) {
      dst[dIndex++] = 0xff;
    }
    dst[dIndex++] = n;
  } else {
    dst[dIndex++] = (literalCount << mlBits);
  }

  // Write literals.
  sIndex = mAnchor;
  while (sIndex < sEnd) {
    dst[dIndex++] = src[sIndex++];
  }

  return dIndex;
};

// Decompresses a frame of Lz4 data.
exports.decompressFrame = function decompressFrame (src, dst) {
  var useBlockSum, useContentSum, useContentSize, descriptor;
  var sIndex = 0;
  var dIndex = 0;

  // Read magic number
  if (util.readU32(src, sIndex) !== magicNum) {
    throw new Error('invalid magic number');
  }

  sIndex += 4;

  // Read descriptor
  descriptor = src[sIndex++];

  // Check version
  if ((descriptor & fdVersionMask) !== fdVersion) {
    throw new Error('incompatible descriptor version');
  }

  // Read flags
  useBlockSum = (descriptor & fdBlockChksum) !== 0;
  useContentSum = (descriptor & fdContentChksum) !== 0;
  useContentSize = (descriptor & fdContentSize) !== 0;

  // Read block size
  var bsIdx = (src[sIndex++] >> bsShift) & bsMask;

  if (bsMap[bsIdx] === undefined) {
    throw new Error('invalid block size');
  }

  if (useContentSize) {
    // TODO: read content size
    sIndex += 8;
  }

  sIndex++;

  // Read blocks.
  while (true) {
    var compSize;

    compSize = util.readU32(src, sIndex);
    sIndex += 4;

    if (compSize === 0) {
      break;
    }

    if (useBlockSum) {
      // TODO: read block checksum
      sIndex += 4;
    }

    // Check if block is compressed
    if ((compSize & bsUncompressed) !== 0) {
      // Mask off the 'uncompressed' bit
      compSize &= ~bsUncompressed;

      // Copy uncompressed data into destination buffer.
      for (var j = 0; j < compSize; j++) {
        dst[dIndex++] = src[sIndex++];
      }
    } else {
      // Decompress into blockBuf
      dIndex = exports.decompressBlock(src, dst, sIndex, compSize, dIndex);
      sIndex += compSize;
    }
  }

  if (useContentSum) {
    // TODO: read content checksum
    sIndex += 4;
  }

  return dIndex;
};

// Compresses data to an Lz4 frame.
exports.compressFrame = function compressFrame (src, dst) {
  var dIndex = 0;

  // Write magic number.
  util.writeU32(dst, dIndex, magicNum);
  dIndex += 4;

  // Descriptor flags.
  dst[dIndex++] = fdVersion;
  dst[dIndex++] = bsDefault << bsShift;

  // Descriptor checksum.
  dst[dIndex] = xxhash.hash(0, dst, 4, dIndex - 4) >> 8;
  dIndex++;

  // Write blocks.
  var maxBlockSize = bsMap[bsDefault];
  var remaining = src.length;
  var sIndex = 0;

  // Clear the hashtable.
  clearHashTable(hashTable);

  // Split input into blocks and write.
  while (remaining > 0) {
    var compSize = 0;
    var blockSize = remaining > maxBlockSize ? maxBlockSize : remaining;

    compSize = exports.compressBlock(src, blockBuf, sIndex, blockSize, hashTable);

    if (compSize > blockSize || compSize === 0) {
      // Output uncompressed.
      util.writeU32(dst, dIndex, 0x80000000 | blockSize);
      dIndex += 4;

      for (var z = sIndex + blockSize; sIndex < z;) {
        dst[dIndex++] = src[sIndex++];
      }

      remaining -= blockSize;
    } else {
      // Output compressed.
      util.writeU32(dst, dIndex, compSize);
      dIndex += 4;

      for (var j = 0; j < compSize;) {
        dst[dIndex++] = blockBuf[j++];
      }

      sIndex += blockSize;
      remaining -= blockSize;
    }
  }

  // Write blank end block.
  util.writeU32(dst, dIndex, 0);
  dIndex += 4;

  return dIndex;
};

// Decompresses a buffer containing an Lz4 frame. maxSize is optional; if not
// provided, a maximum size will be determined by examining the data. The
// buffer returned will always be perfectly-sized.
exports.decompress = function decompress (src, maxSize) {
  var dst, size;

  if (maxSize === undefined) {
    maxSize = exports.decompressBound(src);
  }

  dst = exports.makeBuffer(maxSize);
  size = exports.decompressFrame(src, dst);

  if (size !== maxSize) {
    dst = sliceArray(dst, 0, size);
  }

  return dst;
};

// Compresses a buffer to an Lz4 frame. maxSize is optional; if not provided,
// a buffer will be created based on the theoretical worst output size for a
// given input size. The buffer returned will always be perfectly-sized.
exports.compress = function compress (src, maxSize) {
  var dst, size;

  if (maxSize === undefined) {
    maxSize = exports.compressBound(src.length);
  }

  dst = exports.makeBuffer(maxSize);
  size = exports.compressFrame(src, dst);

  if (size !== maxSize) {
    dst = sliceArray(dst, 0, size);
  }

  return dst;
};


/***/ }),

/***/ 768:
/***/ ((__unused_webpack_module, exports) => {

// Simple hash function, from: http://burtleburtle.net/bob/hash/integer.html.
// Chosen because it doesn't use multiply and achieves full avalanche.
exports.hashU32 = function hashU32 (a) {
  a = a | 0;
  a = a + 2127912214 + (a << 12) | 0;
  a = a ^ -949894596 ^ a >>> 19;
  a = a + 374761393 + (a << 5) | 0;
  a = a + -744332180 ^ a << 9;
  a = a + -42973499 + (a << 3) | 0;
  return a ^ -1252372727 ^ a >>> 16 | 0;
};

// Reads a 64-bit little-endian integer from an array.
exports.readU64 = function readU64 (b, n) {
  var x = 0;
  x |= b[n++] << 0;
  x |= b[n++] << 8;
  x |= b[n++] << 16;
  x |= b[n++] << 24;
  x |= b[n++] << 32;
  x |= b[n++] << 40;
  x |= b[n++] << 48;
  x |= b[n++] << 56;
  return x;
};

// Reads a 32-bit little-endian integer from an array.
exports.readU32 = function readU32 (b, n) {
  var x = 0;
  x |= b[n++] << 0;
  x |= b[n++] << 8;
  x |= b[n++] << 16;
  x |= b[n++] << 24;
  return x;
};

// Writes a 32-bit little-endian integer from an array.
exports.writeU32 = function writeU32 (b, n, x) {
  b[n++] = (x >> 0) & 0xff;
  b[n++] = (x >> 8) & 0xff;
  b[n++] = (x >> 16) & 0xff;
  b[n++] = (x >> 24) & 0xff;
};

// Multiplies two numbers using 32-bit integer multiplication.
// Algorithm from Emscripten.
exports.imul = function imul (a, b) {
  var ah = a >>> 16;
  var al = a & 65535;
  var bh = b >>> 16;
  var bl = b & 65535;

  return al * bl + (ah * bl + al * bh << 16) | 0;
};


/***/ }),

/***/ 49:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

// xxh32.js - implementation of xxhash32 in plain JavaScript
var util = __nccwpck_require__(768);

// xxhash32 primes
var prime1 = 0x9e3779b1;
var prime2 = 0x85ebca77;
var prime3 = 0xc2b2ae3d;
var prime4 = 0x27d4eb2f;
var prime5 = 0x165667b1;

// Utility functions/primitives
// --

function rotl32 (x, r) {
  x = x | 0;
  r = r | 0;

  return x >>> (32 - r | 0) | x << r | 0;
}

function rotmul32 (h, r, m) {
  h = h | 0;
  r = r | 0;
  m = m | 0;

  return util.imul(h >>> (32 - r | 0) | h << r, m) | 0;
}

function shiftxor32 (h, s) {
  h = h | 0;
  s = s | 0;

  return h >>> s ^ h | 0;
}

// Implementation
// --

function xxhapply (h, src, m0, s, m1) {
  return rotmul32(util.imul(src, m0) + h, s, m1);
}

function xxh1 (h, src, index) {
  return rotmul32((h + util.imul(src[index], prime5)), 11, prime1);
}

function xxh4 (h, src, index) {
  return xxhapply(h, util.readU32(src, index), prime3, 17, prime4);
}

function xxh16 (h, src, index) {
  return [
    xxhapply(h[0], util.readU32(src, index + 0), prime2, 13, prime1),
    xxhapply(h[1], util.readU32(src, index + 4), prime2, 13, prime1),
    xxhapply(h[2], util.readU32(src, index + 8), prime2, 13, prime1),
    xxhapply(h[3], util.readU32(src, index + 12), prime2, 13, prime1)
  ];
}

function xxh32 (seed, src, index, len) {
  var h, l;
  l = len;
  if (len >= 16) {
    h = [
      seed + prime1 + prime2,
      seed + prime2,
      seed,
      seed - prime1
    ];

    while (len >= 16) {
      h = xxh16(h, src, index);

      index += 16;
      len -= 16;
    }

    h = rotl32(h[0], 1) + rotl32(h[1], 7) + rotl32(h[2], 12) + rotl32(h[3], 18) + l;
  } else {
    h = (seed + prime5 + len) >>> 0;
  }

  while (len >= 4) {
    h = xxh4(h, src, index);

    index += 4;
    len -= 4;
  }

  while (len > 0) {
    h = xxh1(h, src, index);

    index++;
    len--;
  }

  h = shiftxor32(util.imul(shiftxor32(util.imul(shiftxor32(h, 15), prime2), 13), prime3), 16);

  return h >>> 0;
}

exports.hash = xxh32;


/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
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
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
// ESM COMPAT FLAG
__nccwpck_require__.r(__webpack_exports__);

// EXPORTS
__nccwpck_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ decode)
});

;// CONCATENATED MODULE: ./src/ChunkReader.js
// Chunk:
// Signature: [4]uint8 - Type of chunk and structure of data
// CompressedLength: uint32 - Length of the data
// UncompressedLength: uint32 - Length of the data after decompression
// Reserved: [4]uint8 - Reserved for future use
// Data: []uint8 - The data
// Chunks are compressed using LZ4
// If the chunk is not compressed, CompressedLength == 0 and UncompressedLength == the length of the data

var lz4 = __nccwpck_require__(695);

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

	// Decompress the data if it is compressed
	if (compressedLength != 0) {
		const decompressed = lz4.decompress(chunkData, uncompressedLength); // TODO: figure out why magic number is invalid

		return {
			signature,
			compressedLength,
			uncompressedLength,
			dataLength,
			chunkData,
		};
	}

	return {
		signature,
		compressedLength,
		uncompressedLength,
		dataLength,
		chunkData,
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
		console.log("Chunk:", chunk);
		chunkPos += 16 + chunk.dataLength;
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