/** Benchmarks */

/* Requires ------------------------------------------------------------------*/

import Benchmark from 'benchmark';
import {schema} from '../dist/compactr.js';
import protobuf  from 'protobufjs';
import * as msgpack from '@msgpack/msgpack';
import {deferred} from './utils.ts';

/* Local variables -----------------------------------------------------------*/


let User = schema({
  id: { type: 'integer', format: 'int32'},
  str: { type: 'string' },
  special: { type: 'string' },
});

let root = protobuf.Root.fromJSON({
  nested: {
    StringBenchTest: {
      fields: {
        id: { type: 'uint32', id: 1 },
        str: { type: 'string', id: 2 },
        special: { type: 'string', id: 3 },
      },
    },
  },
});
var StringBenchTest = root.lookupType('StringBenchTest');

const sizes = { json: 0, compactr: 0, protobuf: 0, msgpack: 0 };

const stringSuite = new Benchmark.Suite();

/* String suite ---------------------------------------------------------------*/

export function init(mult) {
  const {promise, resolve} = deferred();

  stringSuite.add('[String] JSON', strJSON)
    .add('[String] Compactr', strCompactr)
    .add('[String] Protobuf', strProtobuf)
    .add('[String] MsgPack', strMsgPack)
    .on('cycle', e => console.log(String(e.target)))
    .run({ 'async': true })
    .on('complete', _ => resolve(sizes));


  function strJSON() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = Buffer.from(JSON.stringify({ id: i, str: '' + (Math.random()*0xffffff), special: String.fromCharCode(Math.random()*0xffff) }));
      unpacked = JSON.parse(packed.toString());
      if (packed.length > sizes.json) sizes.json = packed.length;
    }
  }

  function strCompactr() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = User.write({ id: i, str: '' + (Math.random()*0xffffff), special: String.fromCharCode(Math.random()*0xffff) }).buffer();
      unpacked = User.read(packed);
      if (packed.length > sizes.compactr) sizes.compactr = packed.length;
    }
  }

  function strProtobuf() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      let message = StringBenchTest.create({ id: i, str: '' + (Math.random()*0xffffff), special: String.fromCharCode(Math.random()*0xffff) });
      packed = StringBenchTest.encode(message).finish();
      unpacked = StringBenchTest.decode(packed);
      if (packed.length > sizes.protobuf) sizes.protobuf = packed.length;
    }
  }

  function strMsgPack() {
    let packed, unpacked;

    for(let i = 0; i<mult*mult; i++) {
      packed = msgpack.encode({ id: i, str: '' + (Math.random()*0xffffff), special: String.fromCharCode(Math.random()*0xffff) });
      unpacked = msgpack.decode(packed);
      if (packed.length > sizes.msgpack) sizes.msgpack = packed.length;
    }
  }

  return promise;
}
