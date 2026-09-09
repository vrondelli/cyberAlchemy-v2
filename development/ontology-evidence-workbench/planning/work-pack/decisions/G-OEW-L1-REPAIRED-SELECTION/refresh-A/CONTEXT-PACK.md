# Context Pack — Repaired L1 Selection

Mode: standard strict context
Files: 6

## Obligations

| ID | Obligation | Evidence |
| --- | --- | --- |
| SEL-01 | Bind the direct option-A selection | repaired decision receipt |
| SEL-02 | Bind the accepted 22-SWU graph | bootstrap repair refresh receipt |
| SEL-03 | Preserve the historical stopped chain | current chain state |
| SEL-04 | Select only 006B initially | work pack and manifest |
| SEL-05 | Capture a fresh finite L1 series | new chain and continuity outputs |
| SEL-06 | Keep L2 and authority effects closed | decision and work-pack boundaries |

The refresh is bookkeeping-only. It does not mutate implementation bytes or
perform any SWU.
