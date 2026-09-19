> **Historical, non-executable after 2026-07-22.** See `../HISTORICAL-MAP.md`; replay is now an explicit L5–L8 boundary.

# TASK-BTE-VERIFY — Independent closure review

## Objective

Independently replay and adjudicate the bounded backend formation completeness claim after all implementation SWUs are complete.

## Execution-unit exemption

This is a closure-only verification task and intentionally has no implementation SWU. It may write only a verification receipt and Invoke Refresh updates; any code or contract repair discovered here must become a new bounded SWU.

## Dependencies

- SWU-BTE-001 through SWU-BTE-010 complete with receipts.
- Verifier is independent from the derivation and required-check implementers.

## Verification procedure

1. Resolve the approved profile and confirm its exact 13-kind set and digests.
2. Verify all 13 YAML schema files and the exact 16-criterion set independently from the engine.
3. Verify the frozen `O_spec` receipt and ownership boundary.
4. Recompile the all-kind minted-project witness from canonical node JSON.
5. Re-derive `O_gen` and compare exact IDs and metadata with `O_spec`.
6. Run the generated suite and targeted mutation suite from a clean evidence directory.
7. Run the required-check command and verify its receipt and negative cases.
8. Independently verify the IOLM read-only projection and Body War redacted
   read-only consumer receipts, then confirm that the reported claim remains the
   conservative exact-profile contract rather than semantic or production proof.

## Required evidence

- Approved FPR-02B decision and successor profile receipt.
- Kernel, adapter, corpus, catalogue, derivation, execution, mutation, integration, and replay receipts.
- Exact set listings for kinds, criteria, obligations, executed tests, and killed mutants.
- Zero skip/todo/orphan/unrunnable/survivor report.
- Integrated consumer manifest with candidate/authoritative posture and Craft
  continuation pointer.

## Verdict rules

- `pass`: all exact sets and digests reconcile and every negative case fails closed.
- `flag`: the bounded proof passes but a non-claiming documentation or navigation defect remains.
- `block`: any owner gate is open, set/digest differs, evidence is missing/empty, test is undiscovered/skipped, mutant survives, or claim scope is inflated.

## Write scope

- Run-scoped independent verification receipt.
- Refresh-only updates to this planning package and owning roadmap/decision surfaces.

## Handoff

Return the verdict to the first-production-release owner. A passing receipt is evidence for that owner; it is not itself profile admission or release authorization.
