/**
 * One-shot payment: charge
 *
 * Combines authorize and capture in a single transaction — funds go
 * directly from the buyer to the merchant with no escrow window.
 * Use this when there is no need for a hold period (e.g. digital goods,
 * instant fulfillment).
 *
 * On-chain flow:
 *   buyer signs EIP-3009 → charge()   funds move buyer → merchant (minus fee), atomically
 */

import { Rail0ApiError, Rail0Client } from '../src/index.js'
import type { Payment } from '../src/index.js'

const client = new Rail0Client({ baseUrl: 'https://api.rail0.xyz' })

const now = Math.floor(Date.now() / 1000)

const payment: Payment = {
  payer: '0xBuyerAddress000000000000000000000000000000',
  payee: '0xMerchantAddress0000000000000000000000000000',
  token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  maxAmount: '25000000', // 25 USDC
  authorizationExpiry: now + 60 * 5, // short window — charge captures immediately
  refundExpiry: now + 60 * 60 * 24 * 30, // 30-day refund window
  feeBps: 0, // no fee
  feeReceiver: '0x0000000000000000000000000000000000000000',
}

const PAYMENT_ID = '0xdeadbeef00000000000000000000000000000000000000000000000000000001' as const

// Fetch the charge nonce (different from the authorize nonce).
const { nonce } = await client.payments.chargeNonce(PAYMENT_ID, payment.payer)

// The buyer signs transferWithAuthorization off-chain (pseudocode):
//
//   const sig = await walletClient.signTypedData({
//     domain: { name: 'USD Coin', chainId: 8453, verifyingContract: payment.token },
//     types: { TransferWithAuthorization: [...] },
//     primaryType: 'TransferWithAuthorization',
//     message: {
//       from: payment.payer, to: RAIL0_CONTRACT_ADDRESS,
//       value: BigInt('25000000'), validAfter: 0, validBefore: payment.authorizationExpiry,
//       nonce,
//     },
//   })

try {
  const tx = await client.payments.charge(PAYMENT_ID, {
    payment,
    amount: '25000000', // 25 USDC — exact amount, no hold
    v: 27, // from signature
    r: '0x1111111111111111111111111111111111111111111111111111111111111111',
    s: '0x2222222222222222222222222222222222222222222222222222222222222222',
  })

  console.log('Charged:', tx.transactionHash, '— status:', tx.status)
  console.log('nonce used:', nonce)
} catch (err) {
  if (err instanceof Rail0ApiError) {
    console.error(`Charge failed [${err.error}]:`, err.message)
  }
  throw err
}
