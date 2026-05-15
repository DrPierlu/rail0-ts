/**
 * Building an EIP-3009 transferWithAuthorization signature
 *
 * RAIL0 uses EIP-3009 (transferWithAuthorization) for buyer-initiated
 * operations (authorize, charge). The buyer signs a typed message
 * off-chain — no prior approve() transaction needed.
 *
 * This example shows how to build the correct signature parameters
 * using the nonce endpoints and viem's signTypedData.
 *
 * EIP-3009 typed data:
 *   domain: the token's EIP-712 domain (name, version, chainId, verifyingContract)
 *   type:   TransferWithAuthorization
 *   message: { from, to, value, validAfter, validBefore, nonce }
 */

import { Rail0Client } from '../src/index.js'
import type { Payment } from '../src/index.js'

const client = new Rail0Client({ baseUrl: 'https://api.rail0.xyz' })

const now = Math.floor(Date.now() / 1000)

const payment: Payment = {
  payer: '0xBuyerAddress000000000000000000000000000000',
  payee: '0xMerchantAddress0000000000000000000000000000',
  token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base (supports EIP-3009)
  maxAmount: '75000000',
  authorizationExpiry: now + 60 * 60 * 24,
  refundExpiry: now + 60 * 60 * 24 * 7,
  feeBps: 0,
  feeReceiver: '0x0000000000000000000000000000000000000000',
}

const PAYMENT_ID = '0xdeadbeef00000000000000000000000000000000000000000000000000000003' as const
const AMOUNT = '75000000'
const RAIL0_CONTRACT_ADDRESS = '0x...' as const // deployed RAIL0 contract address

// ----------------------------------------------------------------
// 1. Fetch the per-payment nonce from the contract.
//    The authorize nonce and charge nonce are separate — use the one
//    that matches the operation you intend to call.
// ----------------------------------------------------------------

const { nonce: authorizeNonce } = await client.payments.authorizeNonce(PAYMENT_ID, payment.payer)

console.log('Authorize nonce:', authorizeNonce)

// ----------------------------------------------------------------
// 2. Sign transferWithAuthorization off-chain (viem pseudocode).
//    Replace with ethers.js or another signer library as needed.
// ----------------------------------------------------------------

// const signature = await walletClient.signTypedData({
//   domain: {
//     name: 'USD Coin',          // token's EIP-712 name
//     version: '2',              // token's EIP-712 version
//     chainId: 8453,             // Base mainnet
//     verifyingContract: payment.token,
//   },
//   types: {
//     TransferWithAuthorization: [
//       { name: 'from',         type: 'address' },
//       { name: 'to',           type: 'address' },
//       { name: 'value',        type: 'uint256' },
//       { name: 'validAfter',   type: 'uint256' },
//       { name: 'validBefore',  type: 'uint256' },
//       { name: 'nonce',        type: 'bytes32' },
//     ],
//   },
//   primaryType: 'TransferWithAuthorization',
//   message: {
//     from:        payment.payer,
//     to:          RAIL0_CONTRACT_ADDRESS,
//     value:       BigInt(AMOUNT),
//     validAfter:  0n,
//     validBefore: BigInt(payment.authorizationExpiry),
//     nonce:       authorizeNonce,
//   },
// })
//
// const { v, r, s } = parseSignature(signature)

// ----------------------------------------------------------------
// 3. Authorize — no approve() transaction needed.
// ----------------------------------------------------------------

const authTx = await client.payments.authorize(PAYMENT_ID, {
  payment,
  amount: AMOUNT,
  v: 27, // replace with v from signature
  r: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  s: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
})

console.log('Authorized:', authTx.transactionHash)
console.log('RAIL0_CONTRACT_ADDRESS placeholder used:', RAIL0_CONTRACT_ADDRESS)
