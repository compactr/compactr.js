/** Benchmarks */

/* Requires ------------------------------------------------------------------*/

const Benchmark = require('benchmark');
const Compactr = require('../');
const protobuf = require('protobufjs');

/* Local variables -----------------------------------------------------------*/


let User = Compactr.schema({ 
  id: { type: 'int32', size: 4 }, 
  int: { type: 'double', size: 8 },
});

const mult = 32;
const sizes = { json: 0, compactr: 0, protobuf: 0 };

let root = protobuf.Root.fromJSON({
  nested: {
    DoubleBenchTest: {
      fields: {
        id: { type: 'uint32', id: 1 },
        int: { type: 'double', id: 2 },
      },
    },
  },
});
var DoubleBenchTest = root.lookupType('DoubleBenchTest');

const floatSuite = new Benchmark.Suite();

/* Float suite ---------------------------------------------------------------*/

floatSuite.add('[Float] JSON', floatJSON)
  .add('[Float] Compactr', floatCompactr)
  .add('[Float] Protobuf', floatProtobuf)
  .on('cycle', e => console.log(String(e.target)))
  .run({ 'async': true })
  .on('complete', _ => console.log(sizes));

function floatJSON() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = Buffer.from(JSON.stringify({ id: i, int: Math.random() }));
    unpacked = JSON.parse(packed.toString());
    if (packed.length > sizes.json) sizes.json = packed.length;
  }
}

function floatCompactr() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    packed = User.write({ id: i, int: Math.random() }).contentBuffer();
    unpacked = User.readContent(packed);
    if (packed.length > sizes.compactr) sizes.compactr = packed.length;
  }
}

function floatProtobuf() {
  let packed, unpacked;

  for(let i = 0; i<mult*mult; i++) {
    let message = DoubleBenchTest.create({ id: i, int: Math.random() });
    packed = DoubleBenchTest.encode(message).finish();
    unpacked = DoubleBenchTest.decode(packed);
    if (packed.length > sizes.protobuf) sizes.protobuf = packed.length;
  }
}