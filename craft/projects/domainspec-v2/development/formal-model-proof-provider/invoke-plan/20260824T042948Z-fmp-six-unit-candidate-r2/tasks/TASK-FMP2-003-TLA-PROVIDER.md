# TASK-FMP2-003 — Registered TLA/TLC Provider

## Smallest Working Unit

- SWU: `SWU-FMP2-003`
- Layer: L2
- Dependency: accepted `SWU-FMP2-002`
- Successor: `SWU-FMP2-004`
- Expected execution owner: FMP/TLA provider owner through one Task Session
- Primary behavior: one registered provider consumes the verified factory context, executes a bounded fake TLC oracle in private scratch, totally classifies it, derives existing proof evidence, and leaves no residue

## Inputs and outputs

Inputs are the three decoded roles, verified Java/artifact handles, node/case limits, and same-run factory context. Output is the existing common semantic result plus optional `ProofEvidence/v1` and derived accounting; the provider writes no factory receipt.

## Exact write scope

Create `factory/tla/run-tlc-case-v1.ts`, create the registered provider, modify the registry, and create `tla-provider.test.ts`. The exact paths and commands are in `SWU-CONTRACTS.json`.

## Algorithm

1. Declare provider ID/version `tla-tlc-model-evidence-v1`/`1.0.0`, `direct-proof`, exact three roles, Java executable, `tla2tools` artifact, and 300,000 ms node budget.
2. Decode and cross-join manifest, bundle, and independently owned denominator before writing scratch.
3. Create one private directory; materialize virtual files create-only in manifest order; rehash every byte.
4. Invoke only verified handles with safe basenames, one worker, cleanup/coverage flags, per-case timeout, node budget, and bounded output.
5. Apply the L0 total classifier. Only the case's exact declared result maps to passed obligation or killed mutant; any mismatch throws a stable provider error.
6. Derive totals and exact evidence. Existing factory recomputation independently verifies them.
7. Cleanup on every success/failure path; cleanup failure blocks.

## Edge cases and hostile evidence

Own `HC-FMP-019..022` plus existing proof-accounting negative cases: digest or input join mismatch, missing/duplicate/foreign denominator rows, wrong findings/owners/counts, scratch drift, output overflow, process failure, and cleanup failure. Tests use a task-owned fake Java executable and inert artifact; they must not call live Java/TLC.

## Done and validation

All four commands for 003 pass, registry order remains deterministic, duplicate provider ID blocks, full factory regression passes, no receipt is written by the provider, and scratch is absent. Execution and owner receipts bind successor 004.

## Split analysis

Candidate children are scratch/process execution and proof mapping. They remain together because the primary behavior is one provider execution whose classified case observations must independently recompose into existing proof accounting. Live corpora are separately acceptable and excluded.

## Runtime context anchors and result shape

Use accepted outputs from 001-002, `VALIDATED-DESIGN.md`, current provider/registry/accounting contracts, hostile catalogue, and this task. Return the standard SWU receipt/result with fake-tool evidence and cleanup proof. Claim ceiling is provider integration only; no live model has run.

Rollback restores the registry preimage and removes the three created files before acceptance.
