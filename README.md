# Compactr
*Schema based serialization made easy*

[![Gitter](https://img.shields.io/gitter/room/fed135/compactr.svg)](https://gitter.im/fed135/compactr)

---

## What is this and why does it matter?

Compactr is a library to serialize JSON objects in the most optimal way possible. It's immensely useful for web applications that use sockets a lot. Smaller payloads equals faster throughput and less bandwidth costs.

Protocol Buffer is by far the better performing protocol out there for this kind of work, but there's a few things about it I don't like as a Node developer.

1- The painful management of `.proto` files.

2- Repetition of schemas and variations is extremely verbose.

3- C variable types don't mean a lot in Javascript. 

4- Not a lot of options for partial serialization or packet inspection

Protocol Buffers are awesome. Having schemas to deflate and inflate data while maintaining some kind of validation is a great concept. Compactr's goal is to build on that to better suit Node development and reduce repetition by allowing you to build schemas for your data in your code. For example, if you have a DB schema for a model, you could use that directly as a schema for Compactr.


## Projected implementation

```
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

[https://github.com/compactr/protocol](Compactr Protocol)


## Projected features

- Synchronous encode/decode interface
- Encode deeply nested objects/Arrays
- Run validation checks on payloads


## Want to help ?

Just open an issue, identifying it as a feature that you want to tackle.
Ex: `STORY - [...]`
And we'll take the discussion there.
