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

export { ReadString, ReadReferences, ReadPropertyValue };
