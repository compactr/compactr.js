# Compactr Specifications v1.0.0

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


[Top](#table-of-content)

---

## 2- Decoding

[Top](#table-of-content)

---

## 3- Considerations

[Top](#table-of-content)

---

## 4- Benchmarking

[Top](#table-of-content)

---

## 5- Testing

[Top](#table-of-content)

---

## 6- Limitations

### Buffer size

Currently, the maximum size for `Buffer` output is the MAX_FRAME_SIZE value minus protocol overhead : 1400 Bytes.
Attempting to encode an `Object` which result in a larger `Buffer` will throw an `Error`.

### Data types

Supported data types include `Strings`, `Numbers` and `Booleans`.
Numbers are split into 4 categories. `INT8`, `INT16`, `INT32`, `Double`.

Attempting to encode an unsupported format, or `Null`, or `Integer` will result in that key being skipped.

### Double Limit

Double type numbers are trimmed so that only the 6 first digits are send while in Big-Endian format.
This limits the number of characters in the number, decimal or integers.

Attempting to encode a number that makes use of the last 2 digits of the double will not be decoded properly.

### Input validation

There is no input validation. Compactr will try to write to the result `Buffer` as per the [schema](#lexicon) specifications.

Attempting to write a bad data type, ex: `"3"` instead of `3` when schema requires a `Number` will throw an `Error`.

[Top](#table-of-content)

---

## 7- Upgrades

[Top](#table-of-content)

---