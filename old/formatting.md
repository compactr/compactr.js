## Type indexes

- boolean 0 
- number 10	( int8: 11, int16: 12, int32: 13, double: 14) // default 8 bytes
- string 20 ( utf8: 21, utf16: 22) // default 2 bytes
- array 30
- schema 40

## Function formatting

### Low-level

string(val, variant_size)

	- Push characters one after another using variant_size
	- return [bytes_length, buffer]

number(val, variant_size)

	- Write as BigEndian of variant_size
	- return [bytes_length, buffer]

boolean(val)

	- Write binary [0, 1]
	- return [1, buffer]


### High-level

array(val, schema)

	- Write sequentially using lower-level methods
	- return [bytes_length, buffer]


schema(val, schema)

	- Use top-level encode function
	- return [bytes_length, buffer]
