/** Benchmarks */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Benchmark = require('benchmark');
const Compactr = require('../');

/* Local variables -----------------------------------------------------------*/


let User = Compactr.schema({ 
  id: { type: 'int32', size: 4 }, 
  bool: { type: 'boolean' },
});

const mult = 32;

const boolSuite = new Benchmark.Suite();

/* Float suite ---------------------------------------------------------------*/

boolSuite.add('[Boolean] JSON', boolJSON)
  .add('[Boolean] Compactr', boolCompactr)
  .on('cycle', e => console.log(String(e.target)))
  .run({ 'async': true });

function boolJSON() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = Buffer.from(JSON.stringify({ id: i, bool: !!Math.random() }));
    unpacked = JSON.parse(packed.toString());
  }
}

function boolCompactr() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = User.write({ id: i, bool: !!Math.random() }).contentBuffer();
    unpacked = User.readContent(packed);
  }
}