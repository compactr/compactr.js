const Compactr = require('../../');

let Point = {
	x: 'number',
	y: 'number',
	z: 'number'
};

let User = { 
	user_id: 'number', 
	user_name: 'string', 
	x: 'number', 
	y: { 
		type: 'number', 
		defaultsTo: 0
	}, 
	z: 'number', 
	alive: 'boolean', 
	coords: { 
		type: 'json', 
		items: 'number' 
	}, 
	friends: { 
		type: 'json', 
		items: 'string' 
	},
	moods: {
		type: 'json',
		items: 'boolean'
	},
	last_point: {
		type: 'json',
		schema: Point
	},
	last_steps: {
		type: 'json',
		items: Point
	}
};

let packed;
let unpacked;
let encodeTime;
let time;
let mult = 512;

time = Date.now();

for(let i = 0; i<mult*mult; i++) {
	packed = Compactr.encode(User, { user_id: i, user_name: 'steve irwin', x: 32.5, y: 2000, z: 0, alive: false, coords: [0,1,2,272,3.6], friends: ['a', 'bb', 'ccc'], moods: [true, false], last_point: { x: 1.11, y: 2.22, z: 3.33}, last_steps: [{x: 4.44, y: 5.55, z: 6.66}, {x: 7.77, y: 8.88, z: 9.99}]});
}

encodeTime = Date.now() - time;

console.log('Compactr encode:', encodeTime);
// console.log(Array.prototype.slice.apply(packed));

time = Date.now();

for(let i = 0; i<mult*mult; i++) {
	packed = Compactr.encode(User, { user_id: i, user_name: 'steve irwin', x: 32.5, y: 2000, z: 0, alive: false, coords: [0,1,2,272,3.6], friends: ['a', 'bb', 'ccc'], moods: [true, false], last_point: { x: 1.11, y: 2.22, z: 3.33}, last_steps: [{x: 4.44, y: 5.55, z: 6.66}, {x: 7.77, y: 8.88, z: 9.99}]});
	unpacked = Compactr.decode(User, packed);
}

console.log('Compactr decode:', (Date.now() - time) - encodeTime);

console.log('Compactr size:', packed.length);
console.log(unpacked);

time = Date.now();

for(let i = 0; i<mult*mult; i++) {
	packed = new Buffer(JSON.stringify({user_id: i, user_name: 'steve irwin', x: 32.5, y: 2000, z: 0, alive: false, coords: [0,1,2,272,3.6], friends: ['a', 'bb', 'ccc'], moods: [true, false], last_point: { x: 1.11, y: 2.22, z: 3.33}, last_steps: [{x: 4.44, y: 5.55, z: 6.66}, {x: 7.77, y: 8.88, z: 9.99}]}));
}

encodeTime = Date.now() - time;

console.log('JSON encode:', encodeTime);
time = Date.now();

for(let i = 0; i<mult*mult; i++) {
	packed = new Buffer(JSON.stringify({user_id: i, user_name: 'steve irwin', x: 32.5, y: 2000, z: 0, alive: false, coords: [0,1,2,272,3.6], friends: ['a', 'bb', 'ccc'], moods: [true, false], last_point: { x: 1.11, y: 2.22, z: 3.33}, last_steps: [{x: 4.44, y: 5.55, z: 6.66}, {x: 7.77, y: 8.88, z: 9.99}]}));
	unpacked = JSON.parse(packed.toString());
}

console.log('JSON decode:', (Date.now() - time) - encodeTime);

console.log('JSON size:', packed.length);
