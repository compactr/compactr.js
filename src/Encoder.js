/** Data encoding component */

'use strict';

/* Requires ------------------------------------------------------------------*/

/* Methods -------------------------------------------------------------------*/

function Encoder(scope) {
	
	function boolean(val) {
		return [[1], [val ? 1 : 0]];
	}

	function number(encoding, val) {
		if (val < 0) val = Math.pow(0xff, encoding) + val + 1;
		return [[encoding], [val >>> 24, val >>> 16, val >>> 8, val & 0xff].slice(4 - encoding)];
	}

	function string(encoding, val) {
		const chars = val.split('')
			.map(char => number(encoding, char.charCodeAt(0)))
			.reduce((acc, curr) => {
				acc = acc.concat(curr[1]);
				return acc;
			}, []);
		return [number(2, encoding * val.length), chars];
	}

	function array(map, val) {
		return [[1],];
	}

	function schema(map, val) {
		return [[1],];
	}

	function double(val) {
		return [[8], ];
	}

	return { 
		boolean,
		number: double.bind(null, 8),
		int8: number.bind(null, 1),
		int16: number.bind(null, 2),
		int32: number.bind(null, 4),
		double: double.bind(null, 8),
		string: string.bind(null, 2),
		char8: string.bind(null, 1),
		char16: string.bind(null, 2),
		char32: string.bind(null, 4),
		array,
		schema
	};
}

/* Exports -------------------------------------------------------------------*/

module.exports = Encoder;