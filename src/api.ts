export interface paths {
    "/payments/{paymentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get payment state
         * @description Returns the on-chain mutable state (capturableAmount, refundableAmount, exists) and config hash for a payment.
         */
        get: operations["getPayment"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{paymentId}/authorize": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Authorize
         * @description Pull `amount` from the payer into escrow. The v/r/s fields are the EIP-3009 transferWithAuthorization signature signed by the payer.
         */
        post: operations["authorize"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{paymentId}/charge": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Charge (one-shot)
         * @description Authorize and immediately capture in a single transaction — funds go directly to the payee. The v/r/s fields are the EIP-3009 transferWithAuthorization signature signed by the payer.
         */
        post: operations["charge"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{paymentId}/capture": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Capture
         * @description Move escrowed funds to the payee. Caller must be the payee.
         */
        post: operations["capture"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{paymentId}/void": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Void
         * @description Cancel an authorization, returning all escrowed funds to the payer. Caller must be the payee.
         */
        post: operations["void"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{paymentId}/release": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Release
         * @description Return escrowed funds to the payer after authorizationExpiry has passed without a capture. Permissionless — anyone can call.
         */
        post: operations["release"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{paymentId}/refund": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Refund
         * @description Return a previously captured amount from the payee to the payer. Caller must be the payee. Must be called before refundExpiry.
         */
        post: operations["refund"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{paymentId}/authorize-nonce": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Authorize nonce
         * @description Returns the EIP-3009 nonce the payer must include in the transferWithAuthorization signature for an authorize call.
         */
        get: operations["authorizeNonce"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{paymentId}/charge-nonce": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Charge nonce
         * @description Returns the EIP-3009 nonce the payer must include in the transferWithAuthorization signature for a charge call.
         */
        get: operations["chargeNonce"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/hash": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Hash a Payment configuration
         * @description Compute the canonical EIP-712 digest of a Payment struct. Useful to pre-compute the config hash before calling authorize or charge.
         */
        post: operations["hashPayment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tokens/{address}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Check accepted token
         * @description Returns whether the given ERC-20 token address is in this deployment's immutable allowlist.
         */
        get: operations["isAcceptedToken"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/domain-separator": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** EIP-712 domain separator */
        get: operations["domainSeparator"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/version": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Contract version */
        get: operations["version"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @example 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 */
        Address: string;
        /** @example 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab */
        Bytes32: string;
        /**
         * @description Unsigned 256-bit integer serialised as a decimal string to avoid JS precision loss.
         * @example 1000000
         */
        Uint256String: string;
        /** @description Immutable payment configuration committed on the first authorize or charge call. */
        Payment: {
            /** @description Buyer address. Signs the EIP-3009 authorization for authorize / charge. */
            payer: components["schemas"]["Address"];
            /** @description Merchant address. Must call capture / void / refund. */
            payee: components["schemas"]["Address"];
            /** @description ERC-20 token address. Must be in this deployment's allowlist and support EIP-3009. */
            token: components["schemas"]["Address"];
            /** @description Upper bound on what can be authorized (fits in uint120 on-chain). */
            maxAmount: components["schemas"]["Uint256String"];
            /**
             * Format: int64
             * @description Unix timestamp after which capture is rejected and release opens.
             */
            authorizationExpiry: number;
            /**
             * Format: int64
             * @description Unix timestamp after which refund is rejected.
             */
            refundExpiry: number;
            /** @description Protocol fee in basis points (0 = no fee). When >0, feeReceiver must be non-zero. */
            feeBps: number;
            /** @description Address that receives the protocol fee. Must be zero when feeBps is 0. */
            feeReceiver: components["schemas"]["Address"];
        };
        /** @description Request body for operations that only need the Payment configuration (void, release). */
        PaymentRequest: {
            payment: components["schemas"]["Payment"];
        };
        /** @description Request body for operations that need the Payment configuration and an amount (capture, refund). */
        PaymentWithAmountRequest: {
            payment: components["schemas"]["Payment"];
            /** @description Amount to process (must be > 0). */
            amount: components["schemas"]["Uint256String"];
        };
        /** @description Request body for authorize and charge. The v/r/s fields are the EIP-3009 transferWithAuthorization signature signed by the payer. */
        AuthorizeRequest: {
            payment: components["schemas"]["Payment"];
            /** @description Amount to pull into escrow (must be > 0 and ≤ maxAmount). */
            amount: components["schemas"]["Uint256String"];
            /** @description Recovery identifier from the EIP-3009 signature. */
            v: number;
            /** @description r component of the EIP-3009 signature. */
            r: components["schemas"]["Bytes32"];
            /** @description s component of the EIP-3009 signature. */
            s: components["schemas"]["Bytes32"];
        };
        /** @description On-chain mutable state for a payment. Packed in one storage slot. */
        PaymentState: {
            /** @description True once a payment has been created via authorize or charge. */
            exists: boolean;
            /** @description Funds currently held in escrow, available for capture or release. */
            capturableAmount: components["schemas"]["Uint256String"];
            /** @description Funds already disbursed to the payee and still eligible for refund. */
            refundableAmount: components["schemas"]["Uint256String"];
        };
        PaymentResponse: {
            paymentId: components["schemas"]["Bytes32"];
            state: components["schemas"]["PaymentState"];
            /** @description EIP-712 digest of the Payment configuration committed on creation. */
            configHash: components["schemas"]["Bytes32"];
        };
        /** @description Returned for every write operation. The transaction may still be pending. */
        TransactionResponse: {
            transactionHash: components["schemas"]["Bytes32"];
            /** @enum {string} */
            status: "pending" | "confirmed" | "failed";
        };
        ErrorResponse: {
            /** @example PaymentNotFound */
            error: string;
            /** @example No payment exists for the given paymentId. */
            message: string;
        };
    };
    responses: {
        /** @description Transaction submitted successfully. */
        TransactionAccepted: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["TransactionResponse"];
            };
        };
        /** @description Payment not found. */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "error": "PaymentNotFound",
                 *       "message": "No payment exists for the given paymentId."
                 *     }
                 */
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Payment already exists. */
        Conflict: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "error": "PaymentAlreadyExists",
                 *       "message": "A payment with this paymentId has already been authorized or charged."
                 *     }
                 */
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Validation failed or contract reverted. */
        UnprocessableEntity: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "error": "AuthorizationExpired",
                 *       "message": "The authorizationExpiry timestamp has passed."
                 *     }
                 */
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
    };
    parameters: {
        /** @description Caller-supplied unique payment identifier (bytes32, hex-encoded) */
        PaymentId: components["schemas"]["Bytes32"];
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getPayment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Caller-supplied unique payment identifier (bytes32, hex-encoded) */
                paymentId: components["parameters"]["PaymentId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Payment found */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentResponse"];
                };
            };
            404: components["responses"]["NotFound"];
        };
    };
    authorize: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Caller-supplied unique payment identifier (bytes32, hex-encoded) */
                paymentId: components["parameters"]["PaymentId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AuthorizeRequest"];
            };
        };
        responses: {
            202: components["responses"]["TransactionAccepted"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["UnprocessableEntity"];
        };
    };
    charge: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Caller-supplied unique payment identifier (bytes32, hex-encoded) */
                paymentId: components["parameters"]["PaymentId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AuthorizeRequest"];
            };
        };
        responses: {
            202: components["responses"]["TransactionAccepted"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["UnprocessableEntity"];
        };
    };
    capture: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Caller-supplied unique payment identifier (bytes32, hex-encoded) */
                paymentId: components["parameters"]["PaymentId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PaymentWithAmountRequest"];
            };
        };
        responses: {
            202: components["responses"]["TransactionAccepted"];
            404: components["responses"]["NotFound"];
            422: components["responses"]["UnprocessableEntity"];
        };
    };
    void: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Caller-supplied unique payment identifier (bytes32, hex-encoded) */
                paymentId: components["parameters"]["PaymentId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PaymentRequest"];
            };
        };
        responses: {
            202: components["responses"]["TransactionAccepted"];
            404: components["responses"]["NotFound"];
            422: components["responses"]["UnprocessableEntity"];
        };
    };
    release: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Caller-supplied unique payment identifier (bytes32, hex-encoded) */
                paymentId: components["parameters"]["PaymentId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PaymentRequest"];
            };
        };
        responses: {
            202: components["responses"]["TransactionAccepted"];
            404: components["responses"]["NotFound"];
            422: components["responses"]["UnprocessableEntity"];
        };
    };
    refund: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Caller-supplied unique payment identifier (bytes32, hex-encoded) */
                paymentId: components["parameters"]["PaymentId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PaymentWithAmountRequest"];
            };
        };
        responses: {
            202: components["responses"]["TransactionAccepted"];
            404: components["responses"]["NotFound"];
            422: components["responses"]["UnprocessableEntity"];
        };
    };
    authorizeNonce: {
        parameters: {
            query: {
                /** @description Payer address */
                payer: components["schemas"]["Address"];
            };
            header?: never;
            path: {
                /** @description Caller-supplied unique payment identifier (bytes32, hex-encoded) */
                paymentId: components["parameters"]["PaymentId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Nonce */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        nonce: components["schemas"]["Bytes32"];
                    };
                };
            };
        };
    };
    chargeNonce: {
        parameters: {
            query: {
                /** @description Payer address */
                payer: components["schemas"]["Address"];
            };
            header?: never;
            path: {
                /** @description Caller-supplied unique payment identifier (bytes32, hex-encoded) */
                paymentId: components["parameters"]["PaymentId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Nonce */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        nonce: components["schemas"]["Bytes32"];
                    };
                };
            };
        };
    };
    hashPayment: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Payment"];
            };
        };
        responses: {
            /** @description EIP-712 digest */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        hash: components["schemas"]["Bytes32"];
                    };
                };
            };
        };
    };
    isAcceptedToken: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ERC-20 token contract address */
                address: components["schemas"]["Address"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Token status */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        address: components["schemas"]["Address"];
                        accepted: boolean;
                    };
                };
            };
        };
    };
    domainSeparator: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Domain separator */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        domainSeparator: components["schemas"]["Bytes32"];
                    };
                };
            };
        };
    };
    version: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Version number */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 6 */
                        version: number;
                    };
                };
            };
        };
    };
}
