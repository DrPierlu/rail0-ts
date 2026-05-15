import type { HttpClient } from '../core/http.js'
import type {
  Address,
  AuthorizeParams,
  Bytes32,
  CaptureParams,
  ChargeParams,
  HashResponse,
  NonceResponse,
  Payment,
  PaymentResponse,
  RefundParams,
  ReleaseParams,
  TransactionResponse,
  VoidParams,
} from './types.js'

export class PaymentsResource {
  constructor(private readonly http: HttpClient) {}

  /** Returns the current on-chain state and config hash for a payment. */
  get(paymentId: Bytes32): Promise<PaymentResponse> {
    return this.http.get(`/payments/${paymentId}`)
  }

  /** Pull `amount` from the payer into escrow using an EIP-3009 transferWithAuthorization signature. */
  authorize(paymentId: Bytes32, params: AuthorizeParams): Promise<TransactionResponse> {
    return this.http.post(`/payments/${paymentId}/authorize`, params)
  }

  /** Authorize and immediately capture in a single transaction. Uses an EIP-3009 signature. */
  charge(paymentId: Bytes32, params: ChargeParams): Promise<TransactionResponse> {
    return this.http.post(`/payments/${paymentId}/charge`, params)
  }

  /** Capture escrowed funds. Caller must be the payee. */
  capture(paymentId: Bytes32, params: CaptureParams): Promise<TransactionResponse> {
    return this.http.post(`/payments/${paymentId}/capture`, params)
  }

  /** Cancel an authorization, returning escrowed funds to the payer. Caller must be the payee. */
  void(paymentId: Bytes32, params: VoidParams): Promise<TransactionResponse> {
    return this.http.post(`/payments/${paymentId}/void`, params)
  }

  /** Return escrowed funds to the payer after authorizationExpiry. Permissionless. */
  release(paymentId: Bytes32, params: ReleaseParams): Promise<TransactionResponse> {
    return this.http.post(`/payments/${paymentId}/release`, params)
  }

  /** Refund a previously captured amount from the payee to the payer. Caller must be the payee. */
  refund(paymentId: Bytes32, params: RefundParams): Promise<TransactionResponse> {
    return this.http.post(`/payments/${paymentId}/refund`, params)
  }

  /** Returns the EIP-3009 nonce the payer must use when signing an authorize call. */
  authorizeNonce(paymentId: Bytes32, payer: Address): Promise<NonceResponse> {
    return this.http.get(`/payments/${paymentId}/authorize-nonce?payer=${payer}`)
  }

  /** Returns the EIP-3009 nonce the payer must use when signing a charge call. */
  chargeNonce(paymentId: Bytes32, payer: Address): Promise<NonceResponse> {
    return this.http.get(`/payments/${paymentId}/charge-nonce?payer=${payer}`)
  }

  /** Compute the canonical EIP-712 digest of a Payment configuration. */
  hash(payment: Payment): Promise<HashResponse> {
    return this.http.post('/payments/hash', payment)
  }
}
