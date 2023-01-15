import {
	ReadPropertyValue,
	ReadReferences,
	ReadString,
} from "./binaryTypeReader";
import ReadChunk from "./ChunkReader";
import { arraysEqual } from "./util";

const fs = require("fs");

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

export default function decode(buffer) {
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
