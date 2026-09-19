---
wave: W1
layer: L1
status: completed
---

# W1: FPR-01 Authority Baseline

## Decision

After this wave, we know whether one non-contradictory, owner-ratified source/count/status baseline exists.

## Order

1. `SWU-FPR01-001` — completed: deterministic census without choosing a winner.
2. `SWU-FPR01-002` — completed: approved, digest-bound owner dispositions adopted unchanged with a verified receipt.
3. `SWU-FPR01-003` — completed: [W1R remediation](W1R-FPR01-003-REMEDIATION.md)
   closed both repository inputs and produced a deterministic PASS replay.
4. `SWU-FPR01-004` — completed: exact digest ratification and independent replay.

## Entry

Verified `SWU-FPR01-002` receipt (`sha256:2d3b994e9c9251953e28eb39653271ad97f3e8d2ab188ea411a82a80bc188537`) binds the approved packet (`sha256:4b42980eb706d7c43cd81d9eec2b3c37596584a41a115e127b336d3847c75b5a`). The receipt synchronization selects FPR01-003 but does not execute it or authorize canonical repairs.

## Current replay receipt

`SWU-FPR01-003` PASS receipt
`sha256:ad4064f890fb3445de642b8a2096a0de6961f89b011cf45e3d43caeed17d68a3`
binds all three blocker closures, byte-identical canonical runs, five killed mutants,
101/101 aggregate tests, and zero post-receipt guard violations. W1R is completed and
`SWU-FPR01-004` then passed with 19/19 receipt bindings, a deterministic unchanged
replay, all five mutants killed, and an isolated `E_STATUS` mutation rejection.

## Promotion Gate

Satisfied. The baseline resolves the 13/14, 24/25, 30/31, composability, source-home,
projection, status, and direction-disposition conflicts; count/path/status/direction
mutations fail; required owners and the independent verifier bind the exact digest.

## Completion

The apply-approved ratification synchronization closes FPR-01 and W1. W2 is
available for separate selection, but no FPR-02 SWU is selected or executed here.
