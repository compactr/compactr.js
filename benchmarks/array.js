/** Benchmarks */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Benchmark = require('benchmark');
const Compactr = require('../');

/* Local variables -----------------------------------------------------------*/


let User = Compactr.schema({
  id: { type: 'int32', size: 4 },
  arr: { type: 'array', size: 6, items: { type: 'char8', size: 1 }}
});

const mult = 32;
const arraySuite = new Benchmark.Suite();

/* Float suite ---------------------------------------------------------------*/

arraySuite.add('[Array] JSON', arrJSON)
.add('[Array] Compactr', arrCompactr)
.on('cycle', e => console.log(String(e.target)))
.run({ 'async': true });


function arrJSON() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = Buffer.from(JSON.stringify({ id: i, arr: ['a', 'b', 'c'] }));
    unpacked = JSON.parse(packed.toString());
  }
}

function arrCompactr() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = User.write({ id: i, arr: ['a', 'b', 'c'] }).contentBuffer();
    unpacked = User.readContent(packed);
  }
}