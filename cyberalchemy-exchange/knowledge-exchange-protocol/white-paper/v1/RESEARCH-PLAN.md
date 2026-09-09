# White Paper Research Plan

Status: active working plan
Route: `CA2-ROUTE-RESEARCH`
Research mode: bounded external comparison explicitly requested by the user
Subagents: none

## Objective

Explain the Knowledge Expansion Protocol as a falsifiable technical proposal:
why knowledge sharing needs a co-ownership model, how encrypted access and
public state interact, how CyberAlchemy-v2 constructs the system through D65,
what has actually been implemented, and exactly what the current evidence can
support.

## Paper obligations

1. Lead with the knowledge-transfer problem rather than blockchain machinery.
2. Define artifact version, stable identity, co-ownership, recipient envelope,
   encryption epoch, finalized activation, and reissue.
3. Show the business, cryptographic, storage, Solana, hosted-application, and
   governance layers with explicit responsibility boundaries.
4. Separate protocol claims from implementation observations.
5. Separate local deterministic tests, formal model evidence, PostgreSQL
   evidence, HTTP evidence, and public Devnet reads.
6. Compare related work without claiming equivalence or novelty prematurely.
7. Preserve every known security, durability, legal, economic, deployment, and
   user-validation limitation.

## Research route

```text
local source selection
  -> external primary-source comparison
  -> claim ledger
  -> evidence adjudication
  -> narrative draft
  -> technical review
  -> security and legal review
  -> reproducibility appendix
  -> publication decision
```

Only the first five steps are represented in this package. No empirical run or
publication effect is part of this research action.

## Next review passes

1. Protocol-owner review for product meaning and terminology.
2. Rust/Solana review for implementation accuracy.
3. Cryptographic review for HPKE, AEAD, binding, custody, and key-lifecycle
   claims.
4. Storage review for restore, independence, retention, RPO, and RTO claims.
5. Legal review before using ownership, license, royalty, or rights language
   outside the protocol-defined membership sense.
6. Reader review with one technical and one non-technical participant.
