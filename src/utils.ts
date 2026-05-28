import { sha256 } from '@noble/hashes/sha2.js'

/**
 * Generates a checksummed RAIL0 payment ID (32 bytes, `"0x"`-prefixed hex).
 *
 * Layout:
 *   bytes  0.. 3  — last 4 bytes of SHA-256(payload)   ← checksum
 *   bytes  4..31  — 28 cryptographically-random bytes  ← payload
 *
 * The checksum lets Ponder (the on-chain indexer) verify that a payment was
 * opened through rail0-api without a shared secret.  Any `paymentId` that
 * fails the check is silently skipped by the indexer.
 *
 * Works in browser, Node.js, and edge runtimes — relies only on
 * `globalThis.crypto.getRandomValues` and `@noble/hashes`.
 */
export function generatePaymentId(): `0x${string}` {
  const payload = new Uint8Array(28)
  globalThis.crypto.getRandomValues(payload)

  const digest = sha256(payload)           // Uint8Array(32)
  const id     = new Uint8Array(32)
  id.set(digest.subarray(28), 0)           // checksum: SHA-256(payload)[-4:]
  id.set(payload, 4)                       // payload:  28 random bytes

  const hex = Array.from(id, (b) => b.toString(16).padStart(2, '0')).join('')
  return `0x${hex}` as `0x${string}`
}
