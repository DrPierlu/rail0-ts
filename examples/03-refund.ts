/**
 * Refund flow
 *
 * After a capture (or charge) the merchant can refund up to the full
 * captured amount back to the buyer, as long as refundExpiry has not
 * passed and the refundableAmount is sufficient.
 *
 * The refund is initiated by the payee (merchant). The API submits the
 * transaction on behalf of the payee — no signature needed beyond
 * the authentication used to call this API.
 *
 * On-chain flow:
 *   merchant → refund()   funds move merchant → buyer
 */

import { Rail0ApiError, Rail0Client } from '../src/index.js'
import type { Payment } from '../src/index.js'

const client = new Rail0Client({ baseUrl: 'https://api.rail0.xyz' })

const now = Math.floor(Date.now() / 1000)

const payment: Payment = {
  payer: '0xBuyerAddress000000000000000000000000000000',
  payee: '0xMerchantAddress0000000000000000000000000000',
  token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  maxAmount: '100000000',
  authorizationExpiry: now - 30 * 60, // already captured
  refundExpiry: now + 60 * 60 * 24 * 6, // still within refund window
  feeBps: 50,
  feeReceiver: '0xFeeReceiverAddress000000000000000000000000',
}

const PAYMENT_ID = '0xdeadbeef00000000000000000000000000000000000000000000000000000002' as const

// ----------------------------------------------------------------
// Check current refundable balance before acting
// ----------------------------------------------------------------

const { state } = await client.payments.get(PAYMENT_ID)
console.log('Refundable balance:', state.refundableAmount) // e.g. "50000000"

// ----------------------------------------------------------------
// Refund — partial or full
// ----------------------------------------------------------------

try {
  const tx = await client.payments.refund(PAYMENT_ID, {
    payment,
    amount: '50000000', // partial refund — 50 USDC out of 50 captured
  })

  console.log('Refunded:', tx.transactionHash)
} catch (err) {
  if (err instanceof Rail0ApiError) {
    // Common errors: RefundExpired, InvalidRefundAmount, NotPayee
    console.error(`Refund failed [${err.error}]:`, err.message)
  }
  throw err
}
