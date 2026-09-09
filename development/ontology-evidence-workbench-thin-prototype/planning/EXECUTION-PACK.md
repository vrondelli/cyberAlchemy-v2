# Execution Pack: OEW Thin Prototype

## Purpose

Schedule the four atomic SWUs and one read-only closure task without redefining
their contracts. [WORK-PACK.md](WORK-PACK.md) remains the executable source of
truth; task files own algorithms and SWUs.

## Control

| Field | Value |
| --- | --- |
| planningGateStatus | pass; direct implementation authorized, per-SWU admission required |
| complexity | medium |
| baselineWave | [W0](work-pack/waves/W0-ADMISSION.md) |
| activePlanRef | [WORK-PACK.md](WORK-PACK.md) |
| workPackManifest | [SWU-MANIFEST.json](SWU-MANIFEST.json) |
| mutationAdmissionContract | [MUTATION-ADMISSION-CONTRACT.json](MUTATION-ADMISSION-CONTRACT.json) |
| layeringArtifact | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) |
| specRef | [../define/SPEC.md](../define/SPEC.md) |
| activeLayerWindow | L0 |
| readinessProfile | pilot |

## Waves

| Wave | Layer | Question | Tasks/SWUs | Entry gate | Exit evidence |
| --- | --- | --- | --- | --- | --- |
| [W0](work-pack/waves/W0-ADMISSION.md) | L0 entry | is one SWU mutation-ready? | SWU-001 preflight | Plan validators pass | strict context/preflight receipt |
| [W1](work-pack/waves/W1-L0-TYPED.md) | L0 | is current overlay strictly admitted? | TASK-01 / SWU-001 | W0 admits | typed/source closeout |
| [W2](work-pack/waves/W2-L0-BUILD.md) | L0 | can exact inputs produce Vite dist? | TASK-02 / SWU-002 | W1 passes/closes | immutable build handle |
| [W3](work-pack/waves/W3-L1-GATEWAY.md) | L1 | is the evidence boundary exact/fail-closed? | TASK-03 / SWU-003 | W2 passes/closes | gateway handle/negative bank |
| [W4](work-pack/waves/W4-L1-BROWSER.md) | L1 | does the real Poker journey pass? | TASK-04 / SWU-004 | W3 passes/closes | bounded browser acceptance receipt |
| [W5](work-pack/waves/W5-L1-VERIFY.md) | L1 | do four closed units support the bounded claim? | VERIFY exemption; Invoke Refresh planning-evidence owner | W4 passes/closes | declared recomposition result and owner receipt |

## Ordering and parallelization

All mutation-capable work is sequential because each SWU consumes the exact
predecessor receipt and generated artifact. No two SWUs may run concurrently.
Every selected successor repeats W0 Task Session admission and receives a new
attempt ID. Read-only review may begin only after the required terminal receipt
exists.

## Failure policy

- Failed or interrupted wave selects no successor.
- Repair returns to the owning SWU; write scope never widens implicitly.
- A changed Design or SWU contract routes to Invoke Plan/Refresh before source
  mutation.
- Cleanup failure blocks even when functional assertions pass.
- No failure triggers package-manifest creation or old-work-pack mutation.

## Closure

W5 may report the bounded first-working-prototype claim only when all four
source/owner chains and the browser evidence pass read-only recomposition. It
does not claim independent immutable verification or promote to L2, release, or
production.
