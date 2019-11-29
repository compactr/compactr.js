/** Benchmarks */

/* Requires ------------------------------------------------------------------*/

const Benchmark = require('benchmark');
const Compactr = require('../');
const protobuf = require('protobufjs');

/* Local variables -----------------------------------------------------------*/


let User = Compactr.schema({ 
  id: { type: 'int32', size: 4 }, 
  int: { type: 'int32', size: 8 },
});

const mult = 32;
const sizes = { json: 0, compactr: 0, protobuf: 0 };

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

/* Float suite ---------------------------------------------------------------*/

intSuite.add('[Integer] JSON', intJSON)
  .add('[Integer] Compactr', intCompactr)
  .add('[Integer] Protobuf', intProtobuf)
  .on('cycle', e => console.log(String(e.target)))
  .run({ 'async': true })
  .on('complete', _ => console.log(sizes));

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
    packed = User.write({ id: i, int: Math.round(Math.random() * 1000000) }).contentBuffer();
    unpacked = User.readContent(packed);
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