import { HttpClient, type HttpClientOptions } from './core/http.js'
import { PaymentsResource } from './resources/payments.js'
import { TokensResource } from './resources/tokens.js'
import { UtilsResource } from './resources/utils.js'

/** Configuration passed to the `Rail0Client` constructor. See `HttpClientOptions` for all fields. */
export type Rail0ClientOptions = HttpClientOptions

/**
 * Entry point for the RAIL0 SDK.
 *
 * ```ts
 * const client = new Rail0Client({ baseUrl: 'https://api.rail0.xyz' })
 * const state = await client.payments.get(paymentId)
 * ```
 */
export class Rail0Client {
  /** Payment lifecycle operations: authorize, charge, capture, void, release, refund. */
  readonly payments: PaymentsResource
  /** Token allowlist queries. */
  readonly tokens: TokensResource
  /** Contract introspection: domain separator, version. */
  readonly utils: UtilsResource

  constructor(options: Rail0ClientOptions) {
    const http = new HttpClient(options)
    this.payments = new PaymentsResource(http)
    this.tokens = new TokensResource(http)
    this.utils = new UtilsResource(http)
  }
}
