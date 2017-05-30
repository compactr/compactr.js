<h1 align="center">
  <a title="Schema based serialization made easy" href="http://compactr.js.org">
    <img alt="Compactr" width="320px" src="http://res.cloudinary.com/kalm/image/upload/v1494589244/compactr_header_rev1.png" />
    <br/><br/>
  </a>
  Compactr
</h1>
<h3 align="center">
  Schema based serialization made easy
  <br/><br/><br/>
</h3>
<br/>

[![Compactr](https://img.shields.io/npm/v/compactr.svg)](https://www.npmjs.com/package/compactr)
[![Node](https://img.shields.io/badge/node->%3D4.0-blue.svg)](https://nodejs.org)
[![Build Status](https://travis-ci.org/compactr/compactr.js.svg?branch=master)](https://travis-ci.org/compactr/compactr.js)
[![Gitter](https://img.shields.io/gitter/room/compactr/compactr.svg)](https://gitter.im/compactr/compactr)

---

## What is this and why does it matter?

Protocol Buffers are awesome. Having schemas to deflate and inflate data while maintaining some kind of validation is a great concept. Compactr's goal is to build on that to better suit Node development and reduce repetition by allowing you to build schemas for your data directly in your scripting language. For example, if you have a DB schema for a model, you could use that directly as a schema for Compactr.


## Install

```
    npm install compactr
```


## Implementation

```node

const Compactr = require('compactr');

// Defining a schema
const userSchema = Compactr.schema({ 
	id: { type: 'number' },
	name: { type: 'string' }
});



// Encoding
userSchema.write({ id: 123, name: 'John' });

// Get the schema header bytes (for partial loads)
const header = userSchema.headerBytes();

// Get the partial load bytes
const partial = userSchema.contentBytes();

// Get the full header + content bytes
const buffer = userSchema.bytes();




// Decoding (full)
const content = userSchema.read(buffer);

// Decoding (partial)
const content = userSchema.readContent(partial);
```


## Performances

```
[Array] JSON x 138 ops/sec ±8.72% (57 runs sampled)
[Array] Compactr x 112 ops/sec ±9.39% (46 runs sampled)

[Boolean] JSON x 223 ops/sec ±6.41% (69 runs sampled)
[Boolean] Compactr x 357 ops/sec ±6.14% (71 runs sampled)

[Float] JSON x 151 ops/sec ±3.15% (75 runs sampled)
[Float] Compactr x 253 ops/sec ±2.85% (71 runs sampled)

[Integer] JSON x 216 ops/sec ±3.75% (71 runs sampled)
[Integer] JSON (negative) x 204 ops/sec ±5.35% (65 runs sampled)
[Integer] Compactr x 401 ops/sec ±5.21% (69 runs sampled)
[Integer] Compactr (negative) x 406 ops/sec ±3.26% (74 runs sampled)

[Object] JSON x 123 ops/sec ±4.30% (69 runs sampled)
[Object] Compactr x 96.77 ops/sec ±2.12% (67 runs sampled)

[String] JSON x 136 ops/sec ±4.70% (68 runs sampled)
[String] JSON special characters x 180 ops/sec ±1.04% (77 runs sampled)
[String] Compactr x 176 ops/sec ±2.03% (76 runs sampled)
[String] Compactr special characters x 360 ops/sec ±1.59% (84 runs sampled)
```


## Size comparison

JSON: `{"id":123,"name":"John"}`: 24 bytes 

Compactr (full): `<Buffer 02 00 01 01 04 7b 4a 6f 68 6e>`: 10 bytes

Compactr (partial): `<Buffer 7b 4a 6f 68 6e>`: 5 bytes


## Protocol details

[Compactr Protocol](https://github.com/compactr/protocol)


## Want to help ?

You are awesome! Open an issue on this project, identifying the feature that you want to tackle and we'll take the discussion there!


## License 

[Apache 2.0](LICENSE) (c) 2017 Frederic Charette
