# About Compactr.js

## Why choose Compactr for serialization

### Who is this for?

The Compactr protocol is mainly geared to empower high-debit realtime applications such as online games. That said, there's no reason why you couldn't use this in any type of application where serialization occurs like web servers transactions, database gossipping or even data storage.  

### How does this compare?

Compactr is designed for easier integration with Javascript/Typescript applications. It's performances are very much similar to those of JSON serialization, but the output compares in size with Protobuf.

It would be possible for compactr to be closer in speed to protobuf if we manage to implement codegen on schema initialization, like protobufjs does.

Though the area where compactr really shines is in it's ability to handle nested objects and object collections.

You can store information of any size or with no penalty.

It is also extremely light in terms of package size, has zero dependencies, goes easy on the CPU and RAM. 
