# TASK-MTC-004 — Validate and Freeze the Candidate

## SWU-MTC-005 — Full staged validation

- Primary behavior: run one fail-fast matrix over the exact all-13 staged view.
- Dependency: SWU-MTC-004.
- Write scope: exactly the paths in `SWU-CONTRACTS.json#/contracts/4/write_scope`, including the three unit closeout receipts.
- Required surfaces: the exact 25-child denominator in `SWU-MTC-005-CHILD-COMMANDS.json`, including 12 unchanged predecessor candidate validators, one Operation closure-specific composite validator, TypeScript/Python/Rust, parity, relationships, registry negatives, content/schema validation, strict typechecks, predecessor Workflow evidence, historical Operation receipt preservation, proof receipts, the full factory regression at expected exit `0`, and exact staged-product plus run-evidence whitespace/symlink/EOF checks.
- Done: every acceptance-critical command passes and its exit/output is preserved; no live source changed.
- Split analysis: individual commands are preserved results but the candidate promotion gate is the conjunction, so the unit remains one independently reviewable matrix boundary.

## SWU-MTC-006 — Candidate freeze

- Primary behavior: create one exact `IntegrationAdmissionCandidate/v1` package.
- Dependency: SWU-MTC-005.
- Write scope: exactly the paths in `SWU-CONTRACTS.json#/contracts/5/write_scope`, including the three unit closeout receipts.
- Required outputs: manifest, preserved/staged byte inventory, source locks, validation result, claim ceiling, separate Rondelli and Victor requests, terminal candidate receipt.
- Done: two independent canonical digest computations agree, all refs rehash, owner requests bind identical candidate bytes, status is `pending-owner-review`, and authority effect is `none`.
- Split analysis: manifest and requests are one acceptance identity; admission apply is deliberately excluded as a separate protected route.
