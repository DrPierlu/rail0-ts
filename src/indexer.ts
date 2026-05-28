import { createHmac } from 'node:crypto'
import type { Bytes32 } from './resources/types.js'

// ── Types ─────────────────────────────────────────────────────────────────────

/** On-chain event type, maps 1-to-1 to a payment status transition in rail0-api. */
export type ConfirmEventType =
  | 'authorized'
  | 'charged'
  | 'captured'
  | 'voided'
  | 'released'
  | 'refunded'

/** Body sent to `POST /transactions/{txHash}/confirm`. */
export interface ConfirmPayload {
  /** On-chain event type. */
  eventType: ConfirmEventType
  /** The `0x`-prefixed bytes32 payment identifier. */
  paymentId: Bytes32
  /** Block number at which the transaction was confirmed. */
  blockNumber: number
  /**
   * Token amount involved (stringified bigint).
   * Present for: captured, voided, released, refunded.
   * Absent for:  authorized, charged (full `payment.amount` applies).
   */
  amount?: string
}

/** Constructor options for `IndexerClient`. */
export interface IndexerClientOptions {
  /** Base URL of the RAIL0 API, e.g. `"https://api.rail0.xyz"`. Trailing slash is stripped. */
  baseUrl: string
  /**
   * 32-byte hex shared secret used to sign HMAC-SHA256 requests.
   * Must match `RAIL0_INDEXER_HMAC_SECRET` configured in rail0-api.
   */
  hmacSecret: string
}

// ── Client ────────────────────────────────────────────────────────────────────

/**
 * HTTP client for the rail0-api indexer notification endpoint.
 *
 * Every request is authenticated with HMAC-SHA256:
 * ```
 * signed    = `${timestamp}.${JSON.stringify(body)}`
 * signature = HMAC-SHA256(key: hmacSecret, data: signed)
 * ```
 *
 * Headers sent on every request:
 * - `X-Rail0-Timestamp` — Unix timestamp in seconds
 * - `X-Rail0-Signature` — hex-encoded HMAC digest
 *
 * rail0-api verifies the signature and rejects requests older than a
 * configurable replay window (default: 5 minutes).
 *
 * ```ts
 * const client = new IndexerClient({
 *   baseUrl:    process.env.RAIL0_API_URL!,
 *   hmacSecret: process.env.RAIL0_API_HMAC_SECRET!,
 * })
 * await client.notifyConfirmation(txHash, { eventType: 'authorized', paymentId, blockNumber })
 * ```
 */
export class IndexerClient {
  private readonly baseUrl: string
  private readonly hmacSecret: string

  constructor(options: IndexerClientOptions) {
    this.baseUrl    = options.baseUrl.replace(/\/$/, '')
    this.hmacSecret = options.hmacSecret
  }

  /**
   * Notifies rail0-api that an on-chain transaction was confirmed.
   *
   * @param txHash  Confirmed on-chain transaction hash (`0x…` bytes32).
   * @param payload Event data: eventType, paymentId, blockNumber, optional amount.
   * @throws On any non-2xx response or network error.
   */
  async notifyConfirmation(txHash: Bytes32, payload: ConfirmPayload): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const body      = JSON.stringify(payload)

    const signature = createHmac('sha256', this.hmacSecret)
      .update(`${timestamp}.${body}`)
      .digest('hex')

    const res = await fetch(`${this.baseUrl}/transactions/${txHash}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'X-Rail0-Timestamp': timestamp,
        'X-Rail0-Signature': signature,
      },
      body,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(
        `rail0-api POST /transactions/${txHash}/confirm responded ${res.status}: ${text}`,
      )
    }
  }
}
