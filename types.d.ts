/**
 * Type definitions for Compactr
 * Schema based serialization made easy
 */
declare module 'compactr' {
  export const schema: (schema: SchemaDefinition, options?: SchemaOptions) => SchemaInstance;

  export interface SchemaInstance {
    /**
     * Start writing some data against a schema
     * @param data The data to be encoded
     * @param options The options for the encoding
     * @returns Self reference
     */
    write(data: any, options?: WriteOptions): this

    /**
     * Returns the bytes from the encoded data buffer.
     * @returns The data buffer
     */
    buffer(): Buffer

    /**
     * Returns the byte sizes of a data object, for insight or troubleshooting
     * @param data The data to extract size information of
     * @returns The detailed sizes information
     */
    sizes(data: any): Record<string, any>

    /**
     * Reads data from a buffer and decodes it according to the schema
     * @param buffer The buffer to decode
     * @param options The options for the decoding
     * @returns The decoded data
     */
    read(buffer: Buffer | number[]): any
  }

  export interface SchemaFieldDefinition {
    type?: 'boolean' | 'integer' | 'number' | 'string' | 'array' | 'object'
    format?: 'int32' | 'int64' | 'float' | 'double' | 'uuid' | 'ipv4' | 'ipv6' | 'date' | 'date-time' | 'binary'
    nullable?: boolean
    count?: number
    size?: number
    schema?: SchemaDefinition
    properties?: SchemaDefinition
    items?: SchemaFieldDefinition
    oneOf?: SchemaFieldDefinition[]
    anyOf?: SchemaFieldDefinition[]
    $ref?: string
  }

  export interface SchemaDefinition {
    [key: string]: SchemaFieldDefinition
  }

  export interface SchemaOptions {
    keyOrder?: boolean
    schemas?: { [key: string]: SchemaFieldDefinition }
  }

  export interface WriteOptions {
    coerse?: boolean
    validate?: boolean
  }
}
