const Compactr = require('../');

let User = { user_id: 'number', user_name: 'string', x: 'number', y: { type: 'number', defaultsTo: 0}, z: 'number', alive: 'boolean'};
let packed = Compactr.encode(User, { user_id: 255, user_name: 'steve', x: 32, y: 2000, z: 0, alive: false});
console.log(packed);
console.log(packed.length, 'bytes');
console.log(packed.toString());

let unpacked = Compactr.decode(User, packed);
console.log('UNPACKED', unpacked);