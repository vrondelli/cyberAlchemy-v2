# Solana Co-Ownership Completion Definition Drift Audit

Status: candidate audit
Owner: Knowledge Exchange Protocol product owner
Last updated: 2026-09-01

## Scope

This audit covers only candidate successor definitions `KEP-SOL-D11` through
`KEP-SOL-D17`, their accepted Solana predecessor, and the accepted generic
Durable Storage definition dependency.

## Findings

| Potential drift | Required interpretation | Status |
| --- | --- | --- |
| Editing the accepted `4bd06c...` definition bytes to add terms | Preserve `KEP-SOL-D1` through `D10`; add a separately digest-bound successor extension. | prevented in candidate |
| Treating a named algorithm suite as proof of secure cryptography | `KEP-SOL-D11` defines an exact profile contract; implementation and security evidence remain separate. | prevented in candidate |
| Rewriting generic storage inside the Solana capability | `KEP-SOL-D12` specializes accepted `KEP-DST-D15`; generic storage meaning remains external authority. | prevented in candidate |
| Treating a provider or PostgreSQL as the storage instantiation | The instantiation supplies consumer semantics; provider and SQL adapter values belong to an implementation binding. | prevented in candidate |
| Treating one successful write as storage readiness | Readiness requires declared three-layer obligations plus Verified Retrieval for each required object. | prevented in candidate |
| Treating B's reissue request as an envelope change | `KEP-SOL-D13` records intent only; `KEP-SOL-D14` owns authorized fulfillment. | prevented in candidate |
| Reissue silently changes ownership, version, epoch, policy, or price | Fulfillment changes only the named envelope/request/replay revisions and preserves protected state. | prevented in candidate |
| Serving prepared material after submission or an ambiguous confirmation | `KEP-SOL-D15` requires configured commitment, exact post-state, and stored-byte commitment equality. | prevented in candidate |
| Claiming cross-system atomicity | Storage is prepared before Solana; activation and reconciliation handle the boundary explicitly. | prevented in candidate |
| Calling a Devnet run Mainnet or production evidence | `KEP-SOL-D16` is an external but non-production test-cluster experiment. | prevented in candidate |
| Treating an end-to-end bundle as a security audit or authority | `KEP-SOL-D17` proves only bounded observations under the named D65 chain and environment. | prevented in candidate |
| Hiding network or storage costs inside “no price” | Infrastructure costs remain separately observed and never become knowledge consideration. | prevented in candidate |
| Recording keys, credentials, or plaintext inside evidence | Evidence records digests and secret-free references only. | prevented in candidate |

## Downstream Remediation Contract

A successor Product Capability must bind the accepted predecessor digest, the
accepted Durable Storage definition digest, and every accepted successor ID. It
must choose exact cryptographic-profile and storage-instantiation values before
DomainSpec construction, keep reissue request separate from fulfillment, select
an activation commitment, and preserve Devnet/Mainnet evidence boundaries.

No downstream consumer may infer definition acceptance from this candidate or
refresh a predecessor digest to manufacture successor authority.
