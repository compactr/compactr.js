/** Benchmarks */

/* Requires ------------------------------------------------------------------*/

const Benchmark = require('benchmark');
const Compactr = require('../');
const protobuf = require('protobufjs');

/* Local variables -----------------------------------------------------------*/


let User = Compactr.schema({ 
  id: { type: 'int32', size: 4 }, 
  str: { type: 'char8', size: 6 }, 
  special: { type: 'char32', size: 4 },
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

const mult = 32;
const sizes = { json: 0, compactr: 0, protobuf: 0 };

const stringSuite = new Benchmark.Suite();

/* Float suite ---------------------------------------------------------------*/

stringSuite.add('[String] JSON', strJSON)
  .add('[String] Compactr', strCompactr)
  .add('[String] Protobuf', strProtobuf)
  .on('cycle', e => console.log(String(e.target)))
  .run({ 'async': true })
  .on('complete', _ => console.log(sizes));


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
    packed = User.write({ id: i, str: '' + (Math.random()*0xffffff), special: String.fromCharCode(Math.random()*0xffff) }).contentBuffer();
    unpacked = User.readContent(packed);
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