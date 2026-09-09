# Context Pack — SWU-OEW-006B Attempt 001

Mode: standard strict context
Selector: `SWU-OEW-006B`

## Obligations

| ID | Obligation | Status |
| --- | --- | --- |
| B6-01 | Bind current selection and fresh L1 chain | covered |
| B6-02 | Bind exact task inputs and target inventory | covered |
| B6-03 | Reverify retained L0 source/build handle | covered; 6/6 pass |
| B6-04 | Locate exact Node and pnpm 10.6.2 bytes | covered |
| B6-05 | Prove overlay manifest and patch inputs exist before mutation | blocked; both absent |
| B6-06 | Prove build-handle ordering survives later overlay mutation | blocked |
| B6-07 | Capture source-only protected baseline | covered |
| B6-08 | Preserve authority and L2 ceilings | covered |

No implementation file was mutated. The blocker is structural: successor 007
owns the missing overlay inputs but depends on the 006B output, and 007–013
would mutate the source after the immutable 006B build handle was produced.
