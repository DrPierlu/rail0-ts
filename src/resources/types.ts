/**
 * Public types for the RAIL0 SDK.
 *
 * All types are derived from the generated OpenAPI schema in ../api.ts.
 * Do not add hand-written types here — extend the OpenAPI spec instead,
 * then re-run `pnpm generate`.
 */
import type { components, operations } from '../api.js'

// ================================================================
//  Re-export generated internals for advanced use
// ================================================================

export type { components, operations } from '../api.js'

// ================================================================
//  Primitive aliases
// ================================================================

/** Checksummed or lowercase Ethereum address (42 chars, 0x-prefixed). */
export type Address = components['schemas']['Address']

/** 32-byte value, hex-encoded (66 chars, 0x-prefixed). Used for payment IDs, hashes, and signature components. */
export type Bytes32 = components['schemas']['Bytes32']

/**
 * Unsigned 256-bit integer serialised as a decimal string.
 * Avoids precision loss when amounts exceed `Number.MAX_SAFE_INTEGER`.
 */
export type Uint256String = components['schemas']['Uint256String']

// ================================================================
//  Core model
// ================================================================

/**
 * Immutable payment configuration shared by both payer and payee.
 *
 * The EIP-712 digest (`configHash`) is committed on-chain the first time
 * `authorize` or `charge` is called. Every subsequent operation on the same
 * `paymentId` must supply the exact same struct — a mismatch causes the
 * contract to revert with `PaymentMismatch`.
 */
export type Payment = components['schemas']['Payment']

/**
 * On-chain mutable state for a payment, packed in a single storage slot.
 *
 * - `capturableAmount` holds the escrowed balance (authorize → capture / void / release path).
 * - `refundableAmount` holds funds already disbursed to the payee (capture → refund path).
 */
export type PaymentState = components['schemas']['PaymentState']

// ================================================================
//  Request params
// ================================================================

/**
 * Body for `payments.authorize()`.
 *
 * `v`, `r`, `s` are the EIP-3009 `transferWithAuthorization` signature produced
 * by the payer's private key. Use `signAuthorize()` to build the signature off-chain.
 */
export type AuthorizeParams = components['schemas']['AuthorizeRequest']

/**
 * Body for `payments.charge()` (one-shot authorize + capture).
 *
 * Same shape as `AuthorizeParams`. The nonce must come from
 * `payments.chargeNonce()` — it is different from the authorize nonce.
 */
export type ChargeParams = components['schemas']['AuthorizeRequest']

/**
 * Body for `payments.capture()`.
 * The API submits the on-chain transaction on behalf of `payment.payee`.
 */
export type CaptureParams = components['schemas']['PaymentWithAmountRequest']

/**
 * Body for `payments.void()`.
 * The API submits the on-chain transaction on behalf of `payment.payee`.
 */
export type VoidParams = components['schemas']['PaymentRequest']

/**
 * Body for `payments.release()`.
 *
 * Release is permissionless — anyone may call it once `authorizationExpiry` has
 * passed without a capture, returning escrowed funds to the payer.
 */
export type ReleaseParams = components['schemas']['PaymentRequest']

/**
 * Body for `payments.refund()`.
 * The API submits the on-chain transaction on behalf of `payment.payee`.
 * Must be called before `refundExpiry`.
 */
export type RefundParams = components['schemas']['PaymentWithAmountRequest']

// ================================================================
//  Response shapes
// ================================================================

/** Full on-chain state returned by `payments.get()`. */
export type PaymentResponse = components['schemas']['PaymentResponse']

/**
 * Returned by every write operation. The transaction has been submitted to
 * the network but may still be pending confirmation on-chain.
 */
export type TransactionResponse = components['schemas']['TransactionResponse']

/** `"pending" | "confirmed" | "failed"` — confirmation status of a submitted transaction. */
export type TransactionStatus = TransactionResponse['status']

/** Returned by `tokens.isAccepted()`. */
export type TokenStatusResponse =
  operations['isAcceptedToken']['responses']['200']['content']['application/json']

/** EIP-712 digest of a Payment struct, returned by `payments.hash()`. */
export type HashResponse =
  operations['hashPayment']['responses']['200']['content']['application/json']

/**
 * Returned by `payments.authorizeNonce()` and `payments.chargeNonce()`.
 *
 * Pass the nonce value into `signAuthorize()` or `signCharge()` when building
 * the EIP-3009 `transferWithAuthorization` signature.
 */
export type NonceResponse =
  operations['authorizeNonce']['responses']['200']['content']['application/json']

/** EIP-712 domain separator of the RAIL0 contract, returned by `utils.domainSeparator()`. */
export type DomainSeparatorResponse =
  operations['domainSeparator']['responses']['200']['content']['application/json']

/** Contract version number, returned by `utils.version()`. */
export type VersionResponse =
  operations['version']['responses']['200']['content']['application/json']

// ================================================================
//  Error
// ================================================================

/**
 * Shape of error responses from the RAIL0 API.
 * Also exposed as properties on `Rail0ApiError` instances.
 */
export type ApiErrorBody = components['schemas']['ErrorResponse']
