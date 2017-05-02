/** Data writer component */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Decoder = require('./Decoder')();

/* Methods -------------------------------------------------------------------*/

function Reader(scope) {
	function read(bytes) {
		readMap(bytes);
		return readData(bytes);
	}

	function readMap(bytes) {
		scope.map = [];
		let caret = 1;
		const keys = bytes[0];
		for (let i = 0; i < keys; i++) {
			caret = readKey(bytes, caret);
		}
		scope.map.dataBegins = caret;

		return this;
	}

	function readKey(bytes, caret) {
		const key = getSchemaDef(bytes[caret]);
		caret++;

		scope.map.push({
			key,
			size: key.size || Decoder.number(bytes.slice(caret, caret + key.count))
		});
		return caret + key.count;
	}

	function getSchemaDef(index) {
		return scope.indices[scope.items[index]];
	}

	function readData(bytes) {
		let caret = scope.map.dataBegins;
		const ret = {};
		scope.map.forEach(prop => {
			ret[prop.key.name] = prop.key.transformOut(bytes.slice(caret, caret + prop.size));
			caret += prop.size;
		});
		return ret;
	}

	return { read, readMap, readData };
}

/* Exports -------------------------------------------------------------------*/

module.exports = Reader;