# TASK-CABP-001: Evidence Controls

## Objective

Rewrite the evidence registry and source trace so the approved customer/value
research governs every downstream artifact.

- Slice: S-001
- Layer: L0
- Wave: W0
- Dependencies: approved findings
- Gaps: missing customer and founder evidence must be represented, not resolved.

## Source Contracts

- `cyberAlchemy-v2/development/research/2026-07-11-investor-language-customer-value/findings.md`
  - Sections 1-5, 9-10, 13-14.
- `cyberAlchemy-v2/development/research/2026-07-11-investor-language-customer-value/research.md`
- `work-pack/shared/context.md`
- Current `diligence-evidence-registry.md` and `source-trace.md`.

## Implementation Rules

1. Preserve valid existing evidence entries and historical provenance.
2. Add the approved release-review experiment as an unwitnessed candidate.
3. Record the technology, live-premises, and confidential-workflow statuses.
4. Add the five-tag monetary taxonomy and empty transaction-witness requirements.
5. Demote retired external vocabulary and unsupported market/value claims.
6. Preserve private/public classifications.
7. Never turn an Inventory synthesis into primary proof.

## SWU-CABP-001

- Goal: rewrite `diligence-evidence-registry.md`.
- Dependencies: none.
- Write scope: `diligence-evidence-registry.md` only.
- Done criteria:
  - approved findings are a named governing source;
  - each primary claim has status, source, missing witness, and next proof;
  - three scenario statuses match findings;
  - all financial statements use the approved taxonomy;
  - forbidden claims include ROI, assurance, correctness, reach, and differentiation.
- Acceptance evidence: review table covering buyer, offer, value, competition,
  scenarios, financials, financing, and claim boundary.
- Verification:
  - `git diff --check -- diligence-evidence-registry.md`
  - `rg -n 'fixed-scope release review|versioned release review|CUSTOMER-BASELINE|MEASURED-PILOT|DILIGENCE HOLD|GO TO TEST' diligence-evidence-registry.md`
- Execution owner: `task-session`, local fallback permitted.
- Handoff note: load only approved findings, shared context, and the target file.
  Do not mutate the source trace in this SWU.

## SWU-CABP-002

- Goal: rewrite `source-trace.md` from the accepted registry.
- Dependencies: `SWU-CABP-001`.
- Write scope: `source-trace.md` only.
- Ordered method:
  1. enumerate every planned outward claim family;
  2. attach repository/external source handles;
  3. assign status and scope;
  4. record the demotion or next-proof route;
  5. map BP and HTML destinations;
  6. preserve unresolved founder fields as missing.
- Done criteria: every primary BP/HTML claim family has source, status, target,
  and demotion/next-proof rule.
- Acceptance evidence: no source-free outward claim family.
- Verification:
  - `git diff --check -- source-trace.md`
  - review buyer, offer, value, competition, scenario, financial, financing,
    team, and technology rows against the registry.
- Execution owner: `task-session`, local fallback permitted.
- Handoff note: treat the registry as status authority and findings as design
  authority. Do not rewrite narrative files.

## Synchronization

After each SWU, append its receipt to the Task Session and update only its row
in `WORK-PACK.md`. Select the next SWU explicitly.

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
