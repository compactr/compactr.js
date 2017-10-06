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
.add('[String] Compactr', strCompactr)
.on('cycle', e => console.log(String(e.target)))
.run({ 'async': true });


function strJSON() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = Buffer.from(JSON.stringify({ id: i, str: '' + (Math.random()*0xffffff), special: String.fromCharCode(Math.random()*0xffff) }));
    unpacked = JSON.parse(packed.toString());
  }
}

function strCompactr() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = User.write({ id: i, str: '' + (Math.random()*0xffffff), special: String.fromCharCode(Math.random()*0xffff) }).contentBuffer();
    unpacked = User.readContent(packed);
  }
}