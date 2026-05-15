/**
 * Standard two-step payment flow: authorize → capture
 *
 * The buyer locks funds in escrow using an EIP-3009 signature (authorize).
 * The merchant releases them once the order is fulfilled (capture).
 * If something goes wrong before capture the merchant can void,
 * or anyone can call release after authorizationExpiry.
 *
 * On-chain flow:
 *   buyer signs EIP-3009 → authorize()   funds move buyer → escrow
 *   merchant             → capture()     funds move escrow → merchant (minus fee)
 *   merchant             → void()        alternative: funds move escrow → buyer
 *   anyone               → release()     fallback after authorizationExpiry
 */

import { Rail0ApiError, Rail0Client } from '../src/index.js'
import type { Payment } from '../src/index.js'

const client = new Rail0Client({ baseUrl: 'https://api.rail0.xyz' })

// ----------------------------------------------------------------
// Shared payment configuration
// A unique ID for this payment — in practice derive it from your
// order ID, e.g. keccak256(abi.encode("order", orderId)).
// ----------------------------------------------------------------

const PAYMENT_ID = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as const

const now = Math.floor(Date.now() / 1000)

const payment: Payment = {
  payer: '0xBuyerAddress000000000000000000000000000000',
  payee: '0xMerchantAddress0000000000000000000000000000',
  token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  maxAmount: '100000000', // 100 USDC (6 decimals)
  authorizationExpiry: now + 60 * 60 * 24, // merchant has 24 h to capture
  refundExpiry: now + 60 * 60 * 24 * 7, // refund window: 7 days
  feeBps: 50, // 0.5% protocol fee
  feeReceiver: '0xFeeReceiverAddress000000000000000000000000',
}

// ----------------------------------------------------------------
// Step 1 — Buyer fetches the authorize nonce, signs EIP-3009, calls authorize
// ----------------------------------------------------------------

// Fetch the nonce the EIP-3009 signature must use.
const { nonce } = await client.payments.authorizeNonce(PAYMENT_ID, payment.payer)

// The buyer builds and signs transferWithAuthorization off-chain (pseudocode):
//
//   const sig = await walletClient.signTypedData({
//     domain: { name: 'USD Coin', chainId: 8453, verifyingContract: payment.token },
//     types: { TransferWithAuthorization: [...] },
//     primaryType: 'TransferWithAuthorization',
//     message: {
//       from: payment.payer, to: RAIL0_CONTRACT_ADDRESS,
//       value: BigInt('50000000'), validAfter: 0, validBefore: payment.authorizationExpiry,
//       nonce,
//     },
//   })

try {
  const authTx = await client.payments.authorize(PAYMENT_ID, {
    payment,
    amount: '50000000', // 50 USDC
    v: 27, // from signature
    r: '0x1111111111111111111111111111111111111111111111111111111111111111',
    s: '0x2222222222222222222222222222222222222222222222222222222222222222',
  })

  console.log('Authorized:', authTx.transactionHash, '— status:', authTx.status)
  console.log('nonce used:', nonce)
} catch (err) {
  if (err instanceof Rail0ApiError) {
    // Common errors: TokenNotAccepted, InvalidAmount, PaymentAlreadyExists, AmountTooLarge
    console.error(`Authorize failed [${err.error}]:`, err.message)
  }
  throw err
}

// ----------------------------------------------------------------
// Step 2a — Merchant captures 50 USDC (happy path)
// ----------------------------------------------------------------

try {
  const captureTx = await client.payments.capture(PAYMENT_ID, {
    payment,
    amount: '50000000',
  })

  console.log('Captured:', captureTx.transactionHash)
} catch (err) {
  if (err instanceof Rail0ApiError) {
    // Common errors: AuthorizationExpired, InvalidCaptureAmount, PaymentMismatch
    console.error(`Capture failed [${err.error}]:`, err.message)
  }
  throw err
}

// ----------------------------------------------------------------
// Step 2b — Merchant voids (alternative: order cancelled)
// Uncomment to use instead of capture.
// ----------------------------------------------------------------

// const voidTx = await client.payments.void(PAYMENT_ID, { payment })
// console.log('Voided:', voidTx.transactionHash)

// ----------------------------------------------------------------
// Step 2c — Release (fallback: merchant never captured)
// Only callable after authorizationExpiry. Anyone can call this.
// ----------------------------------------------------------------

// const releaseTx = await client.payments.release(PAYMENT_ID, { payment })
// console.log('Released:', releaseTx.transactionHash)

// ----------------------------------------------------------------
// Inspect on-chain state at any point
// ----------------------------------------------------------------

const state = await client.payments.get(PAYMENT_ID)
console.log('Payment state:', state.state)
// { exists: true, capturableAmount: '0', refundableAmount: '50000000' }
