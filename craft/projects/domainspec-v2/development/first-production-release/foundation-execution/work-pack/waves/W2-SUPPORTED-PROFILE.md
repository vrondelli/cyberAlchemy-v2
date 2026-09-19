---
wave: W2
layer: L1
status: split-active
---

# W2: FPR-02 Independent Profile Lanes

## Decision

After this wave family, backend release and UI development each have an exact,
independently governed profile route without treating one lane's incomplete
state as the other lane's blocker.

## Order

1. [W2B](W2B-BACKEND-PROFILE.md) continues `SWU-FPR02-001..003` for the
   backend first-release profile and Body War boundary.
2. [W2U](W2U-UI-PROFILE.md) continues the existing `SWU-UIP-*` sequence for
   the development UI profile.

The two lanes may progress concurrently through separate Task Sessions and
receipts. There is no whole-wave execution and no cross-lane join.

## Entry

Verified FPR-01 ratification receipt plus the resolved FPR-02 lane-separation
decision.

## Promotion Gate

- W2B promotes to FPR-03/10/11 only from its own stable digest and negatives.
- W2U promotes only to its DS-D1/DS-D8/profile owner packet and independent
  audit.
- Neither promotion rule references the sibling lane's completion state.
