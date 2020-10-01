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
[![Build Status](https://travis-ci.org/compactr/compactr.js.svg?branch=master)](https://travis-ci.org/compactr/compactr.js)
[![Gitter](https://img.shields.io/gitter/room/compactr/compactr.svg)](https://gitter.im/compactr/compactr)

---

## What is this and why does it matter?

Protocol Buffers are awesome. Having schemas to deflate and inflate data while maintaining some kind of validation is a great concept. Compactr's goal is to build on that to better suit the Javascript ecosystem.

[More](docs/ABOUT.md)


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

// Get the header bytes
const header = userSchema.headerBuffer();

// Get the content bytes 
const partial = userSchema.contentBuffer();

// Get the full payload (header + content bytes)
const buffer = userSchema.buffer();




// Decoding a full payload
const content = userSchema.read(buffer);

// Decoding a partial payload (content)
const content = userSchema.readContent(partial);
```

## Size comparison

JSON: `{"id":123,"name":"John"}`: 24 bytes 

Compactr (full): `<Buffer 02 00 01 01 04 7b 4a 6f 68 6e>`: 10 bytes

Compactr (partial): `<Buffer 7b 4a 6f 68 6e>`: 5 bytes


## Protocol details

### Data types

Type | Count bytes | Byte size
--- | --- | ---
boolean | 0 | 1
number | 0 | 8
int8 | 0 | 1
int16 | 0 | 2
int32 | 0 | 4
double | 0 | 8
string | 1 | 2/char
char8 | 1 | 1/char
char16 | 1 | 2/char
char32 | 1 | 4/char 
array | 1 | (x)/entry
object | 1 | (x)
unsigned | 0 | 8
unsigned8 | 0 | 1 
unsigned16 | 0 | 2
unsigned32 | 0 | 4

* Count bytes range can be specified per-item in the schema*

See the full [Compactr protocol](https://github.com/compactr/protocol)

## Benchmarks

```
[Array] JSON x 737 ops/sec ±1.04% (91 runs sampled)
[Array] Compactr x 536 ops/sec ±1.25% (82 runs sampled)
[Array] size: { json: 0, compactr: 10 }

[Boolean] JSON x 996 ops/sec ±0.84% (93 runs sampled)
[Boolean] Compactr x 1,439 ops/sec ±1.24% (83 runs sampled)
[Boolean] Protobuf x 2,585 ops/sec ±1.32% (91 runs sampled)
[Boolean] size: { json: 23, compactr: 5, protobuf: 5 }

[Float] JSON x 713 ops/sec ±1.29% (88 runs sampled)
[Float] Compactr x 1,056 ops/sec ±1.38% (86 runs sampled)
[Float] Protobuf x 2,432 ops/sec ±1.45% (88 runs sampled)
[Float] size: { json: 41, compactr: 12, protobuf: 12 }

[Integer] JSON x 954 ops/sec ±0.77% (93 runs sampled)
[Integer] Compactr x 1,520 ops/sec ±1.21% (89 runs sampled)
[Integer] Protobuf x 2,676 ops/sec ±1.22% (90 runs sampled)
[Integer] size: { json: 24, compactr: 8, protobuf: 7 }

[Object] JSON x 512 ops/sec ±0.62% (90 runs sampled)
[Object] Compactr x 412 ops/sec ±1.46% (81 runs sampled)
[Object] Protobuf x 898 ops/sec ±0.92% (93 runs sampled)
[Object] size: { json: 46, compactr: 13, protobuf: 25 }

[String] JSON x 432 ops/sec ±0.79% (88 runs sampled)
[String] Compactr x 428 ops/sec ±0.87% (87 runs sampled)
[String] Protobuf x 738 ops/sec ±0.71% (90 runs sampled)
[String] size: { json: 57, compactr: 14, protobuf: 28 }
```

## Want to help ?

You are awesome! Open an issue on this project, identifying the feature that you want to tackle and we'll take the discussion there!


## License 

[Apache 2.0](LICENSE) (c) 2020 Frederic Charette
