/*
 * Anki-compatible adler32 checksum.
 * Anki uses zlib.adler32(firstFieldBytes) & 0xFFFFFFFF stored as signed int.
 */
export function adler32(data: Uint8Array): number {
  let a = 1
  let b = 0
  const mod = 65521

  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % mod
    b = (b + a) % mod
  }

  return ((b << 16) | a) >>> 0
}

export function computeCsum(firstField: string): number {
  const bytes = new TextEncoder().encode(firstField)
  const raw = adler32(bytes)
  // Anki stores as signed 32-bit
  return raw > 0x7fffffff ? raw - 0x100000000 : raw
}
