/**
 * Payment hash and state inspection
 *
 * The hashPayment endpoint computes the canonical EIP-712 digest of a
 * Payment configuration. This is useful to verify that the configHash
 * stored on-chain matches the payment parameters you have locally —
 * confirming neither party has tampered with the configuration.
 *
 * The configHash is committed on the first authorize or charge call
 * and cannot change for the lifetime of that payment.
 */

import { Rail0Client } from '../src/index.js'
import type { Payment } from '../src/index.js'

const client = new Rail0Client({ baseUrl: 'https://api.rail0.xyz' })

const now = Math.floor(Date.now() / 1000)

const PAYMENT_ID = '0xdeadbeef00000000000000000000000000000000000000000000000000000005' as const

const payment: Payment = {
  payer: '0xBuyerAddress000000000000000000000000000000',
  payee: '0xMerchantAddress0000000000000000000000000000',
  token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  maxAmount: '50000000',
  authorizationExpiry: now + 60 * 60 * 48,
  refundExpiry: now + 60 * 60 * 24 * 14,
  feeBps: 100,
  feeReceiver: '0xFeeReceiverAddress000000000000000000000000',
}

// ----------------------------------------------------------------
// 1. Compute the EIP-712 digest before authorizing.
//    Share this with both parties so they can independently verify
//    the payment configuration.
// ----------------------------------------------------------------

const { hash: configHash } = await client.payments.hash(payment)
console.log('Payment config hash:', configHash)

// ----------------------------------------------------------------
// 2. Fetch on-chain state and verify the configHash matches.
// ----------------------------------------------------------------

const onChain = await client.payments.get(PAYMENT_ID)

if (onChain.configHash === configHash) {
  console.log('Config hash matches — payment parameters are intact.')
} else {
  console.error('Config hash MISMATCH — do not proceed!')
  console.error('  Expected:', configHash)
  console.error('  On-chain:', onChain.configHash)
}

console.log('Payment state:', onChain.state)
// { exists: true, capturableAmount: '50000000', refundableAmount: '0' }
