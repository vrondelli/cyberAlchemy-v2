# TASK-OEWSN-06: Comparable Quality Loop

## Objective

Replay the frozen Body War audit after implementation and emit comparable
atomic deltas without converting them into a score or human claim.

## Algorithm

Validate unchanged profile/scenario/source/runtime policy; resolve fresh build
and browser handles; execute all task/control/state/mode and relation matrices;
join only stable claim IDs; emit current evidence and atomic delta; validate
digests, ceilings, regression links and residue independently.

## Smallest Working Units

### SWU-OEWSN-017 — Run the frozen current evidence matrix

- Primary behavior: exact frozen profile -> complete current-run evidence set
- Independent acceptance: every required cell has observed result or explicit residue
- Split analysis: individual browser probes are not useful without one bound
  run manifest; delta comparison is separately SWU-018
- Dependencies: SWU-005, 006, 008, 009, 011–016, 019 and 020
- Source anchors: baseline coverage and audit protocol
- Write scope: extend `validate-body-war-browser.mjs` and
  `test/browser-acceptance.test.mjs`; write new generated
  `BODY-WAR-OEWSN-CURRENT/<attempt-id>/` artifacts and the exact SWU-017
  session receipt
- Done: loopback-only runtime, exact runtime/browser hashes, screenshots,
  accessibility/DOM/contrast/keyboard/request/console/teardown ledgers
- Evidence/validation: runner self-tests and complete coverage manifest
- Owner/handoff: Task Session subagent/local fallback; return current-run handle

### SWU-OEWSN-018 — Emit and independently validate the delta

- Primary behavior: frozen baseline + current handle -> valid atomic delta receipt
- Independent acceptance: every stable claim maps to one allowed delta/residue
  with unchanged evidence class/scope/ceilings and correct hashes
- Split analysis: producer/validator form one independently reviewable receipt
  contract; current browser capture already closes separately
- Dependencies: SWU-017
- Source anchors: audit protocol Re-audit delta and Validation planned receipt
- Write scope: new `body-war-oewsn-delta.schema.json`,
  `produce-body-war-oewsn-delta.mjs`, `verify-body-war-oewsn-delta.mjs`,
  `body-war-oewsn-delta.test.mjs`, generated
  `BODY-WAR-OEWSN-DELTA/<attempt-id>/` artifacts and the exact SWU-018 session
  receipt
- Done: no score, no hard-gate tradeoff, no human/authority/release inflation
- Evidence/validation: positive and tampered receipt bank plus independent verifier
- Owner/handoff: Task Session subagent/local fallback; return delta receipt

## Failure modes

Binding drift, skipped cells reported as pass, mixed evidence classes, aggregate
score, missing regression link, unverifiable digest, external request, console
error, process/token residue or inflated claim ceiling blocks the task.
