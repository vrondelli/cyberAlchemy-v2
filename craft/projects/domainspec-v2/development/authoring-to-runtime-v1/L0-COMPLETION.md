# L0 semantic authoring proof — bounded completion record

Date: 2026-09-17. Authority effect: none.
Scope: B00, S01–S06, L0X of `EXECUTION-DAG.json` revision 2.
Outcome: the minimum Entity–FormalClaim–Rule–Operation TypeScript vertical is
implemented and natively tested. The full 37-node product goal is not complete.

## Obligation accounting

| Node | Result within L0 | Evidence |
| --- | --- | --- |
| B00 | pass | Historical `baseline-inputs.json` remains unchanged; subsequent implementation and dated evidence are recorded separately. |
| S01 | pass as semantic contract | `AUTHORING-CONTRACT.md`, `syntax-cases.json`, explicit ownership/non-collapse boundaries. |
| S02 | pass for exact endpoint contract | DomainSpec `condition-binding.test.ts`, 4/4; wrong endpoint, multiplicity, identity, stale bytes and provider-field mutations reject. |
| S03 | pass for selected authoring slice | Formal/parser/application-source tests and `application-syntax-contract.test.ts`; typed claim/Rule references and causal diagnostics. |
| S04 | pass for L0 formation | Exact domain/formal join, complete artifact trace, metadata preservation and re-formation currentness tests. |
| S05 | pass without default cutover | `COMPATIBILITY.md`; explicit and historical compatibility, output parity and CLI target rejection. |
| S06 | pass for explicit ground interpretation | `RULE-PROJECTION.md`, `EXECUTABLE-LOWERING.md`; native Rule truth tables, seven operation scenarios, semantic mutant and two-process repeatability. |
| L0X | pass as bounded evidence join | This accounting; no omitted L0 obligation or operational authority inferred. |

## Syntax breadth accounting

All 18 IDs in `syntax-cases.json` are consumed by the contract suite.
Eleven are current L0 cases and are checked against positive acceptance or the
exact expected error. Seven remain C03 target-breadth obligations:
`policy-rule-reference`, `state-trigger-guard`, `invariant-claim`,
`operation-rule`, `inline-policy`, `inline-guard`, `competing-invariant`.
For those seven, full target acceptance/diagnostic conformance is
**not_evaluable because C03 authoring support is not implemented**. Tests prove
only that they currently reject without legacy fallback. They are not labelled
implemented, skipped or silently removed from the final product denominator.

## Validation

The ten-suite Alch L0 selection passes **46/46 with no skips**; strict typecheck
passes. DomainSpec's focused binding suite passes **4/4**. The operation suite
also passes after strengthening the exact replacement-value assertion.
The unchanged 37-node DAG is checked separately. Native tests use the existing
repository Node/TypeScript toolchain, not an ambient download.

The tests check 16 Boolean outcomes and malformed Rule values; operation
success, guard rejection, missing data, read failure, malformed input, commit
rejection and commit uncertainty; exact source/selection mutations; and a
compilable guard-bypass mutant against an independent negative oracle.
Cross-process repeatability compares actual candidate, join, trace and generated
artifact digests, not merely parser outputs. These are bounded semantic tests,
not general FOL proof or the full L3 cross-layer test suite.

## Relevant implementation checkpoint

Paths below are relative to the sibling Alch implementation directory.
These hashes identify this increment, not a release freeze or a complete
dependency inventory. Future changes require fresh evidence; P03 owns the full
candidate inventory.

| File | SHA-256 |
| --- | --- |
| src/application-executable.ts | d684a24313e7d04aabb08deff4b9c5b5a17ebb533ab2e0e671e41aa091597a94 |
| src/application-rule-projection.ts | 3bed73069e3a4343ff8a1f2c895369297c1f7269b0ac080e2040edcb3a5f7248 |
| src/application-domain-lowering.ts | f2e6416f81c201e8196e39d09c412272776bea9636a26547cb3e7d7aad66080c |
| src/formal-claim-lowering.ts | 21e9756aa7c32b3ed697efee4b4f5a90552413a67f61e3c98aa606cf0b6c58a3 |
| src/domainspec-cli.ts | 306daf12afd21388ddd463c0154d66457be458882f92085e7e4874d0a27431d2 |
| test/application-executable.test.ts | 651a04181c2c939e24eed0ab3022de7673f00cec4d5863a13b184fdd859c2194 |
| test/fixtures/application-executable-fixture.ts | 91700346fab6fc5f73cff739d01c9f9a1d8c6acf66bea4602ef03411cf97b4f5 |
| test/fixtures/application-executable-repeatability.ts | fcbaff95745c0bbea42d0017b3de5537246191361e88ffb0ffac8fcf824ac799 |
| test/application-syntax-contract.test.ts | 50e2711098f7dab8bba5098220ec9adc97f7403912f9087d5f0ef6d919c9861b |

## Next construction and authority boundary

I00 (vertical Event/Mapping prerequisites), I01 (canonical integration grammar)
and I05 (runtime-profile lowering) are dependency-ready. O01 remains separately
owned operational support for P02, not a blocker for this frontier.
No product decision has changed. No release, admission, deployment, provider
operation, product approval, or full goal completion is claimed.
