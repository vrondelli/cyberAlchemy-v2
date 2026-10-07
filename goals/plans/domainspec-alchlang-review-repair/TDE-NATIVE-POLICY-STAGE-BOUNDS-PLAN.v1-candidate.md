# TDE native-policy stage-bound repair — candidate plan

## Product frontier and observed failure

The full parallel TDE run on 2026-10-03 passed 508/509 tests (82/83 files).
`src/sfol/claim-cases/native-policy-link.test.ts` failed before a selected case
ran: a 300 ms timeout selected to exercise a slow native adapter also bounded
the separate Python/prlimit/bwrap launcher probe. The current error
`SFOL_POLICY_PROBE_FAILED` discards which bounded process condition occurred.
The two 5-second failures from the earlier 506/509 run did not recur. The
current observation supports stage coupling as the repair target, not an
unqualified claim that every earlier timeout has the same cause.

## Plan → analysis → review → implementation DAG

1. **Plan and implementation analysis.** Keep the selected Auth SFOL source,
   native executable, bwrap/prlimit/Python pins, network/virtual-address-space
   checks, replay semantics and candidate-only claim ceiling unchanged.
   Separate probe process bounds from selected case process bounds in the
   selected execution contract. Hidden fixed allowances are rejected because
   the receipt must state the exact conditions under which its prerequisite
   probe ran.
2. **Review gate.** Review the exact API, strict validation, version transition,
   diagnostics, negative controls and write scope before implementation.
   Stop if a new field would silently reinterpret a v2 receipt, weaken probe
   failure handling, or convert local observations into F5 evidence.
3. **Implementation.** Add required `probe_timeout_ms` and
   `probe_max_output_bytes` to `SelectedSfolPolicyExecution`; retain
   `timeout_ms` and `max_output_bytes` as selected-case limits. Validate each
   bound within the existing finite ceilings and strict object shape. Pass
   explicit selected bounds into the common subprocess runner. Use probe
   bounds only for the launcher probe and case bounds only for native cases.
   Bump the candidate link schema to v3; bind all four limits through the
   canonical execution object, link digest and replay comparison. Reject v2
   held links rather than interpreting them with the new semantics.
4. **Fail-closed diagnostics.** On a failed probe, emit a bounded reason token
   (timeout, output-limit, exit, signal, stderr or invalid output) without raw
   subprocess bytes. A failed or unparseable probe never reaches case
   observation or a matched link.
5. **Controls and validation.** Test a 300 ms sleeping native case reaches one
   incomplete observation with `timed_out:true`; a tight case-output ceiling
   does not constrain the separate probe; invalid probe bounds and a forged,
   rehashed held probe bound fail closed; a deliberately failed probe produces
   zero case executions and no matched link; real eight-case observation and
   replay remain matched. Rehash tampered held links with the actual canonical
   `digestSfolValue` over the unsigned payload, not a plain JSON SHA, so the
   replay comparison is exercised beyond its digest guard.
   Run focused policy-link tests, strict SFOL typecheck, then the complete
   parallel suite with `TMPDIR=/var/tmp`. If resource pressure recurs, a
   one-worker full run is separately labeled and never substituted for a
   parallel pass.
   Code review additionally requires an observed process-launch trace for the
   failed-probe zero-case control: an adapter-side marker in its read-only
   bwrap mount cannot prove non-execution. The exact-file selector must also
   reject actual size mismatch or oversize before reading selected bytes,
   while retaining post-read drift and digest checks.
6. **Evidence synchronization.** Record exact test outcomes in
   `IMPLEMENTATION-STATUS.md`, including any remaining broad-suite failure.
   Neither a green suite nor a local policy link admits a DomainSpec-v4 claim,
   authenticates an external provider, or proves
   `runtime_guarantees_observed`.

## Bounded context and write scope

- Controlling code:
  `craft/projects/domainspec-v2/impl/test-derivation-engine/src/sfol/claim-cases/native-policy-link.ts`
  (`SelectedSfolPolicyExecution`, `validate`, `run`, `probe`, observation and
  replay).
- Controlling tests:
  `craft/projects/domainspec-v2/impl/test-derivation-engine/src/sfol/claim-cases/native-policy-link.test.ts`
  (launcher probe, timeout, output, source drift and replay controls).
- Status predecessor: `IMPLEMENTATION-STATUS.md` 2026-10-03 F5 selected-source
  and native-policy sections. Write only the two files above, this plan and
  the status record. Preserve all unrelated dirty work and Auth sources.

## D65 lanes

- Current product frontier: repair the candidate local native-policy test and
  make probe/case resource bounds explicit and replayable.
- Runnable product work: contract, runner, negative controls and full-suite
  validation in the exact two-file implementation scope.
- Operational support: local pinned Rust toolchain, `/var/tmp` for tests, and
  optional isolated one-worker diagnostic; no deployment or provider call.
- Causal blocker for F5: accepted v4 meaning/projection/preservation,
  TDE-neutral case set and independently authenticated provider execution
  against a post-TDE finalized request remain absent.
- Deferred residue: broader parallel-load investigations if distinct failures
  recur, downstream E03/E05/L3X/P01–P03 qualification, admission and release.

## Open Questions

- Does the complete parallel suite pass after the stage-bound fix, or does it
  reveal another independent resource or process defect?
- Which accepted v4 and provider evidence will make a later finalized F5
  request eligible without promoting this candidate-local link?
