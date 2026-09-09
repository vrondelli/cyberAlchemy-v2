# Core no-price Solana co-ownership FormalClaim

Status: authored candidate with bounded Lean theorem evidence; not admitted.

Claim ID: `FormalClaim:cyberalchemy-v2.kep.solana-core-grant`

This package formalizes one deliberately small proposition from the adopted
no-price Solana co-ownership capability and its authored business-ontology
candidate:

```text
valid modeled success
  -> preserve A
  -> add B
  -> record B's envelope commitment
  -> increment the revision
  -> consume the replay identity
  -> preserve zero knowledge consideration

modeled rejection
  -> preserve the entire pre-state
```

`FORMAL-CLAIM.json` is the single canonical proposition. The Lean file is a
provider projection bound back to that proposition by exact bytes and marker
preservation. The EVF Lean provider checks the named theorem twice and the EVF
adapter normalizes its receipt into one evidence handle.

The proof is about the exact pure Lean transition model only. It does not prove
that a Solana program exists, that Solana transactions implement the model,
that signer or account validation is correct, that replay is rejected across
real transactions, that external storage is available, or that cryptography is
secure. The business ontology remains an unadmitted candidate and DomainSpec v2
is still absent, so this package grants no ontology admission, implementation
authority, conformance, publication, release, deployment, or external effect.

Validate with:

```bash
python3 cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/formalization/claims/CA2-FC-KEP-SOLANA-CORE-GRANT-001/validate.py
```

