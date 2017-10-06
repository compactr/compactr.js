const Compactr = require('../');

let User = Compactr.schema({ 
	id: { type: 'int32' }, 
	str: { type: 'char8' }, 
	int: { type: 'double' },
	obj: { type: 'object', schema: { 
		int: { type: 'double' }}
	},
	arr: { type: 'array', items: { type: 'string' }}
}, { keyOrder: true });

const str_test = 'abcdef';
const int_test = 97.5;

let packed;
let unpacked;
let encodeTime;
let time;
let mult = 512;
const coerse = false;

function schemaTest() {
	let TestUser;
	time = Date.now();

	for(let i = 0; i < mult * mult; i++) {
		TestUser = Compactr.schema({ 
			id: { type: 'int32' }, 
			str: { type: 'char8' }, 
			int: { type: 'double' },
			obj: { type: 'object', schema: { 
				int: { type: 'double' }}
			},
			arr: { type: 'array', items: { type: 'string' }}
		});
	}

	console.log('schema generation:', (Date.now() - time));
}

function strJSON() {
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = Buffer.from(JSON.stringify({ id: i, str: str_test }));
	}

	encodeTime = Date.now() - time;

	console.log('str-json encode:', encodeTime);
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = Buffer.from(JSON.stringify({ id: i, str: str_test }));
		unpacked = JSON.parse(packed.toString());
	}

	console.log('str-json decode:', (Date.now() - time) - encodeTime);
	console.log('str-json size:', packed.length);
}

function strCompactr() {
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = User.write({ id: i, str: str_test }, { coerse }).buffer();
	}

	encodeTime = Date.now() - time;

	console.log('str encode:', encodeTime);
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = User.write({ str: str_test, id: i }, { coerse }).buffer();
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
		packed = Buffer.from(JSON.stringify({ id: i, int: int_test }));
		unpacked = JSON.parse(packed.toString());
	}

	console.log('int-json decode:', (Date.now() - time) - encodeTime);
	console.log('int-json size:', packed.length);
}

function intCompactr() {
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = User.write({ id: i, int: int_test }, { coerse }).buffer();
	}

	encodeTime = Date.now() - time;

	console.log('int encode:', encodeTime);
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = User.write({ int: int_test, id: i }, { coerse }).buffer();
		unpacked = User.read(packed);
	}

	console.log('int decode:', (Date.now() - time) - encodeTime);
	console.log('assert:', (JSON.stringify({ id: mult*mult-1, int: int_test }) === JSON.stringify(unpacked)));
	console.log('diff:', JSON.stringify({ id: mult*mult-1, int: int_test }), JSON.stringify(unpacked));

	console.log('int size:', packed.length);
}

//strJSON();
strCompactr();
//intJSON();
intCompactr();

function objJSON() {
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = Buffer.from(JSON.stringify({ id: i, obj: { int: int_test } }));
	}

	encodeTime = Date.now() - time;

	console.log('obj-json encode:', encodeTime);
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = Buffer.from(JSON.stringify({ id: i, obj: { int: int_test } }));
		unpacked = JSON.parse(packed.toString());
	}

	console.log('obj-json decode:', (Date.now() - time) - encodeTime);
	console.log('obj-json size:', packed.length);
}

function objCompactr() {
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = User.write({ id: i, obj: { int: int_test } }).buffer();
	}

	encodeTime = Date.now() - time;

	console.log('obj encode:', encodeTime);
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = User.write({ id: i, obj: { int: int_test } }).buffer();
		unpacked = User.read(packed);
	}

	console.log('obj decode:', (Date.now() - time) - encodeTime);
	console.log('assert:', (JSON.stringify({ id: mult*mult-1, obj: { int: int_test } }) === JSON.stringify(unpacked)));
	console.log('diff:', JSON.stringify({ id: mult*mult-1, obj: { int: int_test } }), JSON.stringify(unpacked));

	console.log('obj size:', packed.length);
}

//objJSON()
objCompactr();

function arrJSON() {
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = Buffer.from(JSON.stringify({ id: i, arr: ['a', 'b', 'c'] }));
	}

	encodeTime = Date.now() - time;

	console.log('arr-json encode:', encodeTime);
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = Buffer.from(JSON.stringify({ id: i, arr: ['a', 'b', 'c'] }));
		unpacked = JSON.parse(packed.toString());
	}

	console.log('arr-json decode:', (Date.now() - time) - encodeTime);
	console.log('arr-json size:', packed.length);
}

function arrCompactr() {
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = User.write({ id: i, arr: ['a', 'b', 'c'] }).buffer();
	}

	encodeTime = Date.now() - time;

	console.log('arr encode:', encodeTime);
	time = Date.now();

	for(let i = 0; i<mult*mult; i++) {
		packed = User.write({ id: i, arr: ['a', 'b', 'c'] }).buffer();
		unpacked = User.read(packed);
	}

	console.log('arr decode:', (Date.now() - time) - encodeTime);
	console.log('assert:', (JSON.stringify({ id: mult*mult-1, arr: ['a', 'b', 'c'] }) === JSON.stringify(unpacked)));
	console.log('diff:', JSON.stringify({ id: mult*mult-1, arr: ['a', 'b', 'c'] }), JSON.stringify(unpacked));

	console.log('arr size:', packed.length);
}

//arrJSON()
arrCompactr();
//schemaTest()