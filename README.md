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
[![Dependencies Status](https://david-dm.org/compactr/compactr.js.svg)](https://david-dm.org/compactr/compactr.js)
[![Gitter](https://img.shields.io/gitter/room/compactr/compactr.svg)](https://gitter.im/compactr/compactr)

---

## What is this and why does it matter?

Protocol Buffers are awesome. Having schemas to deflate and inflate data while maintaining some kind of validation is a great concept. Compactr's goal is to build on that to better suit Node development and reduce repetition by allowing you to build schemas for your data directly in your scripting language. For example, if you have a DB schema for a model, you could use that directly as a schema for Compactr.


## Install

```
    npm install compactr
```


## Projected implementation

```node
const Compactr = require('compactr');

// Defining a schema
const userSchema = Compactr.schema({ id: 'number', name: 'string' });

// Encoding
userSchema.load({ id: 123, name: 'John' });

// Get the schema map bytes (for partial loads)
const map = userSchema.mapBytes();

// Get the partial load bytes
const partial = userSchema.dataBytes();

// Get the full map + data bytes
const buffer = userSchema.bytes();

// Decoding (full)
const data = userSchema.decode(buffer);

// Decoding (partial)
const data = userSchema.decode(map, partial);
```


## Projected performances

JSON: `{"id":123,"name":"John"}`: 24 bytes 

Compactr (full): `<Buffer 02 00 01 01 00 04 7b 4a 6f 68 6e>`: 11 bytes

Compactr (partial): `<Buffer 7b 4a 6f 68 6e>`: 5 bytes


## Protocol details

[Compactr Protocol](https://github.com/compactr/protocol)


## Want to help ?

Just open an issue, identifying it as a feature that you want to tackle.
Ex: `STORY - [...]`
And we'll take the discussion there.


## License 

[Apache 2.0](LICENSE) (c) 2017 Frederic Charette