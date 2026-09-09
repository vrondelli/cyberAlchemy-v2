# Agent reasoning engine — Craft view

> Derived human view. Authority remains in [`.craft/ledger.yml`](.craft/ledger.yml).
> This scoped ledger does not validate or repair the parent `cyberAlchemy-v2` ledger.

## Quick links

- Next move: [run the G-ARE-L0 owner gate](#next-move)
- Active blockers: none
- Blocking decisions: none
- Active gaps: [downstream residue](#active-gaps-and-residue)
- Terminal artifacts: [readiness](decisions/implementation-readiness/session-evidence/TASK-ARE-READINESS-001-RECEIPT.json), [L0 witness]([repo-root]/cyberAlchemy-v2/implementation/agent-reasoning-engine/generated/runs/evaluator-v1-20260723T-session-001/TERMINAL-RECEIPT.json)

## Context CTX-ARE-ROOT

- **Stage / gate:** `implementation-l0` / `pass`
- **Readiness:** `G-ARE-POLICY` passes.
- **L0 execution:** `SWU-ARE-001` completed; its 16-test suite and materialized witness receipt pass.
- **Promotion:** `G-ARE-L0` evidence condition passes, but promotion remains pending.
- **Selected work:** none. No downstream SWU is authorized.

## Closed semantic-witness gap

`GAP-ARE-SEMANTIC-WITNESS` is closed by the terminal L0 receipt. The evidence
covers two separately owned rule families, all typed outcomes and negative
counterfactuals, canonical reasoning receipts, byte-identical replay, persisted
ordering, zero-call closures, and a fixed idempotent effect test double.

This closes only the lack-of-witness gap. It does not establish a general
reasoning engine, real effects, actor runtime, anti-bias efficacy, or promotion.

## Active gaps and residue

- **GAP-ARE-ARTIFACT-DURABILITY:** artifact admission and production durability remain L2 work.
- **GAP-ARE-INCIDENT-READINESS:** incident behavior and operational response remain downstream.
- **GAP-ARE-ROLLOUT-READINESS:** private rollout and the general-engine label remain unsupported.
- **GAP-ARE-INTENT-EVIDENCE:** revision-history and inter-rater evidence remain outside L0.
- **GAP-ARE-ANTI-BIAS-EFFICACY:** anti-bias efficacy remains explicitly excluded.

## Artifacts

| ID | Status | Meaning |
|---|---|---|
| ART-ARE-READINESS-RECEIPT | pass | Policy-readiness receipt; no implementation claim |
| ART-ARE-L0-WITNESS-RECEIPT | pass | Private finite semantic witness; no promotion claim |
| ART-ARE-LEDGER | active | Machine source of truth |
| ART-ARE-INDEX | active | Rebuildable lookup projection |

## Candidate definitions

- **DEF-ARE-INTENT-RECORD:** local candidate intent projection; not canonical.
- **DEF-ARE-SEMANTIC-EVALUATOR:** implemented and witnessed at L0; still a local
  candidate and non-authorizing.

## Next move

Run the explicit G-ARE-L0 evidence/owner promotion gate; do not select or authorize a downstream SWU until that gate returns a terminal receipt.

## Open Questions

See [`spec/SPEC.md#open-blockers--owner-decisions`](spec/SPEC.md#open-blockers--owner-decisions).
