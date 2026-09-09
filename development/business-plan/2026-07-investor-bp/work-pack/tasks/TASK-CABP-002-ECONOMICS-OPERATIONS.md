# TASK-CABP-002: Economics And Operations

## Objective

Rewrite financial assumptions and the operating plan around one fixed-scope
release-review experiment and one customer-measurement contract.

- Slice: S-002
- Layer: L1
- Wave: W1
- Dependencies: SWU-CABP-001 and SWU-CABP-002.

## Source Contracts

- Approved findings Sections 4-10 and 13-14.
- Accepted `diligence-evidence-registry.md` and `source-trace.md`.
- Current `financial-assumptions.md` and `operating-plan.md`.

## Economic Rules

- Preserve existing numbers only as `HYPOTHESIS` unless primary evidence exists.
- Separate seller economics from customer economics.
- Rename ambiguous contribution figures precisely.
- Never calculate avoided incidents or protected revenue from hypothetical events.
- Missing ask, burn, founder compensation, and runway remain missing.
- The ten-offer and three-pilot gates are proposed protocols, not forecasts.

## SWU-CABP-003

- Goal: rewrite `financial-assumptions.md`.
- Dependencies: SWU-CABP-002.
- Write scope: `financial-assumptions.md` only.
- Ordered method:
  1. rename offer units to release-review language;
  2. tag every amount with the monetary taxonomy;
  3. define customer baseline and measured-pilot fields;
  4. retain seller delivery hours, direct costs, capacity, and cash timing;
  5. rename contribution as revenue minus explicitly included costs;
  6. add commercial-entry and customer-value test assumptions;
  7. expose missing founder and financing inputs.
- Edge cases:
  - do not convert old price ranges into willingness-to-pay evidence;
  - do not model platform/license revenue as current;
  - do not use external benchmarks as customer savings.
- Done criteria: every number has a status and the model distinguishes customer
  value, seller economics, and financing gaps.
- Verification:
  - `git diff --check -- financial-assumptions.md`
  - inspect every currency/percentage row for an approved tag or explicit
    missing-input marker.
- Execution owner: `task-session`, local fallback permitted.
- Handoff note: write no operating workflow or investor prose.

## SWU-CABP-004

- Goal: rewrite `operating-plan.md`.
- Dependencies: SWU-CABP-003.
- Write scope: `operating-plan.md` only.
- Ordered method:
  1. define frozen prospect and release qualification;
  2. separate CyberAlchemy, customer-specialist, release-owner, and trigger roles;
  3. define boundary, requirement source, check, exception, evidence cutoff,
     and stop/rollback trigger;
  4. document before/intervention/after and added burden;
  5. define completion separately from customer value;
  6. add ten-offer and three-pilot gates;
  7. define receipt fields for actual transactions;
  8. route transfer hypotheses to diligence only.
- Failure modes:
  - CyberAlchemy silently becomes release authority;
  - completion is described as customer value;
  - the current process is caricatured as having no tools;
  - one changed verdict is counted as saved loss.
- Done criteria: operating plan agrees with financial assumptions on offer,
  price status, burden, gates, and missing evidence.
- Verification:
  - `git diff --check -- operating-plan.md`
  - cross-file review against `financial-assumptions.md`.
- Execution owner: `task-session`, local fallback permitted.
- Handoff note: the operating plan is a contract source for the BP, not outward
  investor copy.

## Synchronization

Do not run the two SWUs in parallel. Financial status and terminology must be
accepted before the operating plan is rewritten.

## Expected Result Shape

```yaml
swu_id: <id>
result: pass | flag | block | interrupted
capability_ref: task-session | whisper | local-fallback
receipt_kind: native-stage | subagent | local-fallback | blocked
receipt_artifact: <path or none>
files_touched: [<path>]
validation: [<check and result>]
blockers: [<blocker or none>]
residue: [<residue or none>]
reroute: <owner or none>
handoff_note: <next coordinator action>
```
