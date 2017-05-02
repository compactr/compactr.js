/** Benchmarks */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Benchmark = require('benchmark');
const Compactr = require('../');

/* Local variables -----------------------------------------------------------*/


let User = Compactr.schema({ 
	id: { type: 'int32', size: 4 }, 
	str: { type: 'char8', size: 6 }, 
	int: { type: 'double', size: 8 }
});

const mult = 32;

const stringSuite = new Benchmark.Suite();

/* Float suite ---------------------------------------------------------------*/

stringSuite.add('JSON', strJSON)
.add('Compactr', strCompactr)
.on('cycle', e => console.log(String(e.target)))
.on('complete', () => console.log('Fastest is ' + stringSuite.filter('fastest').map('name')))
.run({ 'async': true });


function strJSON() {
	let packed, unpacked;

	for(let i = 0; i<mult*mult; i++) {
		packed = new Buffer(JSON.stringify({ id: i, str: '' + (Math.random()*0xffffff) }));
		unpacked = JSON.parse(packed.toString());
	}
}

function strCompactr() {
	let packed, unpacked;

	for(let i = 0; i<mult*mult; i++) {
		packed = User.load({ id: i, str: '' + (Math.random()*0xffffff) }).array();
		unpacked = User.read(packed);
	}
}