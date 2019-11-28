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
[![Node](https://img.shields.io/badge/node->%3D6.0-blue.svg)](https://nodejs.org)
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


## Speed comparison

![Speed](http://res.cloudinary.com/kalm/image/upload/v1507323565/compactr_speed_adhlsk.png)

*Measured against plain JSON serialization + convertion to buffer. Compactr serialization is performed with default settings via the partial (content only) load method*



## Size comparison

![Size](http://res.cloudinary.com/kalm/image/upload/v1507323565/compactr_bytes_cbjxka.png)

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


## Want to help ?

You are awesome! Open an issue on this project, identifying the feature that you want to tackle and we'll take the discussion there!


## License 

[Apache 2.0](LICENSE) (c) 2019 Frederic Charette
