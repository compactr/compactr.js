function Decoder(scope) {
	
	function boolean(bytes) {
		return !!bytes[0];
	}

	function number(bytes) {
		if (bytes.length === 1) return (!(bytes[0] & 0x80))?bytes[0]:((0xff - bytes[0] + 1) * -1);
		if (bytes.length === 2) {
			const val = bytes[0] | (bytes[1] << 8);
			return (val & 0x8000) ? val | 0xFFFF0000 : val;
		}
		return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | (bytes[3]);
	}

	function string(encoding, bytes) {
		let res = '';
		for (let i = 0; i < bytes.length; i += encoding) {
			res += String.fromCharCode(number(bytes.slice(i, i + encoding)));
		}
		return res;
	}

	function array(map, bytes) {
		return [];
	}

	function schema(map, bytes) {
		return {};
	}

	function double() {

	}

	return { 
		boolean,
		number,
		int8: number,
		int16: number,
		int32: number,
		double,
		string: string.bind(null, 2),
		char8: string.bind(null, 1),
		char16: string.bind(null, 2),
		char32: string.bind(null, 4),
		array, 
		schema 
	};
}

module.exports = Decoder;