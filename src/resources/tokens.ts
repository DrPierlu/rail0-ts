import type { HttpClient } from '../core/http.js'
import type { Address, TokenStatusResponse } from './types.js'

export class TokensResource {
  constructor(private readonly http: HttpClient) {}

  /** Returns whether the given ERC-20 token is in this deployment's allowlist. */
  isAccepted(address: Address): Promise<TokenStatusResponse> {
    return this.http.get(`/tokens/${address}`)
  }
}
