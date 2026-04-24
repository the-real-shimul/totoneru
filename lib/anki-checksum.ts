/*
 * Anki-compatible field checksum.
 *
 * Matches anki/rslib/src/notes/mod.rs::checksum: SHA1 over the HTML-stripped
 * first field (with &nbsp; → space), taking the first 4 bytes big-endian as
 * u32, stored as signed int. Used for duplicate detection on import.
 */
function stripCsumInput(field: string): string {
  return field.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")
}

export async function computeCsum(firstField: string): Promise<number> {
  const bytes = new TextEncoder().encode(stripCsumInput(firstField))
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-1", bytes))
  const raw =
    ((digest[0] << 24) | (digest[1] << 16) | (digest[2] << 8) | digest[3]) >>> 0
  return raw > 0x7fffffff ? raw - 0x100000000 : raw
}
