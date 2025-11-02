/** Benchmarks */

/* Requires ------------------------------------------------------------------*/

import Benchmark from 'benchmark';
import {schema} from '../dist/compactr.js';
import protobuf  from 'protobufjs';
import {deferred} from './utils.ts';
import {randomUUID} from 'crypto';

/* Local variables -----------------------------------------------------------*/

function generateIPDigit() {
  return Math.floor(Math.random() * 255);
}

let User = schema({
  id: { type: 'string', format: 'uuid' },
  name: { type: 'string' },
  age: { type: 'integer', format: 'int32' },
  last_connected_ip: { type: 'string', format: 'ipv4' },
  date_created: { type: 'string', format: 'date-time' },
  date_updated: { type: 'string', format: 'date-time' },
  user_settings: {
    type: 'object',
    properties: {
      flag_a: { type: 'boolean' },
      flag_b: { type: 'boolean' },
      flag_c: { type: 'boolean' },
    }
  },
  user_friends: {
    type: 'array',
    items: { type: 'string', format: 'uuid' }
  }
});

const sizes = { json: 0, compactr: 0, protobuf: 0 };

let root = protobuf.Root.fromJSON({
  nested: {
    SettingsBenchTest: {
      fields: {
        flag_a: { type: 'bool', id: 1 },
        flag_b: { type: 'bool', id: 2 },
        flag_c: { type: 'bool', id: 3 },
      },
    },
    JsonAPIBenchTest: {
      fields: {
        id: { type: 'string', id: 1 },
        name: { type: 'string', id: 2},
        age: { type: 'int32', id: 3 },
        last_connected_ip: { type: 'string', id: 4},
        date_created: { type: 'string', id: 5 },
        date_updated: { type: 'string', id: 6 },
        user_settings: { type: 'SettingsBenchTest', id: 7},
        user_friends: { rule: 'repeated', type: 'string', id: 8 }
      },
    },
  },
});
var ObjectBenchTest = root.lookupType('JsonAPIBenchTest');

const objectSuite = new Benchmark.Suite();

/* JSON-API Reponse suite ---------------------------------------------------------------*/

export function init(mult) {
    const {promise, resolve} = deferred();

  objectSuite.add('[JSON-API Reponse] JSON', objJSON)
    .add('[JSON-API Reponse] Compactr', objCompactr)
    .add('[JSON-API Reponse] Protobuf', objProtobuf)
    .on('cycle', e => console.log(String(e.target)))
    .run({ 'async': true })
    .on('complete', _ => resolve(sizes));


  function objJSON() {
    let packed, unpacked;
    let now = (new Date()).toISOString();

    for(let i = 0; i<mult*mult; i++) {
      packed = Buffer.from(JSON.stringify({
        id: randomUUID(),
        name: `john-${i}`,
        age: i*2+1,
        last_connected_ip: `${generateIPDigit()}.${generateIPDigit()}.${generateIPDigit()}.${generateIPDigit()}`,
        date_created: now,
        date_updated: now,
        user_settings: {
            flag_a: true,
            flag_b: false,
            flag_c: false,
        },
        user_friends: []
      }));
      unpacked = JSON.parse(packed.toString());
      if (packed.length > sizes.json) sizes.json = packed.length;
    }
  }

  function objCompactr() {
    let packed, unpacked;
    let now = (new Date()).toISOString();

    for(let i = 0; i<mult*mult; i++) {
      packed = User.write({
          id: randomUUID(),
          name: `john-${i}`,
          age: i*2+1,
          last_connected_ip: `${generateIPDigit()}.${generateIPDigit()}.${generateIPDigit()}.${generateIPDigit()}`,
          date_created: now,
          date_updated: now,
          user_settings: {
              flag_a: true,
              flag_b: false,
              flag_c: false,
          },
          user_friends: []
      }).buffer();
      unpacked = User.read(packed);
      if (packed.length > sizes.compactr) sizes.compactr = packed.length;
    }
  }

  function objProtobuf() {
    let packed, unpacked;
    let now = (new Date()).toISOString();

    for(let i = 0; i<mult*mult; i++) {
      let message = ObjectBenchTest.create({
        id: randomUUID(),
        name: `john-${i}`,
        age: i*2+1,
        last_connected_ip: `${generateIPDigit()}.${generateIPDigit()}.${generateIPDigit()}.${generateIPDigit()}`,
        date_created: now,
        date_updated: now,
        user_settings: {
            flag_a: true,
            flag_b: false,
            flag_c: false,
        },
        user_friends: []
      });
      packed = ObjectBenchTest.encode(message).finish();
      unpacked = ObjectBenchTest.decode(packed);
      if (packed.length > sizes.protobuf) sizes.protobuf = packed.length;
    }
  }

  return promise;
}
