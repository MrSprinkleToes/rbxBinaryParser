import {
	ReadPropertyValue,
	ReadReferences,
	ReadString,
} from "./BinaryTypeReader";
import ByteReader from "./ByteReader";
import ReadChunk from "./ChunkReader";
import { arraysEqual } from "./util";

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

function decode(buffer) {
	const start = performance.now();
	const data = new ByteReader(buffer);

	// Get the signature
	var sig = [];
	for (var i = 0; i < signature.length; i++) {
		sig.push(data.uint8());
	}

	console.assert(arraysEqual(sig, signature), "Invalid file signature.");
	console.log("Valid file signature.");

	// Get the version
	var version = data.uint16(true);
	console.log("Version:", version);

	var header = {
		classCount: data.uint32(true),
		instanceCount: data.uint32(true),
	};
	data.move(8);
	console.log("Header:", header);

	// for each chunk get the signature, compressed length, uncompressed length, and data using ReadChunk(chunk: ArrayBuffer)
	var chunk = {};
	var instances = [];
	var classes = [];
	var output = [];
	while (chunk.signature !== "END\x00") {
		chunk = ReadChunk(data);
		const payload = chunk.payload;

		if (chunk.signature == "META") {
			const arrayLength = payload.uint32(true);
			const entries = [];

			for (let i = 0; i < arrayLength; i++) {
				const [key] = ReadString(payload);
				const [value] = ReadString(payload);

				entries.push({ key, value });
			}

			// console.log("META length:", arrayLength);
			// console.log("META entries:", entries);
		} else if (chunk.signature == "SSTR") {
			// SSTR is currently unused
		} else if (chunk.signature == "INST") {
			const classId = payload.int32(true);
			const [className, classNameLength] = ReadString(payload);
			const hasService = payload.uint8(true);
			const instLength = payload.uint32(true);
			const instIds = ReadReferences(payload, instLength);
			const isService = [];
			for (let i = 0; i < instLength; i++) {
				isService.push(payload.uint8() == 1);
			}

			// console.log("INST classId:", classId);
			// console.log("INST className:", className);
			// console.log("INST hasService:", hasService);
			// console.log("INST instLength:", instLength);
			// console.log("INST instIds:", instIds);
			// console.log("INST isService:", isService);

			classes[classId] = {
				className,
				instances: [],
			};

			var instId = 0;
			for (let i = 0; i < instLength; i++) {
				instId += instIds[i];
				instances[instId] = { ClassName: className, Children: [] };
				classes[classId].instances.push(instId);
			}
		} else if (chunk.signature == "PROP") {
			const classId = payload.int32(true);
			var [propName, propNameLength] = ReadString(payload);
			const value = ReadPropertyValue(
				payload,
				classes[classId].instances.length,
				classes[classId].className,
				propName
			);

			if (value.values) {
				for (let i = 0; i < classes[classId].instances.length; i++) {
					const instId = classes[classId].instances[i];
					propName = propName.charAt(0).toUpperCase() + propName.slice(1);
					if (propName == "Color3uint8") propName = "Color3";
					instances[instId][propName] = value.values[i];
				}
			}

			// console.log("PROP classId:", classId);
			// console.log("PROP propName:", propName);
			// console.log("PROP value type:", value.type);
			// console.log("PROP values:", value.values);
		} else if (chunk.signature == "PRNT") {
			payload.move(1);
			const assocLength = payload.uint32(true);
			const children = ReadReferences(payload, assocLength);
			const parents = ReadReferences(payload, assocLength);

			var childId = 0;
			var parentId = 0;
			for (let i = 0; i < assocLength; i++) {
				childId += children[i];
				parentId += parents[i];

				const child = instances[childId];

				if (parentId < 0) {
					// console.log("PRNT child", child, childId, "is root");
					output[childId] = child;
				} else {
					const parent = instances[parentId];

					parent.Children.push(child);

					// console.log(
					// 	"PRNT child",
					// 	child,
					// 	childId,
					// 	"is child of parent",
					// 	parent
					// );
				}
			}

			// console.log("PRNT assocLength:", assocLength);
			// console.log("PRNT children:", children);
			// console.log("PRNT parents:", parents);
		}
	}

	// console.log("Output:", output);
	console.log(
		"Finished decoding file.\nTime elapsed:",
		performance.now() - start,
		"ms"
	);

	return output;
}

export { decode };
