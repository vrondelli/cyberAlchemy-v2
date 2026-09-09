# TASK-OEWFR-02: Builder Failure Integration

## Objective

Drive the real typed-gate branch through injected no-network collaborators and
preserve evidence, stop order, cleanup, and blocker precedence.

## SWU-OEWFR-003 — injected execution seam

- Primary behavior: allow `buildThinPrototype` to receive command-runner and
  failure-writer collaborators while production defaults remain current.
- Acceptance boundary: injected calls and default selection are testable before
  changing nonzero mapping.
- Split analysis: runner and writer parameters could be separate, but the
  builder option contract is one dependency boundary and neither changes
  behavior yet.
- Dependencies: 002.
- Write scope: builder source and builder test.
- Steps: define narrow option shape; thread through command sites; assert exact
  IDs/order; retain current default executor; forbid injected authority from
  changing admission or output paths.
- Edge cases: missing collaborator, throwing collaborator, unexpected command
  result shape.
- Done: existing 21+ builder contracts remain green and injection fixtures
  prove zero live commands.
- Validation: targeted full builder contract test file; no build/network.
- Owner: task-session or local-fallback.

## SWU-OEWFR-004 — nonzero typed-gate evidence mapping

- Primary behavior: on typed exit nonzero, persist evidence then throw the
  original typed blocker with one reference and stop subsequent commands.
- Acceptance boundary: pass/nonzero/empty/oversize/secret fixture matrix.
- Split analysis: persistence call and reference attachment are one state
  transition; either alone loses the acceptance boundary.
- Dependencies: 003.
- Write scope: builder source and builder test.
- Pseudocode:

```text
result = await runner(typed-tests)
if result.exit_code == 0: discover and continue
else:
  evidence = await writer(sanitize(result), admitted_contract)
  if evidence unavailable: throw DIAGNOSTIC_EVIDENCE_MISSING
  throw TYPED_TESTS_FAILED with evidence reference
```

- Edge cases: empty diagnostics, sanitized-to-empty, writer returns invalid
  reference, secret survives, later command accidentally invoked.
- Done: exactly one typed invocation, zero following commands, zero success
  outputs, and one reference for the actionable failure fixture.
- Validation: V01-V05 injected fixtures; scoped diff check.
- Owner: task-session or local-fallback.

## SWU-OEWFR-005 — cleanup and stronger-blocker precedence

- Primary behavior: make evidence-persistence and cleanup failures distinct,
  ordered blockers while always attempting cleanup.
- Acceptance boundary: writer-failure and cleanup-failure cases can pass
  independently of patch/binding work.
- Split analysis: two failures are distinct cases but share one precedence
  table; separate code units could incorrectly allow the original blocker to
  mask cleanup failure.
- Dependencies: 004.
- Write scope: builder source and builder test.
- Precedence: cleanup failure > evidence persistence failure > diagnostic
  missing > original typed failure; all remain BLOCK and no success handle.
- Edge cases: command plus writer failure; command plus cleanup failure; writer
  plus cleanup failure; retained-source temptation.
- Done: V07-V08 pass, workroot/store absence is checked where cleanup succeeds,
  and a retained source never substitutes for failure evidence.
- Validation: targeted precedence matrix; no live commands.
- Owner: task-session or local-fallback.

## Synchronization

003, 004, and 005 close separately. Shared files require strict sequential
execution and a fresh baseline at every admission.

