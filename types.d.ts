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
     * Returns the bytes from the header of the encoded data buffer.
     * A fresh schema with no written data will return a blank, usable for partial encodings.
     * @returns The header buffer
     */
    headerBuffer(): Buffer

    /**
     * Returns the bytes from the content of the encoded data buffer.
     * @returns The content buffer
     */
    contentBuffer(): Buffer

    /**
     * Returns the bytes from the header AND content of the encoded data buffer.
     * @returns The data buffer
     */
    buffer(): Buffer

    /**
     * Returns the typedArray from the header AND content of the encoded data buffer.
     * @returns The typed array
     */
    typedArray(): number[]

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
    type: 'boolean' | 'number' | 'int8' | 'int16' | 'int32' | 'double' | 'string' | 'char8' | 'char16' | 'char32' | 'array' | 'object' | 'unsigned' | 'unsigned8' | 'unsigned16' | 'unsigned32'
    count?: number
    size?: number
    schema?: SchemaDefinition
    items?: {
      type: string
      count?: number
      schema?: SchemaDefinition
    }
  }

  export interface SchemaDefinition {
    [key: string]: SchemaFieldDefinition
  }

  export interface SchemaOptions {
    keyOrder?: boolean
  }

  export interface WriteOptions {
    coerse?: boolean
    validate?: boolean
  }
}
