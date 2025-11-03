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
  id: { type: 'integer', format: 'int32' },
  obj: {
    type: 'object',
    properties: {
      str: { type: 'string' }
    },
  },
});

const sizes = { json: 0, compactr: 0, protobuf: 0, msgpack: 0 };

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

export function init(mult) {
  const {promise, resolve} = deferred();

  objectSuite.add('[Schema] JSON', objJSON)
    .add('[Schema] Compactr', objCompactr)
    .add('[Schema] Protobuf', objProtobuf)
    .add('[Schema] MsgPack', objMsgPack)
    .on('cycle', e => console.log(String(e.target)))
    .run({ 'async': true })
    .on('complete', _ => resolve(sizes));


  function objJSON() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = Buffer.from(JSON.stringify({ id: i, obj: { str: randomUUID() } }));
      unpacked = JSON.parse(packed.toString());
      if (packed.length > sizes.json) sizes.json = packed.length;
    }
  }

  function objCompactr() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = User.write({ id: i, obj: { str: randomUUID() } });
      unpacked = User.read(packed);
      if (packed.length > sizes.compactr) sizes.compactr = packed.length;
    }
  }

  function objProtobuf() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      let message = ObjectBenchTest.create({ id: i, obj: { str: randomUUID() } });
      packed = ObjectBenchTest.encode(message).finish();
      unpacked = ObjectBenchTest.decode(packed);
      if (packed.length > sizes.protobuf) sizes.protobuf = packed.length;
    }
  }

  function objMsgPack() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = msgpack.encode({ id: i, obj: { str: randomUUID() } });
      unpacked = msgpack.decode(packed);
      if (packed.length > sizes.msgpack) sizes.msgpack = packed.length;
    }
  }

  return promise;
}
