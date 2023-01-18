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
	return interleaveInt32(data, offset, length);
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

function interleaveFloat(data, offset, itemCount) {
	return interleaveUint32(data, offset, itemCount, (val) => float(val));
}

function ReadPropertyValue(data, offset, instCount) {
	const typeId = data.getUint8(offset);
	const type = valueTypes[typeId];

	var values = [];
	switch (type) {
		case "String":
			var off = 0;
			for (let i = 0; i < instCount; i++) {
				const [str, len] = ReadString(data, offset + 1 + off);
				values[i] = str;
				off += len + 4;
			}
			break;
		case "Bool":
			for (let i = 0; i < instCount; i++) {
				values[i] = data.getUint8(offset + 1 + i) === 1;
			}
			break;
		case "Int":
			// is encoded as zint32b~4
			values = interleaveInt32(data, offset + 1, instCount);
			break;
		case "Float":
			// is encoded as rfloat32b~4
			values = interleaveFloat(data, offset + 1, instCount);
			break;
		case "Double":
			// TODO: implement
			break;
		case "UDim":
			// TODO: implement
			break;
		case "UDim2":
			// TODO: implement
			break;
		case "Ray":
			// TODO: implement
			break;
		case "Faces":
			// TODO: implement
			break;
		case "Axes":
			// TODO: implement
			break;
		case "BrickColor":
			// TODO: implement
			break;
		case "Color3":
			// TODO: implement
			break;
		case "Vector2":
			// TODO: implement
			break;
		case "Vector3":
			const x = interleaveFloat(data, offset + 1, instCount);
			const y = interleaveFloat(data, offset + 1 + instCount * 4, instCount);
			const z = interleaveFloat(data, offset + 1 + instCount * 8, instCount);

			for (let i = 0; i < instCount; i++) {
				values[i] = { x: x[i], y: y[i], z: z[i] };
			}
			break;
		case "Vector2int16":
			// TODO: implement
			break;
		case "CFrame":
			var cf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

			const posX = interleaveFloat(data, offset + 1 + 38, instCount);
			const posY = interleaveFloat(
				data,
				offset + 1 + 38 + instCount * 4,
				instCount
			);
			const posZ = interleaveFloat(
				data,
				offset + 1 + 38 + instCount * 8,
				instCount
			);
			cf[0] = posX;
			cf[1] = posY;
			cf[2] = posZ;

			values = {
				Position: { x: posX, y: posY, z: posZ },
				Components: cf,
			};
		default:
			values = null;
	}

	return {
		type,
		values,
	};
}

export { ReadString, ReadReferences, ReadPropertyValue };
