# Compactr Specifications v2.0.0

## Table of content

0- [Lexicon](#lexicon)
1- [Encoding](#1--encoding)
2- [Decoding](#2--decoding)
3- [Considerations](#3--considerations)
4- [Benchmarking](#4--benchmarking)
5- [Testing](#5--testing)
6- [Limitations](#6--limitations)
7- [Upgrades](#7--upgrades)

---

## Lexicon

**Payload** A Javascript object. What is to be serialized.

ex:

```
{
  id: 2,
  first_name: 'John',
  last_name: 'Smith'
}
```

**Schema** A Javascript object containing information about a model.

ex:

``` 
// Mongoose Schema
{
  id: {
    type: Number,
    unique: true
  },
  first_name: String,
  last_name: String
}
```
---

## 1- Encoding

The `encode` method is a serialization operation that prepares a [payload](#lexicon) for transfer over binary protocols (http, tcp, udp, ipc, etc.). The input [payload](#lexicon) is converted to a `Buffer`. Buffers can be seen as an array of unsigned int8 characters.

Typically, serialization is done with `JSON.stringify`, which is a built-in library that converts the [payload](#lexicon) to a `String`, which can then be easily written to a `Buffer` - where each character is inserted in the array with it's code point.

The main advantage of JSON serialization is that it is self-explanatory. Decoding the `Buffer` requires no additionnal components. Furthermore, as a built-in library, it is extremely fast. The downside is that the resulting `Buffer` is pretty large and in the case of realtime web applications, repeating the [schema](#lexicon) and the JSON markup every time is a real waste.

Schema-based encoding aims to remove markup and unesserary [schema](#lexicon) key names, which results in *much* smaller `Buffer` outputs.

[!Image1]()
*Payload and schema next to one-another with numbered indexes*


[!Image2]()
*Repartition of data inside a `Compactr` Buffer*

A typical Compactr entries is composed of 3 components.

- *The schema key* The index to look for in the schema (UINT8)
- *The counting bytes* Tells the decoder how many bytes have been written (UINT8 or UINT16)
- *The data* The data bytes for the value

---

### Booleans

Counting bytes: UINT8


```
// True
{val: true}


// False
{val: true}
```

---

### Numbers

Counting bytes: UNIT8


```
// INT8
{val: 12}


// INT16
{val: 2000}


// INT32
{val: 200000}


// Double
{val: 32.32323}
```

---

### String

Counting bytes: UNIT8

```
{val: 'abc'}
```

---

### Boolean Arrays

Counting bytes: UINT8, no separation

Max length: 255

```
{val: [true, false]}
```

---

### Number Arrays

Counting bytes: UINT16, with separation

Max length: 65536/{number_byte_size}

```
{val: [12, 2000, 200000, 32.32323]}
```

---

### String Arrays

Counting bytes: UINT16, with separation

Max length: 65536/{string_length}

```
{val: ['a', 'b', 'c']}
```

---

### Schemas

Counting bytes: UINT16

Max length: 65536

```
{val: {foo: 'bar'}}
```

---

### Schema Arrays

Counting bytes: UINT16

Max length: 65536

```
{val: [{foo: 'bar'}]}
```

---

### Buffers

Counting bytes: UINT16

Max length: 65536

```
{val: {foo: Buffer.from([0,1,2])}}
```


[Top](#table-of-content)

---

## 2- Decoding

Decoding works by reading the Payload byte per byte. Reading stops when a Separator token is found [255].
At this point, a check is made to the previous byte to check if it matches an index field in the Schema. If a match is found, the Decoder will perform a read of the presumed variable type. 


[Top](#table-of-content)

---

## 3- Considerations

Compactr *may* not be the appropriate solution for your software or service. It's a good idea to look at the benchmarks, -perhaps write your own with use cases that reflect your typical payloads- and also look at the limitations of the Compactr Schema.

A lot of what makes Compactr so fast and so light is that the `Decode` operations works a lot on assumptions. 
There are edge cases in which decoding will missinterpret a piece of a value for a Compactr-reserved byte-value. Resulting in corrupted output data.

Compactr-reserved byte-values are numbers 250-255. To keep them reserved, the implementation of INT8 has been altered to that of UINT8 with a cap on the MAX_VALUE. Inputing 250-255 will be cast as INT16. There are no mechanisms for other data types to keep these values reserved for now.

Limiting yourself to common latin characters, booleans and small integers eliminates much of the risk. If you service depends a lot on sending Floats, please consider some alternative options as the current implementation of ieee754 in use is relatively slow (compared to a C++ Addon) and 8 Bytes may, most of the time be too big for storing a simple value like `3.5`.


[Top](#table-of-content)

---

## 4- Benchmarking

Benchmarks need to be run once for every per data type,

- with a typical payload
- with an oversized payload
- on a single thread
- using clusters

And should be compared to a similar benchmark using 

- JSON
- MSG-PACK
- SNAPPY
- PROTOBUF

Benchmarks should present encode/decode speeds, size, memory and CPU footprints.


[Top](#table-of-content)

---

## 5- Testing

Tests need to cover:

- All data types
- Data types combinaisons
- Edge-cases
- All Schema formats


[Top](#table-of-content)

---

## 6- Limitations

### Data types

Supported data types include `Strings`, `Numbers`, `Booleans` `Arrays` and other `Schemas`.
Numbers are split into 4 categories. `INT8`, `INT16`, `INT32`, `Double`.

Attempting to encode an unsupported format, or `Null`, or `Integer` will result in that key being skipped.

### Input validation

There is no input validation. Compactr will try to write to the result `Buffer` as per the [schema](#lexicon) specifications.

Attempting to write a bad data type, ex: `"3"` instead of `3` when schema requires a `Number` will throw an `Error`.

### Arrays

Arrays cannot have mixed values, unfortunatly. An alternative is to make a Schema array.


[Top](#table-of-content)

---

## 7- Upgrades

This is the V1 Specification document for Compactr. If there are changes to the structure of the buffer or the decoding assumptions, a new, Major version should be released - along with a new SPEC document. 

### Planned spec upgrades

- Handling of deeply-nested schemas
- Reduction of decoding error margin (Reserved byte values in use)
- Improving assumptions in decoding to reduce payload size/ performances


[Top](#table-of-content)

---