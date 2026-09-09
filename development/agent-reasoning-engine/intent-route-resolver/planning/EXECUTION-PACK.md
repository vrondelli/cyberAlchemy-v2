# Execution pack

This schedules the medium-complexity work-pack. It does not authorize execution.
Only the selected SWU may enter Task Session after an explicit execution
request.

## Wave map

| Wave | Units | Admission gate | Stop condition |
|---|---|---|---|
| W0 | baseline/context preflight | design selection fixed point and current digests | any source drift or write-scope conflict |
| W1 | SWU-IRR-001, then SWU-IRR-002 | each prior closeout receipt joined | validator contract ambiguity or failed negative fixture |
| W2 | SWU-IRR-003, then SWU-IRR-004 | both W1 receipts pass | score/similarity/discovery dependency or non-exhaustive algebra |
| W3 | SWU-IRR-005, then SWU-IRR-006 | W2 receipts pass | typed-port failure, mapper posture loss, runtime import, or permission request |
| W4 | SWU-IRR-007, then TASK-IRR-VERIFY | W3 receipts pass | missing immutable/browser witness, byte mismatch, external call, or owner-boundary violation |

No units run in parallel. Their package exports and tests share a sequential
integration surface.

## Selected frontier

`SWU-IRR-001` is the only selected mutation-capable unit. On completion, stop
for Task Session closeout and Invoke refresh. The successor policy may select
`SWU-IRR-002` only when the same work-pack remains current and its dependency
receipt passes.

## Common execution constraints

- source mutation is limited to the selected SWU's exact write scope;
- no public Arcanum, canonical authority, parent engine plan, or ResonantOS
  source mutation;
- no package dependency solely to obtain test/browser tooling;
- Node's built-in test runner is the L0 validation runtime;
- exported core, port, and mapper code must remain environment-neutral;
- generated witness evidence stays under the declared private generated path;
- browser conformance uses the shared Chromium runtime without adding a package
  dependency;
- a test pass is L0 adapter evidence only, not host or product acceptance.

## Wave contracts

- [W0 baseline](work-pack/waves/W0.md)
- [W1 contracts](work-pack/waves/W1.md)
- [W2 resolution](work-pack/waves/W2.md)
- [W3 standalone adapter](work-pack/waves/W3.md)
- [W4 portable witness and closure](work-pack/waves/W4.md)

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
