# About Compactr.js

## Why choose Compactr for serialization

### Who is this for?

The Compactr protocol is mainly geared to empower high-debit realtime applications such as online games. That said, there's no reason why you couldn't use this in any type of application where serialization occurs like web servers transactions, database gossipping or even data storage.  

### Key selling points

**Programatic schemas** 
Reduce repetition by allowing you to build schemas for your data directly in your scripting language or store them as JSON. This creates the most portable and dynamic schema management experience possible.

**Partial payloads**
Redundancy, separators and checksums are a waste of bytes for fire-and-forget events. For extremely predictable payloads, like character coordinates, can easily be decoded without the help of the header, which can help increase decoding speed and reduce payload sizes.

**Unlimited nesting**
Compactr supports as much nesting as you need. Object-in-object-in-array-in-object... it handles it!

**RPC ready**
Dynamic schemas, encoding options like explicit type coersion, schema validation and garanties over key ordering makes Compactr.js a great foundation for any RPC protocol.

**All sizes are equal**
Count and size values make it possible to encode data of any size, as long as it fits in ram, we don't have streaming...yet.

**No dependencies**
It's very important (to me at least) to keep things light and manageable. This will be the fastest `npm install` you'll ever do.
