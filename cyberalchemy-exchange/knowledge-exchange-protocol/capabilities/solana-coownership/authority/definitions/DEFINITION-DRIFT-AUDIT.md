# Solana Co-Ownership Definition Drift Audit

Status: candidate audit
Owner: Knowledge Exchange Protocol product owner
Last updated: 2026-08-31

## Scope

This audit covers the candidate Solana realization definitions and their exact
admitted predecessor. No Product Capability, ontology, DomainSpec source, or
implementation consumer exists for this candidate set yet.

## Findings

| Potential drift | Required interpretation | Status |
| --- | --- | --- |
| Treating a wallet or public key as the Knowledge Identity | A Solana public key participates only through a scoped, versioned `KEP-SOL-D1` binding to `KEP-D3`. | prevented in candidate |
| Treating one account as the Knowledge Artifact | `KEP-SOL-D2` is a bounded account aggregate representing protocol state for `KEP-D2`; it is not `KEP-D1` or its bytes. | prevented in candidate |
| Treating on-chain membership as exclusive or legal ownership | `KEP-SOL-D3` realizes the non-exclusive membership relation from `KEP-D5` only. | prevented in candidate |
| Putting secrets or whole encrypted artifacts on chain | `KEP-SOL-D4` stores an envelope commitment; `KEP-D8` remains an external ciphertext reference. | prevented in candidate |
| Treating instruction submission as a successful grant | `KEP-SOL-D5` is a request; success requires the atomic post-state and bounded evidence in `KEP-SOL-D6` and `KEP-SOL-D8`. | prevented in candidate |
| Calling the first proof completely free because it has no price | `KEP-SOL-D9` excludes economic consideration but separates network fees, rent, and refundable reserves. | prevented in candidate |
| Calling local program-test evidence a deployment or mainnet proof | `KEP-SOL-D8` binds every claim to its execution environment and commitment level. | prevented in candidate |
| Identifying a program only by crate name or program ID | `KEP-SOL-D10` requires the ontology, binding, source, build, loader, upgrade, environment, and fixture/deployment identity. | prevented in candidate |
| Treating this definition set as implementation authority | The entire set is candidate and stops before Product Capability adoption. | open owner gate |

## Downstream Remediation Contract

When the Product Capability is authored, it must reference all ten exact
definition IDs and the accepted definition-source digest. The business ontology
must distinguish identities, signing bindings, encryption bindings, state
aggregates, membership records, envelope commitments, instructions,
transitions, replay records, evidence, economic exclusions, and program
identity. Any collapsed node or broader claim is definition drift and must
block admission.
