const Compactr = require('../');

let User = { user_id: 'number', user_name: 'string', x: 'number', y: { type: 'number', defaultsTo: 0}, z: 'number', alive: 'boolean'};
let packed;
let unpacked;
let encodeTime;
let time;
let mult = 512;

time = Date.now();

for(let i = 0; i<mult*mult; i++) {
	packed = Compactr.encode(User, { user_id: i, user_name: 'steve irwin', x: 32.5, y: 2000, z: 0, alive: false});
}

encodeTime = Date.now() - time;

console.log('Compactr encode:', encodeTime);
time = Date.now();

for(let i = 0; i<mult*mult; i++) {
	packed = Compactr.encode(User, { user_id: i, user_name: 'steve irwin', x: 32.5, y: 2000, z: 0, alive: false});
	unpacked = Compactr.decode(User, packed);
}

console.log('Compactr decode:', (Date.now() - time) - encodeTime);

console.log('Compactr size:', packed.length);

time = Date.now();

for(let i = 0; i<mult*mult; i++) {
	packed = new Buffer(JSON.stringify({user_id: i, user_name: 'steve irwin', x: 32.5, y: 2000, z: 0, alive: false}));
}

encodeTime = Date.now() - time;

console.log('JSON encode:', encodeTime);
time = Date.now();

for(let i = 0; i<mult*mult; i++) {
	packed = new Buffer(JSON.stringify({user_id: i, user_name: 'steve irwin', x: 32.5, y: 2000, z: 0, alive: false}));
	// console.log(i);
	unpacked = JSON.parse(packed.toString());
}

console.log('JSON decode:', (Date.now() - time) - encodeTime);

console.log('JSON size:', packed.length);
