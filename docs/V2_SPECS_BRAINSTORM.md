Binary Data->
	[Cycle]
		Read key name -> schema key
		schema key -> length byte size
		length bytes -> data length
		data length -> data
		data -> key name



[UINT8 num_keys][UINT8 <key id>][NUMBER <length byte>][...]|[data][...]




// Can override length byte alloc value by type
// Global
Compactr.defaults.int8_array.length_byte_size = 2;	//Default is 1 (256 values)
// Per item
Compactr.decode(Schema, Payload, {
	int8_array: { 
		length_bytes: 2
	}
});


Compactr.encode = function(schema, payload, options) {
	let _opt = Compactr.defaults;
	if (options !== undefined) _opt = Object.assign({}, Compactr.default, options);


}

// ability to get (keys)

Compactr.keys(Schema, Payload, [options])

// ability to extract specific data from a packed payload

Compactr.extract(Schema, payload, <key>, [options])



PROFILES

A) Low repetition. speed > packet size


    |  Declaration  |                    Key listing                  |        Data         |
    [UINT8 num keys] [UINT8 <key[i] id>][UINT16 <data[i] byte size>]... [Bytes <data[i]>]...


B) High repetition. speed < packet size

    |  Declaration  |                    Key listing                  |        Data sizes          |       Data         |
    [UINT8 num keys] [UINT8 <key[i] id>][UINT16 <data[i] location>]... [UINT 16 <data[i byte size>] [Bytes <data[i]>]...




Examples:

{
	"bar":"foo",
	"baz":"nil",
	"con":"foo"
}

// 37 bytes


Profile A

| |     |     |     |     |     |     |
[3,0,0,3,1,0,3,2,0,3,f,o,o,n,i,l,f,o,o]	// 19 bytes

Profile B

| |     |     |     |   |   |     |     |
[3,0,0,0,1,0,1,2,0,0,0,3,0,3,f,o,o,n,i,l] // 20 bytes


Profile A survives as main standard, B is for custom use cases

Profile A allows the implementation of the map/data batch transfers

Declaration and key listing is sent once, and only data packets are send afterwards.

/* ------ Example implementation

const schema = Compactr.schema({ x: 'int16', y: int16 });
schema.load({ x: 22, y: 752 });

const map = schema.mapBytes();
const data = schema.dataBytes();
const full = schema.bytes();

