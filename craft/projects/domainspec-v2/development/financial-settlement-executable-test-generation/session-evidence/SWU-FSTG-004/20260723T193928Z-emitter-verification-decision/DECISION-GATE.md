---
decisionId: FSTG-004-VERIFY-SEMANTICS
status: pass
classification: blocker
updatedAt: 2026-07-23T21:39:02Z
---

# Decision Gate: Financial Settlement Verification Semantics

## Question

When the generated 52-case structural suite contains the declared
`SettlementRequestToInput maps SettlementResult` red, what must
`verify:bte:financial-settlement` mean?

## Admissible Options

### `expected-red-harness` — Expected-red verification harness

- Benefit: automation passes only when all 52 cases materialize and the exact
  declared red is observed; missing, extra, or newly failing cases still fail.
- Cost or risk: the wrapper is a meta-verifier, so raw Vitest remains red when
  invoked directly.
- Choose when: the work-pack should close while preserving the known source
  incompatibility as explicit evidence.
- Downstream impact: SWU-FSTG-004 and VERIFY can have green terminal commands
  without changing the Financial Settlement source.
- Reversibility: reversible.

### `raw-red-command` — Raw failing Vitest verification command

- Benefit: the command exposes native Vitest failure semantics with no wrapper.
- Cost or risk: SWU-FSTG-004 and VERIFY cannot end with an all-green command
  until a separate source or contract decision resolves the declared red.
- Choose when: a red terminal verifier is intentionally part of the handoff.
- Downstream impact: generated artifacts can exist, but closure remains blocked
  by the known source incompatibility.
- Reversibility: reversible.

## Recommendation

Choose `expected-red-harness`. It best matches the stated boundary: generate and
run every structural case, preserve the known red honestly, and do not repair
the private source as part of this work-pack.

## Resolution

- Selected option: `expected-red-harness`
- Rationale: verification must prove all 52 structural cases materialize and
  that only the exact declared source incompatibility is red, without changing
  the Financial Settlement source.
- Source of decision: direct user selection `1`
- Decision timestamp: `2026-07-23T21:39:02Z`
- Remaining blocker: none
- Consequential implementation mutation: not started

The gate is resolved. SWU-FSTG-004 may begin from a fresh Task Session after
the Invoke lifecycle owner synchronizes the blocker resolution.
