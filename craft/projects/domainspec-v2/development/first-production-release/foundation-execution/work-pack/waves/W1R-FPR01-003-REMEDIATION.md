---
wave: W1R
layer: L1
status: completed
---

# W1R: FPR01-003 Remediation

## Decision

After this nested wave, we know whether the existing FPR01-003 baseline package can
pass against current repository evidence without weakening the guard or inventing
sample-domain semantics.

## Closed Entry Gate

- Definitions reconciliation is complete.
- Guard repair PASS proves zero violations and live negative controls.
- Sample repair PASS proves deterministic clean lint with no invented edge.
- The joined replay PASS preserves normalized SHA-256
  `91de9e042b564e1bf85582e8ac360e55e1cafde101f960cbabfb231444b9df7c`.

## Included Units

| Order | SWU | Layer role | Entry | Exit evidence | State |
|---:|---|---|---|---|---|
| 1A | `SWU-FPR01003-GUARD-001` | L1 repair input | exact audit violations | exact digest classifications + clean guard + live negative controls | completed |
| 1B | `SWU-FPR01003-SAMPLE-001` | L1 repair input | two normalized-table violations | semantic-preserving normalized sample + clean lint | completed |
| 2 | `SWU-FPR01003-REPLAY-001` | L1 closure proof | both repair receipts PASS | superseding FPR01-003 PASS receipt + aggregate validation | completed |

## Parallelization Boundary

The guard lane changed only exact allowlist classifications and its evidence. The
sample lane changed only the sample `SPEC.md` and its evidence. They joined at replay;
only the replay replaced the FPR01-003 receipt.

## Stop Conditions

- an exact match is active retired orchestration rather than historical/superseded
  evidence;
- the frozen manifest would need mutation;
- sample normalization requires a parser relaxation or invented relationship;
- replay changes the normalized canonical digest unexpectedly;
- any aggregate validation remains red; or
- any step attempts to select FPR01-004 or mutate continuation state.

## Exit And Promotion

The PASS replay has been synchronized by an apply-approved Invoke refresh, which
selected but did not execute `SWU-FPR01-004`. This completed wave does not ratify
FPR-01 or authorize production.
