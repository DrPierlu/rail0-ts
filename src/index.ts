export { Rail0Client } from './client.js'

export {
  signTransferWithAuthorization,
  signAuthorize,
  signCharge,
} from './signing.js'
export type {
  TokenDomain,
  Eip3009Signature,
  SignTransferParams,
  SignPaymentParams,
} from './signing.js'

export { stablecoins, chainInfo, eip3009Tokens, eip2612Tokens } from './stablecoins.js'
export type { StablecoinInfo, StablecoinChain, StablecoinSymbol } from './stablecoins.js'
export type { Rail0ClientOptions } from './client.js'

export { Rail0ApiError } from './core/error.js'

export { debugLogger } from './core/http.js'
export type { Logger, LogEntry } from './core/http.js'

export type {
  // Primitives
  Address,
  Bytes32,
  Uint256String,
  // Core model
  Payment,
  PaymentState,
  // Request params
  AuthorizeParams,
  ChargeParams,
  CaptureParams,
  VoidParams,
  ReleaseParams,
  RefundParams,
  // Response shapes
  PaymentResponse,
  TransactionResponse,
  TransactionStatus,
  TokenStatusResponse,
  HashResponse,
  NonceResponse,
  DomainSeparatorResponse,
  VersionResponse,
  ApiErrorBody,
  // Generated internals (advanced use)
  components,
  operations,
} from './resources/types.js'
