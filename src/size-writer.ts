/** Shared size writing utilities */

/**
 * Write size bytes directly to array in big-endian format
 * @param target - Array to write to
 * @param size - Size value to encode
 * @param count - Number of bytes (1, 2, or 4)
 */
export function writeSizeBytes(target: number[], size: number, count: number): void {
  if (count === 1) {
    target.push(size & 0xff);
  }
  else if (count === 2) {
    target.push(size >> 8, size & 0xff);
  }
  else if (count === 4) {
    target.push(size >> 24, size >> 16, size >> 8, size & 0xff);
  }
}
