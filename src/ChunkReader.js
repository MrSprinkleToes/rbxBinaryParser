// Chunk:
// Signature: [4]uint8 - Type of chunk and structure of data
// CompressedLength: uint32 - Length of the data
// UncompressedLength: uint32 - Length of the data after decompression
// Reserved: [4]uint8 - Reserved for future use
// Data: []uint8 - The data
// Chunks are compressed using LZ4
// If the chunk is not compressed, CompressedLength == 0 and UncompressedLength == the length of the data

// var lz4 = require("lz4js");
import LZ4BlockJS from "./lz4";

/**
 * Reads a chunk of data
 * @param {DataView} chunk
 */
export default function ReadChunk(data, offset) {
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
