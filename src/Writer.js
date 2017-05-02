/** Data writer component */

'use strict';

/* Requires ------------------------------------------------------------------*/

/* Methods -------------------------------------------------------------------*/

function Writer(scope) {

	function load(data) {
		clear();

		const keys = filterKeys(data);
		scope.mapBytes[0] = keys.length;
		for (let i = 0; i < keys.length; i++) {
			const encoded = scope.indices[keys[i]].transformIn(data[keys[i]]);
			splitBytes(encoded, keys[i]);
		}

		return this;
	}

	function splitBytes(encoded, key) {
		scope.mapBytes.push(scope.indices[key].index);
		scope.mapBytes.push.apply(scope.mapBytes, scope.indices[key].getSize(encoded.length));
		scope.dataBytes.push.apply(scope.dataBytes, encoded);
	}

	function clear() {
		scope.mapBytes = [];
		scope.dataBytes = [];
	}

	function filterKeys(data) {
		const res = [];
		for (let key in data) {
			if (scope.items.indexOf(key) !== -1) res.push(key);
		}
		return res;
	}

	function mapBuffer() {
		return Buffer.from(scope.mapBytes);
	}

	function dataBuffer() {
		return Buffer.from(scope.dataBytes);
	}

	function buffer() {
		return Buffer.from(scope.mapBytes.concat(scope.dataBytes));
	}

	function mapArray() {
		return scope.mapBytes;
	}

	function dataArray() {
		return scope.dataBytes;
	}

	function array() {
		return scope.mapBytes.concat(scope.dataBytes);
	}

	return { load, mapBuffer, mapArray, dataBuffer, dataArray, buffer, array };
}

module.exports = Writer;