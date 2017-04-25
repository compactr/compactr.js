/** Data writer component */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Decoder = require('./Decoder')();

/* Methods -------------------------------------------------------------------*/

function Reader(scope) {
	function read(bytes) {
		const ret = {};
		readMap(bytes);
		readData(bytes);

		scope.map.forEach((prop, i) => ret[prop.key.name] = scope.data[i]);
		return ret;
	}

	function readMap(bytes) {
		scope.map = [];
		let i = 0;
		let caret = 1;
		while(i < bytes[0]) {
			const key = getSchemaDef(bytes[caret]);
			caret++;

			scope.map.push({
				key,
				size: Decoder.number(bytes.slice(caret, caret + key.count))
			});
			caret += key.count;
			i++;
		}
		scope.map.dataBegins = caret;
		console.log(scope.map);

		return this;
	}

	function getSchemaDef(index) {
		return scope.indices[Object.keys(scope.indices)[index]];
	}

	function readData(bytes) {
		let caret = scope.map.dataBegins;
		scope.data = [];
		scope.map.forEach(prop => {
			scope.data.push(prop.key.transformOut(bytes.slice(caret, caret + prop.size)));
			caret += prop.size;
		});
	}

	return { read };
}

/* Exports -------------------------------------------------------------------*/

module.exports = Reader;