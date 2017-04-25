/** Data writer component */

'use strict';

/* Requires ------------------------------------------------------------------*/

/* Methods -------------------------------------------------------------------*/

function Writer(scope) {

	function load(data) {
		clear();

		Object.keys(data)
			.filter(key => key in scope.schema)
			.forEach((key, i, arr) => {
				console.log(key, i, arr);
				if (i === 0) scope.mapBytes[0] = [arr.length];
				const encoded = scope.indices[key].transformIn(data[key]);
				scope.mapBytes = scope.mapBytes.concat([scope.indices[key].index], encoded[0]);
				scope.dataBytes = scope.dataBytes.concat(encoded[1]);
			});

		return this;
	}

	function clear() {
		scope.mapBytes = [];
		scope.dataBytes = [];
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