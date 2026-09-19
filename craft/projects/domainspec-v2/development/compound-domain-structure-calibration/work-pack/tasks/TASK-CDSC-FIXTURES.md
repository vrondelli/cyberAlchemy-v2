# TASK-CDSC-FIXTURES

## Purpose

Produce one finite, cited, reviewed, immutable receipt per fixture using frozen
L0 contracts. Each SWU owns exactly one disjoint receipt subtree.

## Shared Receipt Method

1. Verify source selectors and semantic digest against generation 1 manifest.
2. Record literal `G` observations without inferring from labels or filenames.
3. Enumerate finite existing explanations `A` and observables `Q`.
4. Review every `sigma(a,q)` cell with citation, rationale, and state.
5. Record one permitted and one breaking substitution plus observed or
   indeterminate consequence.
6. Record baseline decision, candidate decision, and deterministic `D`.
7. Preserve disagreement and missing evidence in `U`.
8. Validate and append the fixture receipt; do not evaluate it in this task.

## SWU-CDSC-003 - F1 Fabrication Gate Receipt

**Goal:** Build the likely-residual-lead receipt for the GoldenQuill
fabrication gate without assuming residue survives.

**Dependencies:** SWU-CDSC-001 and SWU-CDSC-002 accepted.

**Source anchors:**

- `projects/goldenquill/pipeline/logician/gates/f_extractor_fabrication.py:80-185,321-351`
- `projects/goldenquill/pipeline/orchestrator/seats/intake.py:1411-1465`
- `projects/goldenquill/tests/logician/gates/test_f_extractor_fabrication.py:110-149`

**Write scope:**
`evidence/generation-001/f1-fabrication-gate/` and its focused fixture-validation
test only.

**Done criteria:** the receipt distinguishes Rule, Operation, Workflow,
architecture-pattern, sequencing, aggregation, and named-instance explanations;
the substitution pair has explicit consequences; uncertainty remains visible;
GoldenQuill has no diff.

**Verification:**

```sh
node projects/domainspec-v2/development/compound-domain-structure-calibration/evaluation/validate-input.mjs evidence/generation-001/f1-fabrication-gate/receipt.json
git diff --quiet -- projects/goldenquill
```

**Execution owner:** `subagent` after explicit runtime permission; local Task
Session is the fallback.

**Handoff context:** this SWU, shared context, frozen contracts, manifest F1 row,
and only the three listed GoldenQuill selectors.

**State:** complete via local fallback on 2026-07-12.

**Evidence:** `evidence/generation-001/f1-fabrication-gate/receipt.json`,
`evidence/generation-001/f1-fabrication-gate/review.md`, and
`runs/SWU-CDSC-003/TASK-SESSION-RESULT.md`. Focused tests passed 3/3; the full
package passed 19/19; GoldenQuill remained clean.

## SWU-CDSC-004 - F2 useHasMounted Receipt

**Goal:** Build the collapse-control receipt and make any non-`EXPLAINED`
evaluation observable as suite failure.

**Dependencies:** SWU-CDSC-001 and SWU-CDSC-002 accepted.

**Source anchor:**
`projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:392-411`.

**Write scope:**
`evidence/generation-001/f2-use-has-mounted/` and its focused
fixture-validation test only.

**Done criteria:** reactive-helper and framework-role explanations are explicit;
the inline substitution is represented; no lifecycle or identity fact is
invented; uncertainty remains visible; Savvy has no diff.

**Verification:**

```sh
node projects/domainspec-v2/development/compound-domain-structure-calibration/evaluation/validate-input.mjs evidence/generation-001/f2-use-has-mounted/receipt.json
git diff --quiet -- projects/savvy_legal-studio-ai
```

**Execution owner:** `subagent` after explicit runtime permission; local Task
Session is the fallback.

**Handoff context:** this SWU, shared context, frozen contracts, manifest F2 row,
and only the bounded hook selector.

**State:** complete via local fallback on 2026-07-12.

**Evidence:** `evidence/generation-001/f2-use-has-mounted/receipt.json`,
`evidence/generation-001/f2-use-has-mounted/review.md`, and
`runs/SWU-CDSC-004/TASK-SESSION-RESULT.md`. Focused tests passed 3/3; the full
package passed 22/22; F2 evaluates `EXPLAINED`; Savvy remained clean.

## SWU-CDSC-005 - F3 Savvy Page Receipt

**Goal:** Build the disputed-case receipt without collapsing composition-root,
guard, orchestration, rendered-child, and named-instance explanations into a
preselected answer.

**Dependencies:** SWU-CDSC-001 and SWU-CDSC-002 accepted.

**Source anchors:**

- `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:417-515,571-710`
- `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/lib/savvy-fsm.ts:126-162`
- `projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:17`

**Write scope:**
`evidence/generation-001/f3-savvy-page/` and its focused fixture-validation test
only.

**Done criteria:** route-entry and composition-root roles are explicit; pattern
pressure is not pattern admission; permitted screen replacement and breaking
guard/orchestration mutation have exact observations or indeterminate states;
Savvy has no diff.

**Verification:**

```sh
node projects/domainspec-v2/development/compound-domain-structure-calibration/evaluation/validate-input.mjs evidence/generation-001/f3-savvy-page/receipt.json
git diff --quiet -- projects/savvy_legal-studio-ai
```

**Execution owner:** `subagent` after explicit runtime permission; local Task
Session is the fallback.

**Handoff context:** this SWU, shared context, frozen contracts, manifest F3 row,
and only the listed Savvy/replication selectors.

**State:** complete via local fallback on 2026-07-12.

**Evidence:** `evidence/generation-001/f3-savvy-page/receipt.json`,
`evidence/generation-001/f3-savvy-page/review.md`, and
`runs/SWU-CDSC-005/TASK-SESSION-RESULT.md`. Focused tests passed 3/3; the full
package passed 25/25; F3 evaluates `INSUFFICIENT-EVIDENCE`; Savvy remained
clean. The insufficient outcome is preserved for SWU-CDSC-006.
