const Compactr = require('../');

let User = { id: 'number', str: 'string', int: 'number' };

const str_test = 'abcdef';
const int_test = 97.5;

let packed;
let unpacked;
let encodeTime;
let time;
let mult = 512;

time = Date.now();

for(let i = 0; i<mult*mult; i++) {
	packed = Compactr.encode(User, { id: i, str: str_test });
}

encodeTime = Date.now() - time;

console.log('str encode:', encodeTime);
time = Date.now();

for(let i = 0; i<mult*mult; i++) {
	packed = Compactr.encode(User, { id: i, str: str_test });
	unpacked = Compactr.decode(User, packed);
}

console.log('str decode:', (Date.now() - time) - encodeTime);

console.log('str size:', packed.length);

time = Date.now();

for(let i = 0; i<mult*mult; i++) {
	packed = Compactr.encode(User, { id: i, int: int_test });
}

encodeTime = Date.now() - time;

console.log('int encode:', encodeTime);
time = Date.now();

for(let i = 0; i<mult*mult; i++) {
	packed = Compactr.encode(User, { id: i, int: int_test });
	// console.log(i);
	unpacked = Compactr.decode(User, packed);
}

console.log('int decode:', (Date.now() - time) - encodeTime);

console.log('int size:', packed.length);
