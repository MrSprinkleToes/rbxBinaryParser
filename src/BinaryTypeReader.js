// String:
// Length: uint32 - Length of the string
// Bytes: []uint8 - The string
https://github.com/MrSprinkleToes/rbxBinaryParser/blob/master/src/binaryTypeReader.js
import { getEnumName, getEnumValue } from "./EnumFetcher";
import { rotMatrixToEulerAngles } from "./util";

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
	0x06: "UDim",
	0x07: "UDim2",
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
const rotIds = {
	0x02: [+1, +0, +0, +0, +1, +0, +0, +0, +1],
	0x03: [+1, +0, +0, +0, +0, -1, +0, +1, +0],
	0x05: [+1, +0, +0, +0, -1, +0, +0, +0, -1],
	0x06: [+1, +0, -0, +0, +0, +1, +0, -1, +0],
	0x07: [+0, +1, +0, +1, +0, +0, +0, +0, -1],
	0x09: [+0, +0, +1, +1, +0, +0, +0, +1, +0],
	0x0a: [+0, -1, +0, +1, +0, -0, +0, +0, +1],
	0x0c: [+0, +0, -1, +1, +0, +0, +0, -1, +0],
	0x0d: [+0, +1, +0, +0, +0, +1, +1, +0, +0],
	0x0e: [+0, +0, -1, +0, +1, +0, +1, +0, +0],
	0x10: [+0, -1, +0, +0, +0, -1, +1, +0, +0],
	0x11: [+0, +0, +1, +0, -1, +0, +1, +0, -0],
	0x14: [-1, +0, +0, +0, +1, +0, +0, +0, -1],
	0x15: [-1, +0, +0, +0, +0, +1, +0, +1, -0],
	0x17: [-1, +0, +0, +0, -1, +0, +0, +0, +1],
	0x18: [-1, +0, -0, +0, +0, -1, +0, -1, -0],
	0x19: [+0, +1, -0, -1, +0, +0, +0, +0, +1],
	0x1b: [+0, +0, -1, -1, +0, +0, +0, +1, +0],
	0x1c: [+0, -1, -0, -1, +0, -0, +0, +0, -1],
	0x1e: [+0, +0, +1, -1, +0, +0, +0, -1, +0],
	0x1f: [+0, +1, +0, +0, +0, -1, -1, +0, +0],
	0x20: [+0, +0, +1, +0, +1, -0, -1, +0, +0],
	0x22: [+0, -1, +0, +0, +0, +1, -1, +0, +0],
	0x23: [+0, +0, -1, +0, -1, -0, -1, +0, -0],
};
const brickColorIds = {
	1: ["White", [242, 243, 243]],
	2: ["Grey", [161, 165, 162]],
	3: ["Light yellow", [249, 233, 153]],
	5: ["Brick yellow", [215, 197, 154]],
	6: ["Light green (Mint)", [194, 218, 184]],
	9: ["Light reddish violet", [232, 186, 200]],
	11: ["Pastel Blue", [128, 187, 219]],
	12: ["Light orange brown", [203, 132, 66]],
	18: ["Nougat", [204, 142, 105]],
	21: ["Bright red", [196, 40, 28]],
	22: ["Med. reddish violet", [196, 112, 160]],
	23: ["Bright blue", [13, 105, 172]],
	24: ["Bright yellow", [245, 205, 48]],
	25: ["Earth orange", [98, 71, 50]],
	26: ["Black", [27, 42, 53]],
	27: ["Dark grey", [109, 110, 108]],
	28: ["Dark green", [40, 127, 71]],
	29: ["Medium green", [161, 196, 140]],
	36: ["Lig. Yellowich orange", [243, 207, 155]],
	37: ["Bright green", [75, 151, 75]],
	38: ["Dark orange", [160, 95, 53]],
	39: ["Light bluish violet", [193, 202, 222]],
	40: ["Transparent", [236, 236, 236]],
	41: ["Tr. Red", [205, 84, 75]],
	42: ["Tr. Lg blue", [193, 223, 240]],
	43: ["Tr. Blue", [123, 182, 232]],
	44: ["Tr. Yellow", [247, 241, 141]],
	45: ["Light blue", [180, 210, 228]],
	47: ["Tr. Flu. Reddish orange", [217, 133, 108]],
	48: ["Tr. Green", [132, 182, 141]],
	49: ["Tr. Flu. Green", [248, 241, 132]],
	50: ["Phosph. White", [236, 232, 222]],
	100: ["Light red", [238, 196, 182]],
	101: ["Medium red", [218, 134, 122]],
	102: ["Medium blue", [110, 153, 202]],
	103: ["Light grey", [199, 193, 183]],
	104: ["Bright violet", [107, 50, 124]],
	105: ["Br. yellowish orange", [226, 155, 64]],
	106: ["Bright orange", [218, 133, 65]],
	107: ["Bright bluish green", [0, 143, 156]],
	108: ["Earth yellow", [104, 92, 67]],
	110: ["Bright bluish violet", [67, 84, 147]],
	111: ["Tr. Brown", [191, 183, 177]],
	112: ["Medium bluish violet", [104, 116, 172]],
	113: ["Tr. Medi. reddish violet", [229, 173, 200]],
	115: ["Med. yellowish green", [199, 210, 60]],
	116: ["Med. bluish green", [85, 165, 175]],
	118: ["Light bluish green", [183, 215, 213]],
	119: ["Br. yellowish green", [164, 189, 71]],
	120: ["Lig. yellowish green", [217, 228, 167]],
	121: ["Med. yellowish orange", [231, 172, 88]],
	123: ["Br. reddish orange", [211, 111, 76]],
	124: ["Bright reddish violet", [146, 57, 120]],
	125: ["Light orange", [234, 184, 146]],
	126: ["Tr. Bright bluish violet", [165, 165, 203]],
	127: ["Gold", [220, 188, 129]],
	128: ["Dark nougat", [174, 122, 89]],
	131: ["Silver", [156, 163, 168]],
	133: ["Neon orange", [213, 115, 61]],
	134: ["Neon green", [216, 221, 86]],
	135: ["Sand blue", [116, 134, 157]],
	136: ["Sand violet", [135, 124, 144]],
	137: ["Medium orange", [224, 152, 100]],
	138: ["Sand yellow", [149, 138, 115]],
	140: ["Earth blue", [32, 58, 86]],
	141: ["Earth green", [39, 70, 45]],
	143: ["Tr. Flu. Blue", [207, 226, 247]],
	145: ["Sand blue metallic", [121, 136, 161]],
	146: ["Sand violet metallic", [149, 142, 163]],
	147: ["Sand yellow metallic", [147, 135, 103]],
	148: ["Dark grey metallic", [87, 88, 87]],
	149: ["Black metallic", [22, 29, 50]],
	150: ["Light grey metallic", [171, 173, 172]],
	151: ["Sand green", [120, 144, 130]],
	153: ["Sand red", [149, 121, 119]],
	154: ["Dark red", [123, 46, 47]],
	157: ["Tr. Flu. Yellow", [255, 246, 123]],
	158: ["Tr. Flu. Red", [225, 164, 194]],
	168: ["Gun metallic", [117, 108, 98]],
	176: ["Red flip/flop", [151, 105, 91]],
	178: ["Yellow flip/flop", [180, 132, 85]],
	179: ["Silver flip/flop", [137, 135, 136]],
	180: ["Curry", [215, 169, 75]],
	190: ["Fire Yellow", [249, 214, 46]],
	191: ["Flame yellowish orange", [232, 171, 45]],
	192: ["Reddish brown", [105, 64, 40]],
	193: ["Flame reddish orange", [207, 96, 36]],
	194: ["Medium stone grey", [163, 162, 165]],
	195: ["Royal blue", [70, 103, 164]],
	196: ["Dark Royal blue", [35, 71, 139]],
	198: ["Bright reddish lilac", [142, 66, 133]],
	199: ["Dark stone grey", [99, 95, 98]],
	200: ["Lemon metalic", [130, 138, 93]],
	208: ["Light stone grey", [229, 228, 223]],
	209: ["Dark Curry", [176, 142, 68]],
	210: ["Faded green", [112, 149, 120]],
	211: ["Turquoise", [121, 181, 181]],
	212: ["Light Royal blue", [159, 195, 233]],
	213: ["Medium Royal blue", [108, 129, 183]],
	216: ["Rust", [144, 76, 42]],
	217: ["Brown", [124, 92, 70]],
	218: ["Reddish lilac", [150, 112, 159]],
	219: ["Lilac", [107, 98, 155]],
	220: ["Light lilac", [167, 169, 206]],
	221: ["Bright purple", [205, 98, 152]],
	222: ["Light purple", [228, 173, 200]],
	223: ["Light pink", [220, 144, 149]],
	224: ["Light brick yellow", [240, 213, 160]],
	225: ["Warm yellowish orange", [235, 184, 127]],
	226: ["Cool yellow", [253, 234, 141]],
	232: ["Dove blue", [125, 187, 221]],
	268: ["Medium lilac", [52, 43, 117]],
	301: ["Slime green", [80, 109, 84]],
	302: ["Smoky grey", [91, 93, 105]],
	303: ["Dark blue", [0, 16, 176]],
	304: ["Parsley green", [44, 101, 29]],
	305: ["Steel blue", [82, 124, 174]],
	306: ["Storm blue", [51, 88, 130]],
	307: ["Lapis", [16, 42, 220]],
	308: ["Dark indigo", [61, 21, 133]],
	309: ["Sea green", [52, 142, 64]],
	310: ["Shamrock", [91, 154, 76]],
	311: ["Fossil", [159, 161, 172]],
	312: ["Mulberry", [89, 34, 89]],
	313: ["Forest green", [31, 128, 29]],
	314: ["Cadet blue", [159, 173, 192]],
	315: ["Electric blue", [9, 137, 207]],
	316: ["Eggplant", [123, 0, 123]],
	317: ["Moss", [124, 156, 107]],
	318: ["Artichoke", [138, 171, 133]],
	319: ["Sage green", [185, 196, 177]],
	320: ["Ghost grey", [202, 203, 209]],
	321: ["Lilac", [167, 94, 155]],
	322: ["Plum", [123, 47, 123]],
	323: ["Olivine", [148, 190, 129]],
	324: ["Laurel green", [168, 189, 153]],
	325: ["Quill grey", [223, 223, 222]],
	327: ["Crimson", [151, 0, 0]],
	328: ["Mint", [177, 229, 166]],
	329: ["Baby blue", [152, 194, 219]],
	330: ["Carnation pink", [255, 152, 220]],
	331: ["Persimmon", [255, 89, 89]],
	332: ["Maroon", [117, 0, 0]],
	333: ["Gold", [239, 184, 56]],
	334: ["Daisy orange", [248, 217, 109]],
	335: ["Pearl", [231, 231, 236]],
	336: ["Fog", [199, 212, 228]],
	337: ["Salmon", [255, 148, 148]],
	338: ["Terra Cotta", [190, 104, 98]],
	339: ["Cocoa", [86, 36, 36]],
	340: ["Wheat", [241, 231, 199]],
	341: ["Buttermilk", [254, 243, 187]],
	342: ["Mauve", [224, 178, 208]],
	343: ["Sunrise", [212, 144, 189]],
	344: ["Tawny", [150, 85, 85]],
	345: ["Rust", [143, 76, 42]],
	346: ["Cashmere", [211, 190, 150]],
	347: ["Khaki", [226, 220, 188]],
	348: ["Lily white", [237, 234, 234]],
	349: ["Seashell", [233, 218, 218]],
	350: ["Burgundy", [136, 62, 62]],
	351: ["Cork", [188, 155, 93]],
	352: ["Burlap", [199, 172, 120]],
	353: ["Beige", [202, 191, 163]],
	354: ["Oyster", [187, 179, 178]],
	355: ["Pine Cone", [108, 88, 75]],
	356: ["Fawn brown", [160, 132, 79]],
	357: ["Hurricane grey", [149, 137, 136]],
	358: ["Cloudy grey", [171, 168, 158]],
	359: ["Linen", [175, 148, 131]],
	360: ["Copper", [150, 103, 102]],
	361: ["Medium brown", [86, 66, 54]],
	362: ["Bronze", [126, 104, 63]],
	363: ["Flint", [105, 102, 92]],
	364: ["Dark taupe", [90, 76, 66]],
	365: ["Burnt Sienna", [106, 57, 9]],
	1001: ["Institutional white", [248, 248, 248]],
	1002: ["Mid gray", [205, 205, 205]],
	1003: ["Really black", [17, 17, 17]],
	1004: ["Really red", [255, 0, 0]],
	1005: ["Deep orange", [255, 176, 0]],
	1006: ["Alder", [180, 128, 255]],
	1007: ["Dusty Rose", [163, 75, 75]],
	1008: ["Olive", [193, 190, 66]],
	1009: ["New Yeller", [255, 255, 0]],
	1010: ["Really blue", [0, 0, 255]],
	1011: ["Navy blue", [0, 32, 96]],
	1012: ["Deep blue", [33, 84, 185]],
	1013: ["Cyan", [4, 175, 236]],
	1014: ["CGA brown", [170, 85, 0]],
	1015: ["Magenta", [170, 0, 170]],
	1016: ["Pink", [255, 102, 204]],
	1017: ["Deep orange", [255, 175, 0]],
	1018: ["Teal", [18, 238, 212]],
	1019: ["Toothpaste", [0, 255, 255]],
	1020: ["Lime green", [0, 255, 0]],
	1021: ["Camo", [58, 125, 21]],
	1022: ["Grime", [127, 142, 100]],
	1023: ["Lavender", [140, 91, 159]],
	1024: ["Pastel light blue", [175, 221, 255]],
	1025: ["Pastel orange", [255, 201, 201]],
	1026: ["Pastel violet", [177, 167, 255]],
	1027: ["Pastel blue-green", [159, 243, 233]],
	1028: ["Pastel green", [204, 255, 204]],
	1029: ["Pastel yellow", [255, 255, 204]],
	1030: ["Pastel brown", [255, 204, 153]],
	1031: ["Royal purple", [98, 37, 209]],
	1032: ["Hot pink", [255, 0, 191]],
};

function interleaveUint32(data, byteOffset, itemCount, callbackFn) {
	const results = new Array(itemCount);
	const byteTotal = itemCount * 4;

	for (let i = 0; i < itemCount; i++) {
		let val = data.getUint8(byteOffset + i) << 24;
		val += data.getUint8(byteOffset + ((i + itemCount) % byteTotal)) << 16;
		val += data.getUint8(byteOffset + ((i + itemCount * 2) % byteTotal)) << 8;
		val += data.getUint8(byteOffset + ((i + itemCount * 3) % byteTotal));

		if (callbackFn) {
			results[i] = callbackFn(val);
		} else {
			results[i] = val;
		}
	}

	return results;
}

function float(longNum) {
	const exponent = longNum >>> 24;
	if (exponent === 0) {
		return 0;
	}
	const floatNum =
		2 ** (exponent - 127) * (1 + ((longNum >>> 1) & 0x7fffff) / 0x7fffff);
	return longNum & 1 ? -floatNum : floatNum;
}

function interleaveFloat(data, byteOffset, itemCount) {
	return interleaveUint32(data, byteOffset, itemCount, (val) => float(val));
}

function ReadString(data) {
	var length = data.uint32(true);
	var str = "";

	for (let i = 0; i < length; i++) {
		str += String.fromCharCode(data.uint8());
	}

	return [str, length];
}

function ReadReferences(data, length) {
	return data.interleavedInt32(length);
}

function ReadPropertyValue(data, instCount, className, propName) {
	const typeId = data.uint8();
	const type = valueTypes[typeId];
	const byteOffset = data.byteOffset;

	var values = [];
	switch (type) {
		case "String":
			for (let i = 0; i < instCount; i++) {
				const [str, len] = ReadString(data);
				values[i] = str;
			}
			break;
		case "Bool":
			for (let i = 0; i < instCount; i++) {
				values[i] = data.uint8() === 1;
			}
			break;
		case "Int":
			// is encoded as zint32b~4
			values = data.interleavedInt32(instCount);
			break;
		case "Float":
			// is encoded as rfloat32b~4
			values = data.interleavedFloat(instCount);
			break;
		case "Double":
			for (let i = 0; i < instCount; i++) {
				values[i] = data.float64(true);
			}
			break;
		case "UDim":
			const scale = data.interleavedFloat(instCount);
			const offset = data.interleavedInt32(instCount);

			for (let i = 0; i < instCount; i++) {
				values[i] = { Scale: scale[i], Offset: offset[i] };
			}
			break;
		case "UDim2":
			const scaleX = data.interleavedFloat(instCount);
			const scaleY = data.interleavedFloat(instCount);
			const offsetX = data.interleavedInt32(instCount);
			const offsetY = data.interleavedInt32(instCount);

			for (let i = 0; i < instCount; i++) {
				values[i] = {
					X: { Scale: scaleX[i], Offset: offsetX[i] },
					Y: { Scale: scaleY[i], Offset: offsetY[i] },
				};
			}
			break;
		case "Ray":
			for (let i = 0; i < instCount; i++) {
				const origin = {
					X: data.float32(true),
					Y: data.float32(true),
					Z: data.float32(true),
				};
				const direction = {
					X: data.float32(true),
					Y: data.float32(true),
					Z: data.float32(true),
				};
				values[i] = { Origin: origin, Direction: direction };
			}
			break;
		case "Faces":
			for (let i = 0; i < instCount; i++) {
				const faces = data.uint8();

				values[i] = {
					Right: !!(faces & 1),
					Top: !!(faces & 2),
					Back: !!(faces & 4),
					Left: !!(faces & 8),
					Bottom: !!(faces & 16),
					Front: !!(faces & 32),
				};
			}
			break;
		case "Axes":
			for (let i = 0; i < instCount; i++) {
				const axes = data.uint8();

				values[i] = {
					X: !!(axes & 1),
					Y: !!(axes & 2),
					Z: !!(axes & 4),
				};
			}
			break;
		case "BrickColor":
			const brickColor = data.interleavedUint32(instCount);

			for (let i = 0; i < instCount; i++) {
				const color = brickColorIds[brickColor[i]];
				values[i] = {
					Number: brickColor[i],
					Name: color ? color[0] : "Really black",
					Color: color
						? { R: color[1][0], G: color[1][1], B: color[1][2] }
						: { R: 0, G: 0, B: 0 },
				};
			}
			break;
		case "Color3":
			var r = data.interleavedFloat(instCount);
			var g = data.interleavedFloat(instCount);
			var b = data.interleavedFloat(instCount);

			for (let i = 0; i < instCount; i++) {
				values[i] = { R: r[i], G: g[i], B: b[i] };
			}
			break;
		case "Vector2":
			var y = data.interleavedFloat(instCount);
			var x = data.interleavedFloat(instCount);

			for (let i = 0; i < instCount; i++) {
				values[i] = { X: x[i], Y: y[i] };
			}
			break;
		case "Vector3":
			var x = data.interleavedFloat(instCount);
			var y = data.interleavedFloat(instCount);
			var z = data.interleavedFloat(instCount);

			for (let i = 0; i < instCount; i++) {
				values[i] = { X: x[i], Y: y[i], Z: z[i] };
			}
			break;
		case "Vector2int16":
			for (let i = 0; i < instCount; i++) {
				values[i] = {
					X: data.int16(true),
					Y: data.int16(true),
				};
			}
			break;
		case "CFrame":
			var cfs = [];

			for (let i = 0; i < instCount; i++) {
				var cf = [0, 0, 0];
				var rotId = data.uint8();

				if (rotId !== 0) {
					cf = [0, 0, 0, ...rotIds[rotId]];
				} else {
					for (let j = 0; j < 9; j++) {
						cf[j + 3] = data.float32(true);
					}
				}

				cfs[i] = cf;
			}

			const posX = data.interleavedFloat(instCount);
			const posY = data.interleavedFloat(instCount);
			const posZ = data.interleavedFloat(instCount);

			for (let i = 0; i < instCount; i++) {
				const [eX, eY, eZ] = rotMatrixToEulerAngles(cfs[i].slice(3));
				cfs[i][0] = posX[i];
				cfs[i][1] = posY[i];
				cfs[i][2] = posZ[i];

				values[i] = {
					Position: {
						X: posX[i],
						Y: posY[i],
						Z: posZ[i],
					},
					Orientation: {
						X: eX,
						Y: eY,
						Z: eZ,
					},
					Components: cfs[i],
				};
			}
			break;
		case "CFrameQuat":
			// not used
			break;
		case "Token":
			// enum
			var vals = data.interleavedUint32(instCount);
			for (let i = 0; i < instCount; i++) {
				var enumName = getEnumName(propName, className);
				if (enumName) {
					var enumValue = getEnumValue(enumName, vals[i]);
					values[i] = enumValue;
				}
			}
			break;
		case "Reference":
			// TODO: implement
			break;
		case "Vector3uint16":
			for (let i = 0; i < instCount; i++) {
				values[i] = {
					X: data.uint16(true),
					Y: data.uint16(true),
					Z: data.uint16(true),
				};
			}
			break;
		case "NumberSequence":
			for (let i = 0; i < instCount; i++) {
				var length = data.uint32(true);
				values[i] = [];
				for (let j = 0; j < length; j++) {
					var time = data.float32(true);
					var value = data.float32(true);
					var envelope = data.float32(true);
					values[i].push({
						Time: time,
						Value: value,
						Envelope: envelope,
					});
				}
			}
			break;
		case "ColorSequence":
			// TODO: implement
			break;
		case "NumberRange":
			for (let i = 0; i < instCount; i++) {
				values[i] = {
					Min: data.float32(true),
					Max: data.float32(true),
				};
			}
			break;
		case "Rect":
			var minX = data.interleavedFloat(instCount);
			var minY = data.interleavedFloat(instCount);
			var maxX = data.interleavedFloat(instCount);
			var maxY = data.interleavedFloat(instCount);

			for (let i = 0; i < instCount; i++) {
				values[i] = {
					Min: {
						X: minX[i],
						Y: minY[i],
					},
					Max: {
						X: maxX[i],
						Y: maxY[i],
					},
				};
			}
			break;
		case "PhysicalProperties":
			for (let i = 0; i < instCount; i++) {
				var customPhysics = data.uint8() === 1;
				if (customPhysics) {
					values[i] = {
						Density: data.float32(true),
						Friction: data.float32(true),
						Elasticity: data.float32(true),
						FrictionWeight: data.float32(true),
						ElasticityWeight: data.float32(true),
					};
				}
			}
			break;
		case "Color3uint8":
			var r = data.interleavedUint8(instCount);
			var g = data.interleavedUint8(instCount);
			var b = data.interleavedUint8(instCount);

			for (let i = 0; i < instCount; i++) {
				values[i] = {
					R: r[i] / 255,
					G: g[i] / 255,
					B: b[i] / 255,
				};
			}
			break;
		default:
			values = null;
	}

	return {
		type,
		values,
	};
}

export { ReadString, ReadReferences, ReadPropertyValue };
