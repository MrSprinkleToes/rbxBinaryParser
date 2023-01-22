export default class ByteReader {
	constructor(buffer) {
		this.data = new DataView(buffer);
		this.byteOffset = 0;
	}

	move(offset) {
		this.byteOffset += offset;
	}

	goto(offset) {
		this.byteOffset = offset;
	}

	int8() {
		this.move(1);
		return this.data.getInt8(this.byteOffset - 1);
	}

	uint8() {
		this.move(1);
		return this.data.getUint8(this.byteOffset - 1);
	}

	int16(littleEndian = false) {
		this.move(2);
		return this.data.getInt16(this.byteOffset - 2, littleEndian);
	}

	uint16(littleEndian = false) {
		this.move(2);
		return this.data.getUint16(this.byteOffset - 2, littleEndian);
	}

	int32(littleEndian = false) {
		this.move(4);
		return this.data.getInt32(this.byteOffset - 4, littleEndian);
	}

	uint32(littleEndian = false) {
		this.move(4);
		return this.data.getUint32(this.byteOffset - 4, littleEndian);
	}

	float32(littleEndian = false) {
		this.move(4);
		return this.data.getFloat32(this.byteOffset - 4, littleEndian);
	}

	float64(littleEndian = false) {
		this.move(8);
		return this.data.getFloat64(this.byteOffset - 8, littleEndian);
	}

	interleavedUint8(length, cb) {
		const results = [];
		// const byteTotal = length * 4;

		for (let i = 0; i < length; i++) {
			let v = this.uint8();

			if (cb) {
				results[i] = cb(v);
			} else {
				results[i] = v;
			}
		}

		return results;
	}

	interleavedInt8(length) {
		var result = this.interleavedUint8(length);
		for (let i = 0; i < length; i++) {
			var v = result[i];
			result[i] = v % 2 === 1 ? -(v + 1) / 2 : v / 2;
		}
		return result;
	}

	interleavedUint32(length, cb) {
		const results = [];
		const byteTotal = length * 4;

		for (let i = 0; i < length; i++) {
			let v = this.data.getUint8(this.byteOffset + i) << 24;
			v +=
				this.data.getUint8(this.byteOffset + ((i + length) % byteTotal)) << 16;
			v +=
				this.data.getUint8(this.byteOffset + ((i + length * 2) % byteTotal)) <<
				8;
			v += this.data.getUint8(this.byteOffset + ((i + length * 3) % byteTotal));

			if (cb) {
				results[i] = cb(v);
			} else {
				results[i] = v;
			}
		}

		this.move(byteTotal);

		return results;
	}

	interleavedInt32(length) {
		return this.interleavedUint32(length, (v) =>
			v % 2 === 1 ? -(v + 1) / 2 : v / 2
		);
	}

	interleavedFloat(length) {
		return this.interleavedUint32(length, (n) => {
			const exponent = n >>> 24;
			if (exponent === 0) {
				return 0;
			}
			const floatNum =
				2 ** (exponent - 127) * (1 + ((n >>> 1) & 0x7fffff) / 0x7fffff);
			return n & 1 ? -floatNum : floatNum;
		});
	}
}
