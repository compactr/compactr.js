<h1 align="center">
  <a title="Schema based serialization made easy" href="http://compactr.js.org">
    <img alt="Compactr" width="320px" src="http://res.cloudinary.com/compactr/image/upload/v1487202241/compactr_header.png" />
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
const content = userSchema.decode(buffer);

// Decoding (partial)
const content = userSchema.decode(header, partial);
```


## Performances

```
[Array] JSON x 84.04 ops/sec ±0.77% (64 runs sampled)
[Array] Compactr x 88.12 ops/sec ±0.99% (66 runs sampled)

[Boolean] JSON x 99.29 ops/sec ±0.88% (64 runs sampled)
[Boolean] Compactr x 190 ops/sec ±1.17% (75 runs sampled)

[Float] JSON x 66.76 ops/sec ±1.10% (61 runs sampled)
[Float] Compactr x 112 ops/sec ±1.67% (70 runs sampled)

[Integer] JSON x 103 ops/sec ±1.41% (66 runs sampled)
[Integer] Compactr x 202 ops/sec ±1.74% (74 runs sampled)

[Integer (negative)] JSON  x 109 ops/sec ±1.24% (69 runs sampled)
[Integer (negative)] Compactr  x 203 ops/sec ±1.55% (74 runs sampled)

[Object] JSON x 61.91 ops/sec ±1.32% (58 runs sampled)
[Object] Compactr x 44.78 ops/sec ±2.19% (54 runs sampled)

[String] JSON x 68.89 ops/sec ±1.48% (63 runs sampled)
[String] Compactr x 79.16 ops/sec ±2.04% (61 runs sampled)

[String (special characters)] JSON x 71.65 ops/sec ±1.15% (65 runs sampled)
[String (special characters)] Compactr x 144 ops/sec ±1.37% (71 runs sampled)
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