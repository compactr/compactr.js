/** Benchmarks */

/* Requires ------------------------------------------------------------------*/

import Benchmark from 'benchmark';
import {schema} from '../dist/compactr.js';
import protobuf  from 'protobufjs';
import {deferred} from './utils.ts';

/* Local variables -----------------------------------------------------------*/


let User = schema({ 
  id: { type: 'int32' }, 
  obj: {
    type: 'object',
    properties: {
      str: { type: 'string' }
    },
  }, 
});

const mult = 32;
const sizes = { json: 0, compactr: 0, protobuf: 0 };

let root = protobuf.Root.fromJSON({
  nested: {
    StringBenchTest: {
      fields: {
        str: { type: 'string', id: 2 },
      },
    },
    ObjectBenchTest: {
      fields: {
        id: { type: 'uint32', id: 1 },
        obj: { type: 'StringBenchTest', id: 2},
      },
    },
  },
});
var ObjectBenchTest = root.lookupType('ObjectBenchTest');

const objectSuite = new Benchmark.Suite();

/* Schema suite ---------------------------------------------------------------*/

export function init() {
  const {promise, resolve} = deferred();

  objectSuite.add('[Schema] JSON', objJSON)
    .add('[Schema] Compactr', objCompactr)
    .add('[Schema] Protobuf', objProtobuf)
    .on('cycle', e => console.log(String(e.target)))
    .run({ 'async': true })
    .on('complete', _ => resolve(sizes));


  function objJSON() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = Buffer.from(JSON.stringify({ id: i, obj: { str: '' + (Math.random()*0xffffff) } }));
      unpacked = JSON.parse(packed.toString());
      if (packed.length > sizes.json) sizes.json = packed.length;
    }
  }

  function objCompactr() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = User.write({ id: i, obj: { str: '' + (Math.random()*0xffffff) } }).contentBuffer();
      unpacked = User.readContent(packed);
      if (packed.length > sizes.compactr) sizes.compactr = packed.length;
    }
  }

  function objProtobuf() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      let message = ObjectBenchTest.create({ id: i, obj: { str: '' + (Math.random()*0xffffff) } });
      packed = ObjectBenchTest.encode(message).finish();
      unpacked = ObjectBenchTest.decode(packed);
      if (packed.length > sizes.protobuf) sizes.protobuf = packed.length;
    }
  }

  return promise;
}
