<h1 align="center">
  <a title="OpenAPI serialization" href="http://compactr.js.org">
    <img alt="Compactr" width="320px" src="http://res.cloudinary.com/kalm/image/upload/v1494589244/compactr_header_rev1.png" />
    <br/><br/>
  </a>
  Compactr
</h1>
<h3 align="center">
  OpenAPI serialization
  <br/><br/><br/>
</h3>
<br/>

- **OpenAPI 3.x Compatible** Use your existing OpenAPI schemas, no extra definitions required
- **Cuts bandwidth in half** Average API responses are multiple times smaller than JSON
- **Built for actual APIs** Specialty field types to optimize common items, ex: UUID, date-time, ivp4 
- **Zero dependencies** and can be bundled down to ~5kb!

## Install

```bash
npm install compactr
```

## Usage

### Basic Example

```typescript
import { schema } from 'compactr';

const userSchema = schema({
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    age: { type: 'integer', format: 'int32' },
    balance: { type: 'number', format: 'double' },
    created: { type: 'string', format: 'date-time' },
    tags: { type: 'array', items: { type: 'string' } }
  }
});

const data = {
  id: '550e8400-e29b-4d4e-a7d4-426614174000',
  name: 'Alice',
  age: 30,
  balance: 1234.56,
  created: '2025-10-28T14:30:00.000Z',
  tags: ['premium', 'verified']
};

const buffer = userSchema.write(data);
const decoded = userSchema.read(buffer);
```

Compactr also supports component references ($ref).

*Only local references are allowed*

**Component References**

```typescript
const schema = schema(
  {
    user: { $ref: '#/User' },
    product: { $ref: '#/Product' }
  },
  {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', format: 'int32' },
          name: { type: 'string' }
        }
      },
      Product: {
        type: 'object',
        properties: {
          sku: { type: 'string' },
          price: { type: 'number', format: 'double' }
        }
      }
    }
  }
);
```

## Supported Types

Compactr supports the following OpenAPI types and formats:

| Type | Format | Bytes | Description |
| --- | --- | --- | --- |
| boolean | - | 1 | Boolean value |
| integer | int32 | 4 | 32-bit integer |
| integer | int64 | 8 | 64-bit integer |
| number | float | 4 | 32-bit floating point |
| number | double | 8 | 64-bit floating point |
| string | - | 2/char | UTF-8 string |
| string | uuid | 16 | UUID (compressed) |
| string | ipv4 | 4 | IPv4 address |
| string | ipv6 | 16 | IPv6 address |
| string | date | 4 | Date (YYYY-MM-DD) |
| string | date-time | 8 | ISO 8601 date-time |
| string | binary | variable | Base64 binary data |
| array | - | variable | Array of items |
| object | - | variable | Nested object |


## Performance

I realistic scenarios, compactr performs a bit slower than JSON.stringify/ JSON.parse as well as other schema-based protocols such as `protobuf`, but can yield a byte reduction of 3.5x compared to JSON.

```
[JSON-API Reponse] JSON x 289 ops/sec ±1.10% (83 runs sampled)
[JSON-API Reponse] Compactr x 115 ops/sec ±0.93% (74 runs sampled)
[JSON-API Reponse] Protobuf x 272 ops/sec ±1.06% (82 runs sampled)
[JSON-API Reponse] MsgPack x 133 ops/sec ±1.38% (76 runs sampled)

Buffer size (bytes): { json: 277, compactr: 78, protobuf: 129, msgpack: 227 }
```

## Testing

Run the test suite:

```bash
npm test
```

Run benchmarks:

```bash
npm run bench
```

Build the project:

```bash
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Apache 2.0](LICENSE) (c) 2025 Frederic Charette
