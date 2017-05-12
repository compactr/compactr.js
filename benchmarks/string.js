/** Benchmarks */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Benchmark = require('benchmark');
const Compactr = require('../');

/* Local variables -----------------------------------------------------------*/


let User = Compactr.schema({ 
  id: { type: 'int32', size: 4 }, 
  str: { type: 'char8', size: 6 }, 
  special: { type: 'char32', size: 4 }
});

const mult = 32;

const stringSuite = new Benchmark.Suite();

/* Float suite ---------------------------------------------------------------*/

stringSuite.add('[String] JSON', strJSON)
.add('[String] JSON special characters', strSpecialJSON)
.add('[String] Compactr', strCompactr)
.add('[String] Compactr special characters', strSpecialCompactr)
.on('cycle', e => console.log(String(e.target)))
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
    packed = User.write({ id: i, str: '' + (Math.random()*0xffffff) }).array();
    unpacked = User.read(packed);
  }
}

function strSpecialJSON() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = new Buffer(JSON.stringify({ id: i, special: String.fromCharCode(Math.random()*0xffff) }));
    unpacked = JSON.parse(packed.toString());
  }
}

function strSpecialCompactr() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = User.write({ id: i, special: String.fromCharCode(Math.random()*0xffff) }).array();
    unpacked = User.read(packed);
  }
}