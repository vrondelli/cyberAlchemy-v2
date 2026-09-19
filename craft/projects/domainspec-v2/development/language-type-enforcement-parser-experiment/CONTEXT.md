---
module: language-type-enforcement-parser-experiment
feature_code: LTE
version: current
status: current
updatedAt: 2026-07-17
docType: invoke-context
---

# Invoke Context: Language Type-Enforcement Parser Experiment

## Task

Design and plan the smallest discriminating experiment implied by the accepted
language/type-enforcement findings: make Concept Registry parsing fail closed
for missing or malformed structure without collapsing parse completeness into
profile admission, endpoint admissibility, implementation conformance, runtime
behavior, or semantics.

## Context Builder Summary

- Mode: `lean`, strict obligation mapping.
- Files selected: 8.
- Selector groups selected: 15.
- Obligation coverage: 8/8, 100%.
- Noise ratio: low; every selected source closes at least one obligation.
- Runtime handoff: none. Invoke planning must not pre-generate a Task Session
  context pack.
- Blockers: 0 for design and plan authoring.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | The experiment must reject a missing or malformed Concept Registry for the same structural cause across both current parser consumers. | Accepted findings `Exact discriminator contracts`; content-validator skip branches; normalized parser negative test. | covered |
| O2 | The implementation must preserve valid current packs and existing normalized-parser diagnostics. | Content and normalized-parser tests; current three-pack validation receipts. | covered |
| O3 | Parser completeness must remain distinct from schema/profile admission. | Accepted judgment chain; FPR-02 supported-profile task. | covered |
| O4 | The experiment must not define or promote a DomainSpec language, type, profile, schema, or authority artifact. | Accepted non-goals; D14 owner route; FPR-02 boundary. | covered |
| O5 | Every rejection must have an exact stable diagnostic code, subject, and cause; unrelated failures cannot satisfy the test. | Findings discriminator contract and narrow A1 standard. | covered |
| O6 | The first executable unit must be smaller than the five-judgment repair and must recompose into it. | Findings candidate architecture and Distill/Invoke plan contracts. | covered |
| O7 | Invoke may author design and plan only; Task Session owns any code mutation and receipt. | Invoke lifecycle authority chain. | covered |
| O8 | Current FPR-01/FPR-02 work must remain untouched and its decisions must not be inferred. | FPR-01 sample receipt; FPR-02 blocked Decision Gate receipt and task contract. | covered |

## Included Context

1. `development/research/2026-07-16-language-type-enforcement-proof/findings.md`
   - Selectors: `Answer and verdict`, `Required judgments and statuses`,
     `Candidate minimum repair architecture`, `Exact discriminator contracts`,
     `next owner-routed experiments`.
   - Fits: O1–O7. This is the auditor-accepted design baseline.
2. `impl/tools/validate-content.ts`
   - Selectors: validator loop around lines 99–122; local
     `parseTableForSection` around lines 466–506.
   - Fits: O1, O2, O5. Missing registry, missing columns, incomplete rows, and
     unresolved schemas currently reach `continue` paths.
3. `impl/tools/tests/validate-content.test.ts`
   - Selectors: black-box fixture harness and current positive/negative tests.
   - Fits: O2, O5. It is the existing CLI-level discriminator surface.
4. `impl/test-derivation-engine/src/grammar/index.ts`
   - Selectors: `parseNormalizedSpec` around lines 909–1082.
   - Fits: O1, O2, O6. The normalized parser already rejects absent and empty
     registries but owns a separate parser implementation.
5. `impl/test-derivation-engine/src/grammar/normalized-spec.test.ts`
   - Selectors: normalized positive, deterministic, and required-table negative
     tests around lines 26–101.
   - Fits: O1, O2, O5.
6. `definitions/DEFINITIONS.md`
   - Selectors: `domainspec-v2-D13` and `domainspec-v2-D14` around lines
     500–565.
   - Fits: O3, O4. Concept Registry is local method vocabulary with an owner
     route, not a parser-owned promotion target.
7. `development/first-production-release/foundation-execution/work-pack/tasks/TASK-FPR-02-SUPPORTED-PROFILE.md`
   - Selectors: `SWU-FPR02-001..003` and Claim Boundary.
   - Fits: O3, O8. Unknown type, absent schema, and admitted/exercised profile
     decisions remain FPR-02 work.
8. `development/first-production-release/foundation-execution/runs/SWU-FPR01003-SAMPLE-001/TASK-SESSION-RESULT.md`
   - Selectors: Outcome, Decision and Trade-Off, Validation, Authority Boundary.
   - Fits: O2, O8. The sample now has a structurally valid non-empty registry;
     `Fixture` remains explicitly local and non-authority.

## Inventory Lookup

The machine index returned
`domainspec-language-type-enforcement-proof-strategy-result-synthesis` as the
direct strategy-result match. It led to the accepted findings and confirmed the
non-authority boundary. The Inventory page itself is excluded from the selected
context because it is derivative of the accepted report and would not close an
additional obligation.

## Excluded Candidates

- Framework Unification language design: relevant to the upper architecture,
  but not needed to decide this structural parser experiment.
- Imported Lean formalization: proof precedent only; L0 neither generates nor
  verifies Lean.
- Relationship authority and endpoint validator: owned by the later
  `EndpointAdmissible` judgment, not registry parsing.
- FPR-02 decision artifact: it is presently blocked on owner decisions and must
  not be treated as approved input.

## Structured Interview Result

- Mode: gap-check.
- Questions asked: 0.
- Decisions recorded: 4 design assumptions, all source-backed:
  1. accepted findings are the approved define-equivalent source contract;
  2. the user's Invoke request authorizes L1 design and L2 planning artifacts;
  3. L0 owns registry shape only;
  4. FPR-02 retains schema/profile admission.
- Remaining ambiguity: none that changes L0 acceptance.
- Verdict: pass.
