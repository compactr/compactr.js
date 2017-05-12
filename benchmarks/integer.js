/** Benchmarks */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Benchmark = require('benchmark');
const Compactr = require('../');

/* Local variables -----------------------------------------------------------*/


let User = Compactr.schema({ 
  id: { type: 'int32', size: 4 }, 
  str: { type: 'char8', size: 6 }, 
  int: { type: 'int32', size: 8 }
});

const mult = 32;

const intSuite = new Benchmark.Suite();

/* Float suite ---------------------------------------------------------------*/

intSuite.add('[Integer] JSON', intJSON)
.add('[Integer] JSON (negative)', negativeIntJSON)
.add('[Integer] Compactr', intCompactr)
.add('[Integer] Compactr (negative)', negativeIntCompactr)
.on('cycle', e => console.log(String(e.target)))
.run({ 'async': true });

function intJSON() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = new Buffer(JSON.stringify({ id: i, int: Math.round(Math.random() * 1000000) }));
    unpacked = JSON.parse(packed.toString());
  }
}

function intCompactr() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = User.write({ id: i, int: Math.round(Math.random() * 1000000) }).array();
    unpacked = User.read(packed);
  }
}

function negativeIntJSON() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = new Buffer(JSON.stringify({ id: i, int: Math.round(Math.random() * -1000000) }));
    unpacked = JSON.parse(packed.toString());
  }
}

function negativeIntCompactr() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = User.write({ id: i, int: Math.round(Math.random() * -1000000) }).array();
    unpacked = User.read(packed);
  }
}