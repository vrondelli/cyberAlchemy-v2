# TASK-SFOL-FS-ADOPTION

## Objective

Execute the experimental proposed Financial Settlement modules against the real consumer
implementation and prove exact closure, mutation detection, and replay.

## Dependencies

BC-003 generic effect proof and BC-004 canonical build pass.

## SWU-SFOL-BC-005

- Primary behavior: unchanged DS-SFOL core proves the admitted C3 and P4
  profile against consumer-owned bindings/adapters.
- Inputs: canonical graph/manifest/build bytes, experimental source proposal,
  finite fixtures, deal implementation, and the real GenerateSettlement use
  case with contained repositories/event sink.
- Outputs: pure and effect receipts plus one machine-valid
  `domainspec-sfol-adoption-report/v1`.
- Algorithm:
  1. Project and typecheck both canonical modules.
  2. Build independent denominators per module.
  3. Derive pure/effect cases from proposed finite fixtures.
  4. Resolve exact-one expected-free bindings.
  5. Run implementation observations.
  6. Evaluate DS-SFOL independently.
  7. join stage sets, fail on residue, and replay both receipts.
  8. Validate the report binding proposal, proof-context, both
     module/denominator/proof/replay receipts, union exact stage sets, and
     explicit residue.
  9. Run implementation-observation mutations and require failure.
- Edge cases: missing/extra clause, stale source, wrong binding, wrong
  event/write amount/date/order, mutated proof input. Zero payout and duplicate
  suppression remain non-admitted residue rather than a silent P4 converse.
- Failure modes: hardcoded expected output, consumer semantics added to core,
  or BTE structural pass used as behavioral proof.
- Split analysis: pure and effect consumer paths are independently tested, but
  the retained SWU boundary is the parent adoption criterion that requires
  both roles and one joined exact-set report.
- Write scope: consumer-owned Financial Settlement adapters/tests/report and
  `impl/spec/features/financial-settlement/sfol/adoption-report.schema.json`,
  `impl/tools/validate-financial-settlement-sfol.ts`, and BC-005 session
  evidence; no generic core changes.
- Done criteria: the adoption report binds its schema digest, validator/tool
  digest, proposal digest, graph/manifest/build digests, both
  module/denominator/proof/replay receipts, and union stage sets; no admitted
  residue; exact stage sets; positive/replay pass;
  C3 below/equal/above threshold plus comparator/value mutations are covered;
  P4 missing write, missing event, wrong amount/date/order mutations fail;
  an exact path-set manifest over
  `impl/test-derivation-engine/src/sfol/**`, captured after BC-003 and before
  BC-005, has no added, removed, or changed paths at closeout; BTE remains
  separately green.
- Acceptance evidence: schema-valid joined report, receipts, mutation output,
  replay output, core digest audit, execution receipt.
- Validation surface: feature-specific suite, adoption-report schema/tool
  validator, exact core path-set comparator, all SFOL tests, engine typecheck,
  and the existing Financial Settlement BTE verifier at its declared
  expected-red structural boundary.
- Execution owner: local-fallback.
- Handoff: refresh records an experimental adoption pass. Parent SWU-SFOL-011
  remains formally blocked on G-SFOL-01 until the declared source owner binds
  the exact proposal digests; AEO is not selected without G-SFOL-02.
