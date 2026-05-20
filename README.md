# @rail0/sdk

TypeScript SDK for the [RAIL0](https://github.com/your-org/rail0) stablecoin payment API.

RAIL0 is an immutable smart contract that brings the authorize → capture → refund lifecycle of card networks to stablecoin payments — no intermediaries, no protocol fee, no permission required. This SDK wraps the REST API that sits in front of the contract, giving you fully-typed access to every operation from any TypeScript or JavaScript environment.

## Requirements

- Node.js ≥ 22
- TypeScript ≥ 6 (for TypeScript projects)

## Installation

```bash
npm install @rail0/sdk
# or
pnpm add @rail0/sdk
```

## Quick start

```typescript
import { Rail0Client } from '@rail0/sdk'
import type { Payment } from '@rail0/sdk'

const client = new Rail0Client({ baseUrl: 'https://api.rail0.xyz' })

const now = Math.floor(Date.now() / 1000)

const payment: Payment = {
  payer:               '0xBuyer...',
  payee:               '0xMerchant...',
  token:               '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  amount:              '100000000', // 100 USDC (6 decimals)
  authorizationExpiry: now + 3600 * 24,     // 24 h to capture
  refundExpiry:        now + 3600 * 24 * 7, // 7-day refund window
  feeBps:              50,                  // 0.5 % to feeReceiver
  feeReceiver:         '0xFeeReceiver...',
}

const paymentId = '0xabc...' // your unique identifier for this payment

// Step 1 — buyer locks funds in escrow
await client.payments.authorize(paymentId, {
  payment,
  amount: '50000000', // 50 USDC
  caller: payment.payer,
})

// Step 2 — merchant releases them
await client.payments.capture(paymentId, {
  payment,
  amount: '50000000',
  caller: payment.payee,
})
```

## Payment lifecycle

A payment moves through two sequential time windows defined at creation time.

```text
                  preApprovalExpiry    authorizationExpiry    refundExpiry
                         │                     │                   │
  ───────────────────────┼─────────────────────┼───────────────────┼────▶ time
   authorize / charge     │   capture / void     │   refund          │
                          │   reclaim (buyer)    │
```

| Operation | Caller | What it does |
| --------- | ------ | ------------ |
| `authorize` | payer | Locks `amount` in escrow |
| `charge` | payer | Authorize + capture in one transaction |
| `capture` | payee | Moves escrowed funds to the merchant |
| `void` | payee | Cancels the hold, returns funds to the buyer |
| `reclaim` | payer | Reclaims escrow after `authorizationExpiry` if never captured |
| `refund` | payee | Pulls captured funds back from the merchant to the buyer |

## API reference

### `new Rail0Client(options)`

```typescript
const client = new Rail0Client({
  baseUrl: 'https://api.rail0.xyz',
  headers: { Authorization: 'Bearer ...' }, // optional
  timeout: 30_000,                          // ms, default 30 000
  maxRetries: 3,                            // optional, default 0 (no retry)
  retryDelay: 200,                          // ms base delay, doubles each attempt, default 200
  logger: debugLogger,                      // optional — see Logging
})
```

---

### Logging

Pass any function matching `(entry: LogEntry) => void` as `logger` to receive structured log entries for every request.

```typescript
import { Rail0Client, debugLogger } from '@rail0/sdk'

// Built-in logger — writes to console.debug
const client = new Rail0Client({
  baseUrl: 'https://api.rail0.xyz',
  logger: debugLogger,
})
```

Output format:

```text
[rail0] POST 202 https://api.rail0.xyz/payments/0x.../authorize 87ms → { ... } ← { ... }
[rail0] ERROR GET https://api.rail0.xyz/payments/0x... 30001ms ! AbortError: The operation was aborted
```

To integrate with an existing logger (pino, winston, etc.), pass a custom function:

```typescript
import pino from 'pino'
import type { LogEntry } from '@rail0/sdk'

const log = pino()

const client = new Rail0Client({
  baseUrl: 'https://api.rail0.xyz',
  logger: (entry: LogEntry) => {
    if (entry.error) {
      log.error(entry, 'rail0 request failed')
    } else {
      log.debug(entry, 'rail0 request')
    }
  },
})
```

`LogEntry` fields:

| Field | Type | Present |
| ----- | ---- | ------- |
| `method` | `string` | always |
| `url` | `string` | always |
| `durationMs` | `number` | always |
| `requestBody` | `unknown` | POST requests |
| `status` | `number` | when a response was received |
| `responseBody` | `unknown` | when a response was received |
| `error` | `unknown` | on HTTP errors and network failures |

---

### `client.payments`

#### `.get(paymentId)`

Returns the on-chain state and configuration hash for a payment.

```typescript
const { state, configHash } = await client.payments.get(paymentId)
// state: { exists, capturableAmount, refundableAmount }
```

#### `.authorize(paymentId, params)`

Locks `amount` from the buyer into escrow. The buyer must be the `caller`.

```typescript
await client.payments.authorize(paymentId, {
  payment,
  amount: '50000000',
  caller: payment.payer,
  permit,   // optional EIP-2612 signature — omit if buyer has a standing approval
})
```

#### `.charge(paymentId, params)`

Authorize and capture in one transaction. Funds go directly to the merchant with no hold period. The buyer must be the `caller`.

```typescript
await client.payments.charge(paymentId, {
  payment,
  amount: '50000000',
  caller: payment.payer,
  permit,   // optional
})
```

#### `.capture(paymentId, params)`

Moves escrowed funds to the merchant. The merchant must be the `caller`. Must be called before `authorizationExpiry`. Can be called multiple times for partial captures.

```typescript
await client.payments.capture(paymentId, {
  payment,
  amount: '50000000',
  caller: payment.payee,
})
```

#### `.void(paymentId, params)`

Cancels an authorization and returns all escrowed funds to the buyer. The merchant must be the `caller`.

```typescript
await client.payments.void(paymentId, {
  payment,
  caller: payment.payee,
})
```

#### `.reclaim(paymentId, params)`

Returns escrowed funds to the buyer after `authorizationExpiry` has passed and no capture occurred. The buyer must be the `caller`.

```typescript
await client.payments.reclaim(paymentId, {
  payment,
  caller: payment.payer,
})
```

#### `.refund(paymentId, params)`

Pulls previously captured funds back from the merchant to the buyer. The merchant must be the `caller` and must be called before `refundExpiry`.

Captured funds live in the merchant's wallet, not in the contract. The contract pulls them back via `transferFrom`, so the merchant needs either a standing ERC-20 approval or a `permit` signature.

```typescript
await client.payments.refund(paymentId, {
  payment,
  amount: '50000000',
  caller: payment.payee,
  permit,   // optional — avoids a separate approve transaction
})
```

#### `.hash(payment)`

Computes the EIP-712 digest of a Payment configuration. Useful for pre-computing the config hash before submitting.

```typescript
const { hash } = await client.payments.hash(payment)
```

---

### `client.tokens`

#### `.isAccepted(address)`

Returns whether a token address is in this deployment's allowlist.

```typescript
const { accepted } = await client.tokens.isAccepted('0x833589...')
```

---

### `client.utils`

#### `.domainSeparator()`

Returns the EIP-712 domain separator for the RAIL0 contract. Needed when building permit or EIP-3009 signatures off-chain.

```typescript
const { domainSeparator } = await client.utils.domainSeparator()
```

#### `.version()`

Returns the contract version number.

```typescript
const { version } = await client.utils.version() // 1
```

---

### `client.sponsor`

RAIL0Sponsor is an ERC-4337 paymaster. A sponsor pre-deposits native gas and co-signs each UserOperation so the user's smart account pays zero gas. Sponsorship is scoped to RAIL0 entry-points only — sponsors cannot be tricked into paying for unrelated transactions.

#### `.getDeposit(address)`

Returns the native-gas balance (in wei) held by the paymaster for a sponsor.

```typescript
const { balance } = await client.sponsor.getDeposit(sponsorAddress)
```

#### `.deposit(params)` / `.depositFor(params)`

Deposit native gas into the paymaster, crediting the caller's own balance or another address's balance.

```typescript
await client.sponsor.deposit({ amount: '10000000000000000', caller: sponsor })
await client.sponsor.depositFor({ sponsor, amount: '5000000000000000', caller: funder })
```

#### `.withdraw(params)`

Withdraw native gas from the caller's sponsor balance to a target address.

```typescript
await client.sponsor.withdraw({ to: recipient, amount: balance, caller: sponsor })
```

#### `.hashSponsorship(params)`

Computes the EIP-712 digest that a sponsor must sign to authorize a UserOperation. The resulting signature is appended to `paymasterAndData` before the UserOp is submitted to a bundler.

```typescript
const { hash } = await client.sponsor.hashSponsorship({
  userOpHash,
  sponsor,
  validUntil: now + 300,
  validAfter: 0,
})
// sign `hash` with the sponsor's private key, then build paymasterAndData
```

#### `.domainSeparator()` (sponsor)

Returns the EIP-712 domain separator for the RAIL0Sponsor contract.

---

## EIP-2612 permit

The `authorize`, `charge`, and `refund` methods accept an optional `permit` field. When provided, the API routes through the `permitAndAuthorize` / `permitAndCharge` / `permitAndRefund` contract entry-points, combining the ERC-20 approval and the payment operation into a single transaction. If the permit fails (e.g. the token does not support EIP-2612), the operation still proceeds if the caller has a sufficient standing approval.

```typescript
import type { PermitSignature } from '@rail0/sdk'

const permit: PermitSignature = {
  deadline: now + 300,
  v: 27,
  r: '0x...',
  s: '0x...',
}

await client.payments.authorize(paymentId, { payment, amount, caller, permit })
```

The permit is signed off-chain against the **token's** EIP-712 domain, not RAIL0's. Use viem's `signTypedData` or ethers' `_signTypedData` to produce it.

---

## Error handling

Every 4xx / 5xx response is thrown as a `Rail0ApiError`:

```typescript
import { Rail0ApiError } from '@rail0/sdk'

try {
  await client.payments.capture(paymentId, { ... })
} catch (err) {
  if (err instanceof Rail0ApiError) {
    console.error(err.status)  // HTTP status code, e.g. 422
    console.error(err.error)   // contract error name, e.g. "AuthorizationExpired"
    console.error(err.message) // human-readable description
  }
}
```

Common error codes returned by the contract:

| Error | Cause |
| ----- | ----- |
| `PaymentAlreadyExists` | `authorize` / `charge` called twice with the same `paymentId` |
| `PaymentNotFound` | `paymentId` does not exist |
| `PaymentMismatch` | `payment` config does not match the stored hash |
| `PreApprovalExpired` | `preApprovalExpiry` is in the past |
| `AuthorizationExpired` | `authorizationExpiry` is in the past (capture) |
| `AuthorizationNotExpired` | `authorizationExpiry` has not passed yet (reclaim) |
| `RefundExpired` | `refundExpiry` is in the past |
| `InvalidAmount` | `amount` is 0 |
| `InvalidCaptureAmount` | `amount` exceeds `capturableAmount` |
| `InvalidRefundAmount` | `amount` exceeds `refundableAmount` |
| `TokenNotAccepted` | token is not in this deployment's allowlist |
| `NotPayer` | caller is not `payment.payer` |
| `NotPayee` | caller is not `payment.payee` |

---

## Types

All types are generated from the OpenAPI schema and re-exported from the package root:

```typescript
import type {
  // Primitives
  Address, Bytes32, Uint256String,

  // Core model
  Payment, PaymentState, PermitSignature,

  // Request params
  AuthorizeParams, ChargeParams, CaptureParams,
  VoidParams, ReclaimParams, RefundParams,

  // Responses
  PaymentResponse, TransactionResponse, TransactionStatus,
  TokenStatusResponse, HashResponse,
  DomainSeparatorResponse, VersionResponse,

  // Sponsor
  SponsorDepositResponse,
  DepositParams, DepositForParams, WithdrawParams, HashSponsorshipParams,

  // Advanced — raw generated types
  components, operations,
} from '@rail0/sdk'
```

`components` and `operations` expose the full generated type tree for advanced use, such as deriving types for custom wrappers without repeating the schema.

---

## Development

### Tests

```bash
pnpm test
```

The test suite includes unit tests and integration tests. All HTTP calls are mocked with `vi.spyOn(globalThis, 'fetch')` — no running server is required.

### Regenerate types after an API change

```bash
# 1. Update the schema in rail0-api (sibling repo),
#    or set RAIL0_SCHEMA_PATH to point to a local file.

# 2. Regenerate src/api.ts
pnpm generate

# 3. See what broke
pnpm typecheck
```

See [`gen/README.md`](gen/README.md) for details on the generation pipeline.

### Release

```bash
pnpm release
```

Runs in sequence: `pnpm update` → `format` → `lint:fix` → `typecheck` → `test` → `build`.

---

## Project structure

```text
gen/              Generation pipeline (schema from rail0-api)

  generate.ts     regenerates src/api.ts from the schema
  README.md

src/
  api.ts          generated — never hand-edited
  vitest.d.ts     type augmentation for vitest inject()

  core/           fixed infrastructure — no schema knowledge
    error.ts      Rail0ApiError
    http.ts       HttpClient (fetch, timeout, error parsing)

  resources/      schema-dependent — review after pnpm generate
    types.ts      named type aliases over the generated schema
    payments.ts   PaymentsResource
    tokens.ts     TokensResource
    utils.ts      UtilsResource
    sponsor.ts    SponsorResource

  client.ts       Rail0Client — assembles the resources
  index.ts        public re-exports

examples/         standalone usage examples
  01-authorize-and-capture.ts
  02-charge.ts
  03-refund.ts
  04-permit.ts
  05-sponsor.ts
```

---

## License

[MIT](LICENSE)
