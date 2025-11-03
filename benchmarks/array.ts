/** Benchmarks */

/* Requires ------------------------------------------------------------------*/

import Benchmark from 'benchmark';
import {schema} from '../dist/compactr.js';
import protobuf  from 'protobufjs';
import * as msgpack from '@msgpack/msgpack';
import {deferred} from './utils.ts';

/* Local variables -----------------------------------------------------------*/


let User = schema({
  id: { type: 'integer', format: 'int32' },
  arr: { type: 'array', items: { type: 'string' }},
});

let root = protobuf.Root.fromJSON({
  nested: {
    ArrayBenchTest: {
      fields: {
        id: { type: 'uint32', id: 1 },
        arr: { rule: 'repeated', type: 'string', id: 2 },
      },
    },
  },
});
var ArrayBenchTest = root.lookupType('ArrayBenchTest');

const sizes = { json: 0, compactr: 0, protobuf: 0, msgpack: 0 };

const arraySuite = new Benchmark.Suite();

/* Array suite ---------------------------------------------------------------*/

export function init(mult) {
  const {promise, resolve} = deferred();

  arraySuite.add('[Array] JSON', arrJSON)
    .add('[Array] Compactr', arrCompactr)
    .add('[Array] Protobuf', arrProtobuf)
    .add('[Array] MsgPack', arrMsgPack)
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
      packed = User.write({ id: i, arr: ['a', 'b', 'c'] }).buffer();
      unpacked = User.read(packed);
      if (packed.length > sizes.compactr) sizes.compactr = packed.length;
    }
  }

  function arrProtobuf() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      let message = ArrayBenchTest.create({ id: i, arr: ['a', 'b', 'c'] });
      packed = ArrayBenchTest.encode(message).finish();
      unpacked = ArrayBenchTest.decode(packed);
      if (packed.length > sizes.protobuf) sizes.protobuf = packed.length;
    }
  }

  function arrMsgPack() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = msgpack.encode({ id: i, arr: ['a', 'b', 'c'] });
      unpacked = msgpack.decode(packed);
      if (packed.length > sizes.msgpack) sizes.msgpack = packed.length;
    }
  }

  return promise;
}
