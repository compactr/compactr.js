const Compactr = require('../');

let User = Compactr.schema({ 
	id: { type: 'int32', size: 4 }, 
	str: { type: 'char8', size: 6 }, 
	int: { type: 'double', size: 8 }
});

const str_test = 'abcdef';
const int_test = 97.5;

let packed;
let unpacked;
let encodeTime;
let time;
let mult = 512;

function strJSON() {
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = new Buffer(JSON.stringify({ id: i, str: str_test }));
	}

	encodeTime = Date.now() - time;

	console.log('str-json encode:', encodeTime);
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = new Buffer(JSON.stringify({ id: i, str: str_test }));
		unpacked = JSON.parse(packed.toString());
	}

	console.log('str-json decode:', (Date.now() - time) - encodeTime);
	console.log('str-json size:', packed.length);
}

function strCompactr() {
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = User.load({ id: i, str: str_test }).array();
	}

	encodeTime = Date.now() - time;

	console.log('str encode:', encodeTime);
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = User.load({ id: i, str: str_test }).array();
		unpacked = User.read(packed);
	}

	console.log('str decode:', (Date.now() - time) - encodeTime);
	console.log('assert:', (JSON.stringify({ id: mult*mult-1, str: str_test }) === JSON.stringify(unpacked)));
	console.log('diff:', JSON.stringify({ id: mult*mult-1, str: str_test }), JSON.stringify(unpacked));

	console.log('str size:', packed.length);
}

function intJSON() {
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = new Buffer(JSON.stringify({ id: i, int: int_test }));
	}

	encodeTime = Date.now() - time;

	console.log('int-json encode:', encodeTime);
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = new Buffer(JSON.stringify({ id: i, int: int_test }));
		unpacked = JSON.parse(packed.toString());
	}

	console.log('int-json decode:', (Date.now() - time) - encodeTime);
	console.log('int-json size:', packed.length);
}

function intCompactr() {
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = User.load({ id: i, int: int_test }).array();
	}

	encodeTime = Date.now() - time;

	console.log('int encode:', encodeTime);
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = User.load({ id: i, int: int_test }).array();
		unpacked = User.read(packed);
	}

	console.log('int decode:', (Date.now() - time) - encodeTime);
	console.log('assert:', (JSON.stringify({ id: mult*mult-1, int: int_test }) === JSON.stringify(unpacked)));
	console.log('diff:', JSON.stringify({ id: mult*mult-1, int: int_test }), JSON.stringify(unpacked));

	console.log('int size:', packed.length);
}

strJSON();
strCompactr();
intJSON();
intCompactr();