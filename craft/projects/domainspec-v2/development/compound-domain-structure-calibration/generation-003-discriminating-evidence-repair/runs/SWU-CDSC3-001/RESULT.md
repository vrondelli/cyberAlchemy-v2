---
task: SWU-CDSC3-001
result: PASS
completed_at: 2026-07-12T18:23:13Z
next_swu: SWU-CDSC3-002
---

# SWU-CDSC3-001 Result

The protected import and atomic target contract passes.

- Fourteen imported artifacts plus the generation index are byte-pinned.
- Generation 2 remains the exact two-entry tail.
- UI corpus, policy, dossier, and audit inputs remain limit-only imports with
  `DEFER`/`missing` authority.
- Six ordered atomic targets derive from parent `semantic.S` text only.
- Target and parent-field digests are deterministic.
- Twelve invalid vectors reject at the contract boundary.
- Schema/direct-validator vocabulary parity passes.
- No browser, harness, observation, result, generation, or authority surface
  was created.

## Validation

`node --test .../tests/import-target-contract.test.mjs`: 17/17 pass.

## Handoff

Route to `SWU-CDSC3-002` with:

- protected manifest handle `sha256:992e9c21078ab81fc60c8502563588e708ea2bc017cc5fc0b675e9cb19824eec`;
- target-set handle `sha256:6ae51fa18434106afa02bac24930517f1a6f574422fd81c29647ea9c7c96496e`;
- six target digests from `atomic-target-set.json`;
- runtime authorization `DEC-CDSC3-011`.
