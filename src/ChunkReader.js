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
import ByteReader from "./ByteReader";

/**
 * Reads a chunk of data
 * @param {DataView} chunk
 */
export default function ReadChunk(reader) {
	const signature = [
		String.fromCharCode(reader.uint8()),
		String.fromCharCode(reader.uint8()),
		String.fromCharCode(reader.uint8()),
		String.fromCharCode(reader.uint8()),
	].join("");

	const compressedLength = reader.uint32(true);
	const uncompressedLength = reader.uint32(true);
	const dataLength =
		compressedLength == 0 ? uncompressedLength : compressedLength;
	reader.move(4);

	// might be incorrectly copying the chunk payload?
	const chunkData = new Uint8Array(dataLength);
	for (var i = 0; i < dataLength; i++) {
		chunkData[i] = reader.uint8();
	}

	var payload;
	// Decompress the data if it is compressed
	if (compressedLength != 0) {
		payload = new ByteReader(
			LZ4BlockJS.prototype.decodeBlock(chunkData, 0, uncompressedLength).buffer
		);
	} else {
		payload = new ByteReader(chunkData.buffer);
	}

	return {
		signature,
		compressedLength,
		uncompressedLength,
		dataLength,
		payload,
	};
}
