/** Benchmarks */

/* Requires ------------------------------------------------------------------*/

import Benchmark from 'benchmark';
import {schema} from '../dist/compactr.js';
import protobuf  from 'protobufjs';
import * as msgpack from '@msgpack/msgpack';
import {deferred} from './utils.ts';
import {randomUUID} from 'crypto';

/* Local variables -----------------------------------------------------------*/


let User = schema({
  id: { type: 'integer', format: 'int32'},
  uid: { type: 'string', format: 'uuid' },
});

let root = protobuf.Root.fromJSON({
  nested: {
    StringBenchTest: {
      fields: {
        id: { type: 'uint32', id: 1 },
        uid: { type: 'string', id: 2 },
      },
    },
  },
});
var StringBenchTest = root.lookupType('StringBenchTest');

const sizes = { json: 0, compactr: 0, protobuf: 0, msgpack: 0 };

const stringSuite = new Benchmark.Suite();

/* UUID suite ---------------------------------------------------------------*/

export function init(mult) {
  const {promise, resolve} = deferred();

  stringSuite.add('[UUID] JSON', strJSON)
    .add('[UUID] Compactr', strCompactr)
    .add('[UUID] Protobuf', strProtobuf)
    .add('[UUID] MsgPack', strMsgPack)
    .on('cycle', e => console.log(String(e.target)))
    .run({ 'async': true })
    .on('complete', _ => resolve(sizes));


  function strJSON() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = Buffer.from(JSON.stringify({ id: i, uid: randomUUID() }));
      unpacked = JSON.parse(packed.toString());
      if (packed.length > sizes.json) sizes.json = packed.length;
    }
  }

  function strCompactr() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = User.write({ id: i, uid: randomUUID() }).buffer();
      unpacked = User.read(packed);
      if (packed.length > sizes.compactr) sizes.compactr = packed.length;
    }
  }

  function strProtobuf() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      let message = StringBenchTest.create({ id: i, uid: randomUUID() });
      packed = StringBenchTest.encode(message).finish();
      unpacked = StringBenchTest.decode(packed);
      if (packed.length > sizes.protobuf) sizes.protobuf = packed.length;
    }
  }

  function strMsgPack() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = msgpack.encode({ id: i, uid: randomUUID() });
      unpacked = msgpack.decode(packed);
      if (packed.length > sizes.msgpack) sizes.msgpack = packed.length;
    }
  }

  return promise;
}
