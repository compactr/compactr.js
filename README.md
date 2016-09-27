# Compactr
*A compression library for the modern web*

[![Compactr](https://img.shields.io/npm/v/compactr.svg)](https://www.npmjs.com/package/compactr)
[![Build Status](https://travis-ci.org/fed135/compactr.svg?branch=master)](https://travis-ci.org/fed135/compactr)
[![Dependencies Status](https://david-dm.org/fed135/compactr.svg)](https://www.npmjs.com/package/compactr)
[![Gitter](https://img.shields.io/gitter/room/fed135/compactr.svg)](https://gitter.im/fed135/compactr)

---

## What is this and why does it matter?

Compactr is a library to compress and decompress Javascript objects before sending them over the web. It's immensely useful for web applications that use sockets a lot. Smaller payloads equals faster throughput and less bandwidth costs.


## Aren't there any other libraries out there that do this?

Yes, yes there are. Like [msgpack](http://msgpack.org/), [snappy](https://google.github.io/snappy/) and [protocol-buffers](https://developers.google.com/protocol-buffers/).


## Then why make another one, isn't Protobuf like... the best thing?

Why yes, Protocol Buffer is by far the better performing protocol out there, but there's a few things about it I don't like - as a Node developer.

The first thing that comes to mind is the painful management of `.proto` files.

Not only are they overly complex, they are also written in a different markup, which makes dynamic generation or property checking a bit of a hassle. Not to mention that you have to maintain parity across services of these messages that are more often than not a copy of your data Models. (See [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself))

Furthermore, Protobuf variable types don't mean a lot in Javascript. 


## So what's your solution?

Protocol Buffers are awesome. Having schemas to deflate and inflate data while maintaining some kind of validation is a great concept. Compactr's goal is to build on that to better suit Node development and reduce repetition by allowing you to re-use your current Model schemas.


## Examples, please.

For example, if you have a DB schema for users, you can use that directly as a schema for Compactr.

**Waterline**

```
{ id: { type: 'integer', required: true }, name: 'string' }
```


```
/* User compessing in a controller */

const Compactr = require('compactr');

User.create({ id: 0, name: 'Bruce' })
  .then(user => Compactr.encode(User, user))
  .then(deflated => /* Send encoded User */);

```

```
/* Decoding the User data */

let user = Compactr.decode(User, deflated);

```
No need to create additional models for serialization!
Note that you can also use plain Objects as Schemas

## Can that be used for Websockets too?

Oh yes, via webpack!

`npm run build`

Will generate browser-ready code!


## What about Node compatibility

You need Node 6.0.0 and up


## What about performances?

*JSON serialization shown as a reference point*


**Speed**
(Lower is better)

<img src="http://i231.photobucket.com/albums/ee109/FeD135/speed.png">

**Size**
(Lower is better)

<img src="http://i231.photobucket.com/albums/ee109/FeD135/size.png">

**Score**
(Efficiency vs JSON 50% Speed, 50% Size - Higher is better)

<img src="http://i231.photobucket.com/albums/ee109/FeD135/score.png">

## Alright, what about features?

Right now, Compactr allows you to

- [x] Use Waterline schemas
- [x] Use Mongoose schemas
- [x] Synchronously encode/decode
- [x] Encode nested objects/Arrays

And in the near future

- [ ] Run validation checks on payloads

## Alright, I'm convinced! How can I help?

Just open an issue, identifying it as a feature that you want to tackle.
Ex: `STORY - [...]`
And we'll take the discussion there.
