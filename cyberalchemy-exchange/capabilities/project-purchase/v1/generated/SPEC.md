# Exchange Purchase Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `4054bb18e8364c4e3623e32eb85b6bc5eb5ba99e46e9a4ebdc3c3c989b7b45e0`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `exchange-purchase.AtomicUnlock` | Rule | Grant, transfer and committed order change within one successful Solana transaction. |
| `exchange-purchase.DeliveryReceipt` | Entity | Existing KEP signed acknowledgement after local authenticated decryption; separate from settlement. |
| `exchange-purchase.Escrow` | Entity | Order-bound funds held pending commitment or deadline refund. |
| `exchange-purchase.ExactReadiness` | Rule | Buyer, seller and Exchange bind one preparation before Unlock. |
| `exchange-purchase.ExclusiveOutcome` | Rule | A funded order commits or refunds once; no transition may produce both. |
| `exchange-purchase.Offer` | Entity | Seller-authorized immutable terms for an exact artifact version. |
| `exchange-purchase.PaidRecovery` | Rule | Committed ownership/payment survive interrupted off-chain delivery. |
| `exchange-purchase.PreparedDelivery` | Entity | Durably retained ciphertext and buyer envelope with exact signed commitments; not proof of decryption. |
| `exchange-purchase.PreserveCoowners` | Rule | A new grant never removes an existing owner. |
| `exchange-purchase.PurchaseOrder` | Entity | One buyer purchase under frozen terms with one terminal financial outcome. |
| `exchange-purchase.PurchaseReceipt` | Entity | Finalized chain evidence of a purchase outcome, not an HTTP response. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |

This file is generated; edit machine sources and rebuild.
