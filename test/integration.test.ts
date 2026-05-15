import { afterEach, describe, expect, it, vi } from 'vitest'
import { Rail0Client } from '../src/index.js'
import type { Payment } from '../src/index.js'

const BASE_URL = 'http://localhost:3000'

const PAYMENT_ID = '0x1111111111111111111111111111111111111111111111111111111111111111' as const
const PAYER = '0xBuyerAddress000000000000000000000000000000' as const
const PAYEE = '0xMerchantAddress0000000000000000000000000000' as const

const PAYMENT: Payment = {
  payer: PAYER,
  payee: PAYEE,
  token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  maxAmount: '100000000',
  authorizationExpiry: 9999999999,
  refundExpiry: 9999999999,
  feeBps: 0,
  feeReceiver: '0x0000000000000000000000000000000000000000',
}

const SIG = {
  v: 27 as const,
  r: '0x1111111111111111111111111111111111111111111111111111111111111111' as const,
  s: '0x2222222222222222222222222222222222222222222222222222222222222222' as const,
}

const TX_HASH = `0x${'ab'.repeat(32)}`
const NONCE = `0x${'cc'.repeat(32)}`
const CONFIG_HASH = `0x${'ff'.repeat(32)}`
const DOMAIN_SEP = `0x${'ee'.repeat(32)}`

function client() {
  return new Rail0Client({ baseUrl: BASE_URL })
}

function ok(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

// ================================================================
//  Payments
// ================================================================

describe('payments', () => {
  it('GET /payments/:paymentId returns state and configHash', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      ok({
        state: { exists: true, capturableAmount: '50000000', refundableAmount: '0' },
        configHash: CONFIG_HASH,
      }),
    )
    const res = await client().payments.get(PAYMENT_ID)

    expect(res).toMatchObject({
      state: {
        exists: expect.any(Boolean),
        capturableAmount: expect.any(String),
        refundableAmount: expect.any(String),
      },
      configHash: expect.stringMatching(/^0x[0-9a-f]{64}$/i),
    })
  })

  it('POST authorize returns a pending transaction', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      ok({ transactionHash: TX_HASH, status: 'pending' }),
    )
    const res = await client().payments.authorize(PAYMENT_ID, {
      payment: PAYMENT,
      amount: '50000000',
      ...SIG,
    })

    expect(res.transactionHash).toMatch(/^0x[0-9a-f]{64}$/i)
    expect(['pending', 'confirmed', 'failed']).toContain(res.status)
  })

  it('POST charge returns a pending transaction', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      ok({ transactionHash: TX_HASH, status: 'pending' }),
    )
    const res = await client().payments.charge(PAYMENT_ID, {
      payment: PAYMENT,
      amount: '50000000',
      ...SIG,
    })

    expect(res.transactionHash).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  it('POST capture returns a pending transaction', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      ok({ transactionHash: TX_HASH, status: 'pending' }),
    )
    const res = await client().payments.capture(PAYMENT_ID, {
      payment: PAYMENT,
      amount: '50000000',
    })

    expect(res.transactionHash).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  it('POST void returns a pending transaction', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      ok({ transactionHash: TX_HASH, status: 'pending' }),
    )
    const res = await client().payments.void(PAYMENT_ID, {
      payment: PAYMENT,
    })

    expect(res.transactionHash).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  it('POST release returns a pending transaction', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      ok({ transactionHash: TX_HASH, status: 'pending' }),
    )
    const res = await client().payments.release(PAYMENT_ID, {
      payment: PAYMENT,
    })

    expect(res.transactionHash).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  it('POST refund returns a pending transaction', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      ok({ transactionHash: TX_HASH, status: 'pending' }),
    )
    const res = await client().payments.refund(PAYMENT_ID, {
      payment: PAYMENT,
      amount: '50000000',
    })

    expect(res.transactionHash).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  it('GET authorize-nonce returns a bytes32', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(ok({ nonce: NONCE }))
    const res = await client().payments.authorizeNonce(PAYMENT_ID, PAYER)

    expect(res.nonce).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  it('GET charge-nonce returns a bytes32', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(ok({ nonce: NONCE }))
    const res = await client().payments.chargeNonce(PAYMENT_ID, PAYER)

    expect(res.nonce).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  it('POST /payments/hash returns a bytes32 digest', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      ok({ hash: `0x${'dd'.repeat(32)}` }),
    )
    const res = await client().payments.hash(PAYMENT)

    expect(res.hash).toMatch(/^0x[0-9a-f]{64}$/i)
  })
})

// ================================================================
//  Tokens
// ================================================================

describe('tokens', () => {
  it('GET /tokens/:address returns acceptance status', async () => {
    const token = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      ok({ address: token, accepted: true }),
    )
    const res = await client().tokens.isAccepted(token)

    expect(res.address).toBe(token)
    expect(typeof res.accepted).toBe('boolean')
  })
})

// ================================================================
//  Utils
// ================================================================

describe('utils', () => {
  it('GET /domain-separator returns a bytes32', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      ok({ domainSeparator: DOMAIN_SEP }),
    )
    const res = await client().utils.domainSeparator()

    expect(res.domainSeparator).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  it('GET /version returns a positive integer', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(ok({ version: 1 }))
    const res = await client().utils.version()

    expect(Number.isInteger(res.version)).toBe(true)
    expect(res.version).toBeGreaterThan(0)
  })
})
