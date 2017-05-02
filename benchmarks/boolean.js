/** Benchmarks */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Benchmark = require('benchmark');
const Compactr = require('../');

/* Local variables -----------------------------------------------------------*/


let User = Compactr.schema({ 
	id: { type: 'int32', size: 4 }, 
	bool: { type: 'boolean' }
});

const mult = 32;

const boolSuite = new Benchmark.Suite();

/* Float suite ---------------------------------------------------------------*/

boolSuite.add('JSON', boolJSON)
.add('Compactr', boolCompactr)
.on('cycle', e => console.log(String(e.target)))
.on('complete', () => console.log('Fastest is ' + boolSuite.filter('fastest').map('name')))
.run({ 'async': true });

function boolJSON() {
	let packed, unpacked;

	for(let i = 0; i<mult*mult; i++) {
		packed = new Buffer(JSON.stringify({ id: i, bool: !!Math.random() }));
		unpacked = JSON.parse(packed.toString());
	}
}

function boolCompactr() {
	let packed, unpacked;

	for(let i = 0; i<mult*mult; i++) {
		packed = User.load({ id: i, bool: !!Math.random() }).array();
		unpacked = User.read(packed);
	}
}