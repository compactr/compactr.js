function Decoder(scope) {
	
	const pow = Math.pow;
	const fromChar = String.fromCharCode;

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
		let res = [];
		for (let i = 0; i < bytes.length; i += encoding) {
			res.push(number(bytes.slice(i, i + encoding)));
		}
		return fromChar.apply(null, res);
	}

	function array(map, bytes) {
		return [];
	}

	function schema(map, bytes) {
		return {};
	}

	function double(bytes) {
		let s = bytes[0];
		let e = (s & 2047) * 256 + bytes[1];
		let m = e & 15;
		s >>= 7;
		e >>= 4;
		for (let i = 2; i <= 7; i++) {
			m = m * 256 + bytes[i];
		}
		if (e === 0) e = 1024;
		else if (e === 2047) return NaN;
		else {
			m += 4503599627370496;
			e -= 1023;
		}
		return (s ? -1 : 1) * m * pow(2, e - 52);
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