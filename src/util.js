/**
 * Checks if two arrays are equal
 * @param {Array} a
 * @param {Array} b
 * @returns
 */
export function arraysEqual(a, b) {
	if (a.length == b.length) {
		a.forEach((v, i) => {
			if (v != b[i]) return false;
		});
		return true;
	}
	return false;
}

export function rotMatrixToEulerAngles(m) {
	var x = Math.atan2(m[7], m[8]);
	var y = Math.atan2(-m[6], Math.sqrt(m[7] * m[7] + m[8] * m[8]));
	var z = Math.atan2(m[3], m[0]);

	return [(x * 180) / Math.PI, (y * 180) / Math.PI, (z * 180) / Math.PI];
}
