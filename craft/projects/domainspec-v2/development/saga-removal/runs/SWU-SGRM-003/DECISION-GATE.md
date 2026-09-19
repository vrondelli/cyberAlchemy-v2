---
decision_id: DEC-SGRM-NONCOLLAPSE-LOCK-ORDER
status: accepted
created: 2026-07-11
target: SWU-SGRM-003
selected_option: move-obsolete-lock-to-sgrm-003
decision_source: explicit-owner-choice
---

# DEC-SGRM-NONCOLLAPSE-LOCK-ORDER

## Decision Question

Which SWU should remove the now-superseded registry acceptance lock that still
requires Saga and Workflow to be the sole collapse candidate?

## Blocking Evidence

The `attribute-one-of` implementation is green:

- 13 focused new behaviors pass;
- deterministic generation and structured validation pass;
- attestation classification/permutation behavior passes; and
- TypeScript typecheck passes.

The full tool gate fails only here:

```text
[FAIL] MUST fire Saga~Workflow - the one intended merge
collapse-candidate(s): none
```

That result is correct after SGRM-002: root DS-D8 no longer gives Saga the
Workflow `orchestrates` participation. However, SGRM-005 currently owns removal
of this hard-coded lock and depends on SGRM-004, while SGRM-004 depends on a
completed SGRM-003.

## Options

### 1. Move the obsolete acceptance lock into SGRM-003 (recommended)

Expand SGRM-003 to update only
`tools/validate-meta-types-noncollapse.ts` and its existing black-box test:
replace the mandatory historical pair with the current zero-collapse baseline,
and make the supported-keyword wording reflect the eight-keyword map.

- Benefit: smallest repair; makes `tools:test` truthful immediately.
- Cost/risk: moves one narrowly defined SGRM-005 responsibility earlier.
- Choose when: validator acceptance should track already-migrated authority.
- Downstream impact: SGRM-005 retains relationship fixtures and generic
  acceptance hardening but no longer owns this obsolete pair lock.

### 2. Create and run a pre-SGRM-003 lock-cleanup unit

Refresh the work-pack with a small SGRM-003A owned by the SGRM-005 task, run it,
then resume SGRM-003.

- Benefit: preserves conceptual ownership under the validator-migration task.
- Cost/risk: adds a new SWU, receipt, dependency, and wave transition for two
  focused files.
- Choose when: ownership purity matters more than migration speed.
- Downstream impact: work-pack, execution, layering, dispatch, and task indexes
  need another refresh.

### 3. Accept a temporary full-suite exception

Keep ownership unchanged, mark focused tests/typecheck as sufficient for
SGRM-003, and defer the full `tools:test` pass to SGRM-005.

- Benefit: no scope or dependency edits.
- Cost/risk: promotes SGRM-003 while its required validation command is red and
  lets SGRM-004 proceed through a known stale lock.
- Choose when: the owner explicitly accepts a staged validation exception.
- Downstream impact: SGRM-003 remains FLAG rather than clean PASS; SGRM-005 must
  repair the lock before any full-suite claim.

## Recommendation

Select option 1. The acceptance lock became false when SGRM-002 changed root
authority, so carrying it until SGRM-005 is not meaningful separation of
concerns. The repair is two focused files and preserves every generic
non-collapse invariant.

## Selected Option

Option 1, move the obsolete acceptance lock into SGRM-003.

The owner selected `1`. This authorizes updates only to the current-registry
baseline in `validate-meta-types-noncollapse.ts` and its black-box test. It does
not move relationship fixtures or generic non-collapse hardening out of
SGRM-005.

## Standing Context Option

`Explain / more context` requests deeper comparison and does not resolve the
gate.

## Decision State

- selected option: move obsolete acceptance lock into SGRM-003
- blockers remaining: 0
- staged implementation: preserved, not promoted
- dependent SWUs: remain blocked until the resumed full gate passes
