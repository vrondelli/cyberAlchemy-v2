---
decision_id: DEC-SGRM-REL-FIXTURE-ORDER
status: accepted
created: 2026-07-11
target: SWU-SGRM-003
selected_option: move-positive-fixture-sync-to-sgrm-003
decision_source: explicit-owner-choice
---

# DEC-SGRM-REL-FIXTURE-ORDER

## Decision Question

Which SWU should synchronize the positive relationship fixture that still
authors the removed Saga `orchestrates` endpoint?

## Blocking Evidence

After option 1 repaired the non-collapse acceptance baseline, the full tool
suite reaches 46/47 and fails only this positive fixture:

```text
WireTransferSaga --[orchestrates]--> ReserveFunds
expected workflow -> operation
```

The fixture and its test still expect 31 signatures and describe Saga as valid.
SGRM-005 owns relationship fixture migration but depends on SGRM-004, while
SGRM-004 depends on completed SGRM-003.

## Options

### 1. Move only the positive fixture sync into SGRM-003 (recommended)

Rename the fixture concept to `WireTransferWorkflow`, change its type to
Workflow, retain the `orchestrates` edge, and update the positive test wording
and expected signature count from 31 to 30.

- Benefit: smallest repair and restores the required full suite.
- Cost/risk: moves one positive-fixture update earlier than SGRM-005.
- Choose when: fixtures should follow already-migrated root authority.
- Downstream impact: SGRM-005 still owns the negative Saga-source case and all
  remaining relationship/non-collapse cleanup.

### 2. Create a pre-SGRM-003 positive-fixture sync unit

Add a small SGRM-003B under the SGRM-005 owner, execute it, then resume SGRM-003.

- Benefit: preserves original fixture ownership.
- Cost/risk: adds plan, wave, dependency, and receipt overhead for two files.
- Choose when: strict task ownership outweighs execution simplicity.
- Downstream impact: Invoke refresh is required before another Task Session.

### 3. Accept the 46/47 staged suite

Treat the positive fixture failure as expected until SGRM-005.

- Benefit: no further scope change.
- Cost/risk: promotes through a fixture explicitly labeled valid even though
  root authority rejects it.
- Choose when: the owner explicitly accepts a temporary red full-suite gate.
- Downstream impact: SGRM-003 remains FLAG and SGRM-004 proceeds with known red
  relationship evidence.

## Recommendation

Select option 1. The positive fixture is a projection of root authority and is
already false; synchronizing two lines plus the test expectation is safer than
preserving knowingly invalid positive evidence.

## Selected Option

Option 1, move only the positive fixture sync into SGRM-003.

The owner selected `1`. This authorizes the valid fixture's Saga-to-Workflow
rename and the positive test's wording/signature-count synchronization. The
negative Saga-source proof and remaining relationship migration stay in
SGRM-005.

## Standing Context Option

`Explain / more context` requests deeper comparison and does not resolve the
gate.

## Decision State

- selected option: move positive fixture sync into SGRM-003
- blockers remaining: 0
- full tool suite: 46/47
- staged implementation: preserved, not promoted
