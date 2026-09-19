---
mode: refresh
phaseStatus: blocked
mutationMode: apply-approved
refreshed_at: 2026-07-16
---

# Invoke Refresh Report: FPR01-003 Blocker Synchronization

## Result

The verified `SWU-FPR01-003` blocked-with-code receipt is synchronized into the
foundation controls and DomainSpec-v2 Craft space. The baseline/schema/validator/
fixture package remains intact, FPR01-003 remains the active unit, and no successor is
selected. FPR01-004 and every later unit remain blocked.

## Bound evidence

| Evidence | SHA-256 |
|---|---|
| `runs/SWU-FPR01-003/TASK-SESSION-RESULT.md` | `8d3f6c0d332d8545576bf775c97c1ac02b7cedc9530a07e345e0ce6a679ba0b2` |
| `authority-baseline.yml` | `7accea7412228999575e9c6a566c01c4cfa3424ece03451fd8a8721dcdacc63a` |
| `tools/validate-authority-baseline.cjs` | `daa8971074bb87dc8c471f316e6234baa995271e6d0b445dc946e655d21a0db6` |

## Synchronized blockers

| Blocker | Owner route | Closure |
|---|---|---|
| `BLK-FPR01003-001` | Definitions Governance with validation/layering review | reconcile live meta-type authority and obtain two identical canonical PASS runs |
| `BLK-FPR01003-002` | SGRM guard classification / Task Session | digest-classify or remove the three exact unclassified references; guard returns clean |
| `BLK-FPR01003-003` | implementation content / engine owner | repair or disposition existing sample normalization; aggregate validate returns clean |

## Refresh signals

| Signal | Type | Evidence | Applied delta |
|---|---|---|---|
| `RS-FPR01003BLK-001` | evidence_added | blocked Task Session receipt | bind implemented package and validation result |
| `RS-FPR01003BLK-002` | blocker_added | canonical validator exits 31 | register meta-type reconciliation blocker |
| `RS-FPR01003BLK-003` | blocker_added | guard reports three exact files | register classification blocker |
| `RS-FPR01003BLK-004` | blocker_added | sample lint reports two missing tables | register aggregate lint blocker |
| `RS-FPR01003BLK-005` | route_changed | receipt denies successor | hold FPR01-003; select no later SWU |

## Applied state

- Work-pack, execution pack, and W1 say `blocked-with-code`.
- Craft owns the baseline, validator, blocked receipt, and this synchronization.
- Craft lists all three receipt-backed blockers and a repair-first next move.
- Generated roadmap views are refreshed from Craft and remain non-authoritative.
- The baseline remains `validation-candidate`; no ratification or completion flag is
  promoted.

## Boundary

This refresh does not perform Definitions Governance repair, modify the guard
allowlist, change the sample feature, replace the blocked receipt, select FPR01-004,
enter FPR-02, or authorize production.

## Validation

- Receipt/baseline/validator digest checks: PASS.
- Craft YAML and reference integrity: PASS.
- Work-pack/W1/Craft blocker-state consistency: PASS.
- Generated roadmap deterministic check: PASS.
- Diff hygiene: PASS.

## Next route

Close the three named blockers through their separate owner routes, then replay
`SWU-FPR01-003`; do not select a successor from this blocked receipt.
