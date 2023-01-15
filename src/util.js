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
