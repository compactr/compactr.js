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
  int: { type: 'integer', format: 'int32' },
});

const sizes = { json: 0, compactr: 0, protobuf: 0, msgpack: 0 };

let root = protobuf.Root.fromJSON({
  nested: {
    IntBenchTest: {
      fields: {
        id: { type: 'uint32', id: 1 },
        int: { type: 'int32', id: 2 },
      },
    },
  },
});
var IntBenchTest = root.lookupType('IntBenchTest');

const intSuite = new Benchmark.Suite();

/* Integer suite ---------------------------------------------------------------*/

export function init(mult) {
  const {promise, resolve} = deferred();

  intSuite.add('[Integer] JSON', intJSON)
    .add('[Integer] Compactr', intCompactr)
    .add('[Integer] Protobuf', intProtobuf)
    .add('[Integer] MsgPack', intMsgPack)
    .on('cycle', e => console.log(String(e.target)))
    .run({ 'async': true })
    .on('complete', _ => resolve(sizes));

  function intJSON() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = Buffer.from(JSON.stringify({ id: i, int: Math.round(Math.random() * 1000000) }));
      unpacked = JSON.parse(packed.toString());
      if (packed.length > sizes.json) sizes.json = packed.length;
    }
  }

  function intCompactr() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = User.write({ id: i, int: Math.round(Math.random() * 1000000) }).buffer();
      unpacked = User.read(packed);
      if (packed.length > sizes.compactr) sizes.compactr = packed.length;
    }
  }

  function intProtobuf() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      let message = IntBenchTest.create({ id: i, int: Math.round(Math.random() * 1000000) });
      packed = IntBenchTest.encode(message).finish();
      unpacked = IntBenchTest.decode(packed);
      if (packed.length > sizes.protobuf) sizes.protobuf = packed.length;
    }
  }

  function intMsgPack() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = msgpack.encode({ id: i, int: Math.round(Math.random() * 1000000) });
      unpacked = msgpack.decode(packed);
      if (packed.length > sizes.msgpack) sizes.msgpack = packed.length;
    }
  }

  return promise;
}
