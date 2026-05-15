import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Rail0Client } from '../src/client.js'
import { Rail0ApiError } from '../src/core/error.js'
import { debugLogger } from '../src/core/http.js'
import type { LogEntry } from '../src/core/http.js'
import type { Payment } from '../src/resources/types.js'

const BASE_URL = 'http://localhost:3000'

const mockPayment: Payment = {
  payer: '0x1111111111111111111111111111111111111111',
  payee: '0x2222222222222222222222222222222222222222',
  token: '0x3333333333333333333333333333333333333333',
  maxAmount: '1000000',
  authorizationExpiry: 9999999999,
  refundExpiry: 9999999999,
  feeBps: 0,
  feeReceiver: '0x0000000000000000000000000000000000000000',
}

const mockSig = {
  v: 27 as const,
  r: '0x1111111111111111111111111111111111111111111111111111111111111111' as const,
  s: '0x2222222222222222222222222222222222222222222222222222222222222222' as const,
}

const mockPaymentId = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab'

describe('Rail0Client', () => {
  let client: Rail0Client

  beforeEach(() => {
    client = new Rail0Client({ baseUrl: BASE_URL })
    vi.restoreAllMocks()
  })

  describe('payments.get', () => {
    it('returns payment state and config hash', async () => {
      const mockResponse = {
        paymentId: mockPaymentId,
        state: { exists: true, capturableAmount: '1000000', refundableAmount: '0' },
        configHash: `0x${'ab'.repeat(32)}`,
      }
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      )

      const result = await client.payments.get(mockPaymentId)

      expect(result.paymentId).toBe(mockPaymentId)
      expect(result.state.exists).toBe(true)
      expect(result.state.capturableAmount).toBe('1000000')
    })

    it('throws Rail0ApiError on 404', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'PaymentNotFound', message: 'No payment found.' }), {
          status: 404,
        }),
      )

      await expect(client.payments.get(mockPaymentId)).rejects.toMatchObject({
        status: 404,
        error: 'PaymentNotFound',
      })
    })
  })

  describe('payments.authorize', () => {
    it('posts to the correct endpoint and returns tx', async () => {
      const mockTx = {
        transactionHash: `0x${'ff'.repeat(32)}`,
        status: 'pending',
      }
      const spy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response(JSON.stringify(mockTx), { status: 202 }))

      const result = await client.payments.authorize(mockPaymentId, {
        payment: mockPayment,
        amount: '1000000',
        ...mockSig,
      })

      expect(result.status).toBe('pending')
      expect(spy).toHaveBeenCalledWith(
        `${BASE_URL}/payments/${mockPaymentId}/authorize`,
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  describe('payments.hash', () => {
    it('posts the payment config and returns a hash', async () => {
      const mockHash = { hash: `0x${'cc'.repeat(32)}` }
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockHash), { status: 200 }),
      )

      const result = await client.payments.hash(mockPayment)

      expect(result.hash).toMatch(/^0x[0-9a-f]{64}$/i)
    })
  })

  describe('tokens.isAccepted', () => {
    it('returns token status', async () => {
      const tokenAddress = mockPayment.token
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ address: tokenAddress, accepted: true }), { status: 200 }),
      )

      const result = await client.tokens.isAccepted(tokenAddress)

      expect(result.accepted).toBe(true)
    })
  })

  describe('retry', () => {
    const mockResponse = {
      paymentId: mockPaymentId,
      state: { exists: true, capturableAmount: '1000000', refundableAmount: '0' },
      configHash: `0x${'ab'.repeat(32)}`,
    }

    it('succeeds on the third attempt after two network failures', async () => {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValueOnce(new Error('Network failure'))
        .mockRejectedValueOnce(new Error('Network failure'))
        .mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), { status: 200 }))

      client = new Rail0Client({ baseUrl: BASE_URL, maxRetries: 2, retryDelay: 0 })
      const result = await client.payments.get(mockPaymentId)

      expect(result.paymentId).toBe(mockPaymentId)
      expect(fetchSpy).toHaveBeenCalledTimes(3)
    })

    it('throws the last error after exhausting all retries', async () => {
      const networkError = new Error('Network failure')
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(networkError)

      client = new Rail0Client({ baseUrl: BASE_URL, maxRetries: 2, retryDelay: 0 })

      await expect(client.payments.get(mockPaymentId)).rejects.toBe(networkError)
      expect(fetchSpy).toHaveBeenCalledTimes(3)
    })

    it('does not retry HTTP errors', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ error: 'PaymentNotFound', message: 'Not found.' }), {
          status: 404,
        }),
      )

      client = new Rail0Client({ baseUrl: BASE_URL, maxRetries: 2, retryDelay: 0 })

      await expect(client.payments.get(mockPaymentId)).rejects.toBeInstanceOf(Rail0ApiError)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('logger receives attempt and willRetry on retried failures, then attempt on success', async () => {
      const logger = vi.fn<(entry: LogEntry) => void>()
      const networkError = new Error('Network failure')
      vi.spyOn(globalThis, 'fetch')
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), { status: 200 }))

      client = new Rail0Client({ baseUrl: BASE_URL, maxRetries: 1, retryDelay: 0, logger })
      await client.payments.get(mockPaymentId)

      expect(logger).toHaveBeenCalledTimes(2)
      const [[failEntry], [successEntry]] = logger.mock.calls as [[LogEntry], [LogEntry]]
      expect(failEntry.attempt).toBe(1)
      expect(failEntry.willRetry).toBe(true)
      expect(failEntry.error).toBe(networkError)
      expect(successEntry.attempt).toBe(2)
      expect(successEntry.willRetry).toBeUndefined()
      expect(successEntry.error).toBeUndefined()
    })
  })

  describe('Rail0ApiError', () => {
    it('exposes status and error code', () => {
      const err = new Rail0ApiError(422, { error: 'InvalidAmount', message: 'Amount is zero.' })

      expect(err.status).toBe(422)
      expect(err.error).toBe('InvalidAmount')
      expect(err.message).toBe('Amount is zero.')
      expect(err).toBeInstanceOf(Error)
    })
  })

  describe('logger', () => {
    it('receives a success entry with correct fields on GET', async () => {
      const logger = vi.fn<(entry: LogEntry) => void>()
      client = new Rail0Client({ baseUrl: BASE_URL, logger })
      const mockResponse = {
        paymentId: mockPaymentId,
        state: { exists: true, capturableAmount: '1000000', refundableAmount: '0' },
        configHash: `0x${'ab'.repeat(32)}`,
      }
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      )

      await client.payments.get(mockPaymentId)

      expect(logger).toHaveBeenCalledOnce()
      const [[entry]] = logger.mock.calls as [[LogEntry]]
      expect(entry.method).toBe('GET')
      expect(entry.url).toBe(`${BASE_URL}/payments/${mockPaymentId}`)
      expect(entry.status).toBe(200)
      expect(entry.durationMs).toBeGreaterThanOrEqual(0)
      expect(entry.responseBody).toEqual(mockResponse)
      expect(entry.requestBody).toBeUndefined()
      expect(entry.error).toBeUndefined()
    })

    it('includes requestBody on POST', async () => {
      const logger = vi.fn<(entry: LogEntry) => void>()
      client = new Rail0Client({ baseUrl: BASE_URL, logger })
      const mockTx = { transactionHash: `0x${'ff'.repeat(32)}`, status: 'pending' }
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockTx), { status: 202 }),
      )
      const params = { payment: mockPayment, amount: '1000000', ...mockSig }

      await client.payments.authorize(mockPaymentId, params)

      expect(logger).toHaveBeenCalledOnce()
      const [[entry]] = logger.mock.calls as [[LogEntry]]
      expect(entry.method).toBe('POST')
      expect(entry.status).toBe(202)
      expect(entry.requestBody).toEqual(params)
      expect(entry.error).toBeUndefined()
    })

    it('includes Rail0ApiError and response body on HTTP error', async () => {
      const logger = vi.fn<(entry: LogEntry) => void>()
      client = new Rail0Client({ baseUrl: BASE_URL, logger })
      const errorBody = { error: 'PaymentNotFound', message: 'No payment found.' }
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(errorBody), { status: 404 }),
      )

      await expect(client.payments.get(mockPaymentId)).rejects.toBeInstanceOf(Rail0ApiError)

      expect(logger).toHaveBeenCalledOnce()
      const [[entry]] = logger.mock.calls as [[LogEntry]]
      expect(entry.status).toBe(404)
      expect(entry.responseBody).toEqual(errorBody)
      expect(entry.error).toBeInstanceOf(Rail0ApiError)
    })

    it('includes the thrown error and no status on network failure', async () => {
      const logger = vi.fn<(entry: LogEntry) => void>()
      client = new Rail0Client({ baseUrl: BASE_URL, logger })
      const networkError = new Error('Network failure')
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(networkError)

      await expect(client.payments.get(mockPaymentId)).rejects.toThrow('Network failure')

      expect(logger).toHaveBeenCalledOnce()
      const [[entry]] = logger.mock.calls as [[LogEntry]]
      expect(entry.error).toBe(networkError)
      expect(entry.status).toBeUndefined()
      expect(entry.responseBody).toBeUndefined()
    })

    it('debugLogger writes a formatted line to console.debug', async () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
      client = new Rail0Client({ baseUrl: BASE_URL, logger: debugLogger })
      const mockResponse = {
        paymentId: mockPaymentId,
        state: { exists: false, capturableAmount: '0', refundableAmount: '0' },
        configHash: `0x${'00'.repeat(32)}`,
      }
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      )

      await client.payments.get(mockPaymentId)

      expect(spy).toHaveBeenCalledOnce()
      const [[message]] = spy.mock.calls as [[string, ...unknown[]]]
      expect(message).toMatch(/^\[rail0\] GET 200/)
    })
  })
})
