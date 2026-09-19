# Execution Pack — Validated Wave Choreography

This package defines future ordering only. It records one selected SWU but does
not authorize a whole wave or execute the selected unit.

## Entry Gate

`DEC-DSV2-MINTED-PROJECT-NODE-PACKAGE`,
`DEC-DSV2-MINTED-PROJECT-FIRST-SWU`, and this Invoke Refresh/Plan must remain
valid. `SWU-MNP-001` is selected; Context Builder must now produce a strict
runtime pack. Do not activate W1 as a whole or substitute paths at runtime.

## Waves

| Wave | Layer | Question | Tasks/SWUs | Entry | Exit evidence | Contract |
| --- | --- | --- | --- | --- | --- | --- |
| W1 | L0 | Is the machine contract compilable and deterministically traversable? | CONTRACT 001; COMPILER 002–003 | selected 001 passes strict context, then dependency order | schema + resolver + normalized graph receipts | [W1](work-pack/waves/W1-L0-CONTRACT-COMPILER.md) |
| W2 | L1 | Can views and the minter reproduce the boundary in a clean project? | VIEWS 004; MINTER 005 | W1 pass | drift controls + clean mint/rebuild + leakage scan | [W2](work-pack/waves/W2-L1-VIEWS-MINTER.md) |
| W3 | L2 | Does the contract remain safe across profile states and degraded evidence? | CONFORMANCE 006 | W2 pass | independent corpus + profile/degraded matrix | [W3](work-pack/waves/W3-L2-CONFORMANCE.md) |
| W4 | L3 | Can owners admit and migrate without authority leakage? | ADMISSION 007 | W3 pass + FPR gates | owner digest receipt + disposition/migration proof | [W4](work-pack/waves/W4-L3-ADMISSION.md) |

## Parallelization

None by default. Within W2, view and minter work share output-path contracts and should remain sequential until their interface is stable. Later subagent use requires a new DomainSpec subagent-strategy proposal and user confirmation.

## Stop Rules

- Stop on any path that makes a DomainSpec fixture consumer authority.
- Stop if graph or Markdown becomes writable semantic source.
- Stop if kind existence is treated as supported-profile admission.
- Stop if an edge gains independent lifecycle pressure; route to Refine before introducing separate edge storage.
- Stop before cross-feature claims without a dedicated multi-feature design/evidence run.
