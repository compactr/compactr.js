/** Benchmarks */

/* Requires ------------------------------------------------------------------*/

const Benchmark = require('benchmark');
const Compactr = require('../');
const protobuf = require('protobufjs');

/* Local variables -----------------------------------------------------------*/


let User = Compactr.schema({ 
  id: { type: 'int32', size: 4 }, 
  bool: { type: 'boolean' },
});

const mult = 32;
const sizes = { json: 0, compactr: 0, protobuf: 0 };

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

/* Float suite ---------------------------------------------------------------*/

boolSuite.add('[Boolean] JSON', boolJSON)
  .add('[Boolean] Compactr', boolCompactr)
  .add('[Boolean] Protobuf', boolProtobuf)
  .on('cycle', e => console.log(String(e.target)))
  .run({ 'async': true })
  .on('complete', _ => console.log(sizes));

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
    packed = User.write({ id: i, bool: !!Math.random() }).contentBuffer();
    unpacked = User.readContent(packed);
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