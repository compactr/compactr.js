/** Benchmarks */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Benchmark = require('benchmark');
const Compactr = require('../');

/* Local variables -----------------------------------------------------------*/


let User = Compactr.schema({ 
  id: { type: 'int32', size: 4 }, 
  obj: { type: 'object', schema: { str: { type: 'string' } } }, 
});

const mult = 32;

const objectSuite = new Benchmark.Suite();

/* Float suite ---------------------------------------------------------------*/

objectSuite.add('[Object] JSON', objJSON)
.add('[Object] Compactr', objCompactr)
.on('cycle', e => console.log(String(e.target)))
.run({ 'async': true });


function objJSON() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = new Buffer(JSON.stringify({ id: i, obj: { str: '' + (Math.random()*0xffffff) } }));
    unpacked = JSON.parse(packed.toString());
  }
}

function objCompactr() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = User.write({ id: i, obj: { str: '' + (Math.random()*0xffffff) } }).array();
    unpacked = User.read(packed);
  }
}