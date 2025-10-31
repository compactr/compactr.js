/** Benchmarks */

/* Requires ------------------------------------------------------------------*/

import Benchmark from 'benchmark';
import {schema} from '../dist/compactr.js';
import {deferred} from './utils.ts';

/* Local variables -----------------------------------------------------------*/


let User = schema({
  id: { type: 'integer', format: 'int32' },
  arr: { type: 'array', items: { type: 'string' }},
});

const mult = 32;
const sizes = { json: 0, compactr: 0 };

const arraySuite = new Benchmark.Suite();

/* Array suite ---------------------------------------------------------------*/

export function init() {
  const {promise, resolve} = deferred();

  arraySuite.add('[Array] JSON', arrJSON)
    .add('[Array] Compactr', arrCompactr)
    .on('cycle', e => console.log(String(e.target)))
    .run({ 'async': true })
    .on('complete', _ => resolve(sizes));

  function arrJSON() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = Buffer.from(JSON.stringify({ id: i, arr: ['a', 'b', 'c'] }));
      unpacked = JSON.parse(packed.toString());
      if (packed.length > sizes.json) sizes.json = packed.length;
    }
  }

  function arrCompactr() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = User.write({ id: i, arr: ['a', 'b', 'c'] }).contentBuffer();
      unpacked = User.readContent(packed);
      if (packed.length > sizes.compactr) sizes.compactr = packed.length;
    }
  }

  return promise;
}
