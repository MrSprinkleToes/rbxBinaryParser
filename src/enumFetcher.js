import apiDump from "./apiDump.json";

/**
 * Gets the enum's name from a property name and class name
 * @param {string} propName Property name
 * @param {string} className Class name
 * @returns
 */
function getEnumName(propName, className) {
	for (let i = 0; i < apiDump.Classes.length; i++) {
		if (apiDump.Classes[i].Name.toLowerCase() == className.toLowerCase()) {
			var members = apiDump.Classes[i].Members;
			for (let j = 0; j < members.length; j++) {
				var member = members[j];
				if (
					member.MemberType == "Property" &&
					member.Name.toLowerCase() == propName.toLowerCase() &&
					member.ValueType.Category == "Enum"
				) {
					return member.ValueType.Name;
				}
			}
			if (
				apiDump.Classes[i].Superclass &&
				apiDump.Classes[i].Superclass != "<<<ROOT>>>"
			) {
				return getEnumName(propName, apiDump.Classes[i].Superclass);
			}
		}
	}
}

/**
 * Gets the enum's name as a string from it's numerical value
 * @param {string} enumName Enum name
 * @param {number} value The numerical value of the enum
 * @returns
 */
function getEnumValue(enumName, value) {
	for (let i = 0; i < apiDump.Enums.length; i++) {
		var token = apiDump.Enums[i];
		if (token.Name.toLowerCase() == enumName.toLowerCase()) {
			for (let j = 0; j < token.Items.length; j++) {
				if (token.Items[j].Value == value) {
					return token.Items[j].Name;
				}
			}
		}
	}
}

export { getEnumName, getEnumValue };
