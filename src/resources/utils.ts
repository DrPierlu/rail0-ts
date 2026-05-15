import type { HttpClient } from '../core/http.js'
import type { DomainSeparatorResponse, VersionResponse } from './types.js'

export class UtilsResource {
  constructor(private readonly http: HttpClient) {}

  /** Returns the EIP-712 domain separator for the RAIL0 contract on the current chain. */
  domainSeparator(): Promise<DomainSeparatorResponse> {
    return this.http.get('/domain-separator')
  }

  /** Returns the contract version number. */
  version(): Promise<VersionResponse> {
    return this.http.get('/version')
  }
}
