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
  bool: { type: 'boolean' },
});

const sizes = { json: 0, compactr: 0, protobuf: 0, msgpack: 0 };

let root = protobuf.Root.fromJSON({
  nested: {
    BoolBenchTest: {
      fields: {
        id: { type: 'uint32', id: 1 },
        bool: { type: 'bool', id: 2 },
      },
    },
  },
});
var BoolBenchTest = root.lookupType('BoolBenchTest');

const boolSuite = new Benchmark.Suite();

/* Boolean suite ---------------------------------------------------------------*/

export function init(mult) {
  const {promise, resolve} = deferred();

  boolSuite.add('[Boolean] JSON', boolJSON)
    .add('[Boolean] Compactr', boolCompactr)
    .add('[Boolean] Protobuf', boolProtobuf)
    .add('[Boolean] MsgPack', boolMsgPack)
    .on('cycle', e => console.log(String(e.target)))
    .run({ 'async': true })
    .on('complete', _ => resolve(sizes));

  function boolJSON(e) {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = Buffer.from(JSON.stringify({ id: i, bool: !!Math.random() }));
      unpacked = JSON.parse(packed.toString());
      if (packed.length > sizes.json) sizes.json = packed.length;
    }
  }

  function boolCompactr() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = User.write({ id: i, bool: !!Math.random() }).buffer();
      unpacked = User.read(packed);
      if (packed.length > sizes.compactr) sizes.compactr = packed.length;
    }
  }

  function boolProtobuf() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      let message = BoolBenchTest.create({ id: i, bool: !!Math.random() });
      packed = BoolBenchTest.encode(message).finish();
      unpacked = BoolBenchTest.decode(packed);
      if (packed.length > sizes.protobuf) sizes.protobuf = packed.length;
    }
  }

  function boolMsgPack() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = msgpack.encode({ id: i, bool: !!Math.random() });
      unpacked = msgpack.decode(packed);
      if (packed.length > sizes.msgpack) sizes.msgpack = packed.length;
    }
  }

  return promise;
}
