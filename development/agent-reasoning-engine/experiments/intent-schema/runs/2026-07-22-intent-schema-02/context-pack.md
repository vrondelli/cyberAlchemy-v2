# SWU-INTENT-001 context pack

Run ID: `2026-07-22-intent-schema-02`

Status: strict pre-execution context coverage passed.

This is session evidence for one local Task Session. It is not a canonical
schema, definition, or reusable authority surface.

## Selected unit

- Task: `TASK-INTENT-POPULATION-001`
- SWU: `SWU-INTENT-001`
- Runtime: local
- Adapter: none
- Write scope: this run directory and
  `receipts/intent-schema-live-run.json` only
- Next owner on pass or flag: `g6-schema-selection`

## Obligation matrix

| ID | Obligation | Evidence selectors | Status |
|---|---|---|---|
| O-01 | Mechanics gate is current and passing. | `receipts/intent-evidence-mechanics.json#/status`, artifact hashes, focused fixture commands | covered |
| O-02 | Freeze exactly 12 population and 3 holdout samples before interpretation. | `SPEC.md#Unit and corpus`, `PROTOCOL.md#Sampling procedure` | covered |
| O-03 | Preserve exact source and excerpt locks. | `PROTOCOL.md#Frozen inputs`, `RULES.md#MANIFEST-001-006` | covered |
| O-04 | Use all seven CAV2-D39 fields with explicit posture. | `spec/INTENT-RECORD.md#Semantic field hypotheses`, candidate schema | covered |
| O-05 | Do not default missing meaning or hide inference. | `PROTOCOL.md#Population algorithm`, `RULES.md#INT-004-007` | covered |
| O-06 | Keep the holdout rules unchanged. | `PROTOCOL.md#Holdout rule` | covered |
| O-07 | Run deterministic fixture and live validation. | task verification command, `validate-run.mjs` | covered |
| O-08 | Compute integrity, field, pressure, stratum, and holdout metrics. | `METRICS.md` | covered |
| O-09 | Preserve bounded CAV2-D56 claims and owner decision boundary. | `CLAIM-BOUNDARY.md`, `RULES.md` | covered |
| O-10 | Stop before schema selection, promotion, or engine claims. | `W1-LIVE.md#Promotion and next route` | covered |

## Frozen dependency candidates

The manifest-freeze command must verify these bytes before writing the manifest:

- experiment SPEC, CLAIM-BOUNDARY, PROTOCOL, and METRICS;
- candidate INTENT-RECORD contract;
- run-row and intent-record schemas;
- deterministic validator and rule catalog;
- task, wave, and passing mechanics receipt.

## Source selectors

Population:

- four dispatches at `/intent/raw`;
- four exact top-level Craft context blocks:
  `CTX-CAV2-ROOT`, `CTX-CAV2-MINT`, `CTX-CAV2-DOMAINSPEC-V2`, and
  `CTX-CAV2-IOLM`;
- four full work-pack objective sections at `## Objective` or
  `## Objective Summary`.

Holdout:

- one refresh dispatch at `/intent/raw`;
- the exact `CTX-ARE-ROOT` Craft context block;
- the full Poker Agent Arena `## Objective` section.

All selected text must be an exact UTF-8 substring of its source. The current
engine dispatch and current experiment work-pack are excluded from the corpus.

## Resolved path notes

The corrected existing work-pack sources are:

- `cyberAlchemy-v2/ontology/development/2026-06-30-ontology-folder-consolidation/WORK-PACK.md`
- `cyberAlchemy-v2/development/business-plan/2026-07-investor-bp/WORK-PACK.md`

The task contract's example path still names run 01. The confirmed parent route
authorizes run 02 after run 01 was preserved as a blocked attempt; this context
pack records that bounded supersession without editing the task contract.

## Decisions and gates

- Blocker decisions: none before population.
- Assumption: source-level semantic attribution may remain unresolved even when
  technical file provenance is locked; provenance does not impersonate intent
  authority.
- Assumption: low frequency cannot remove a canonical CAV2-D39 question.
- Entry gate: pass, contingent on manifest-time hash verification.
- Exit gate: pass or flag only if all integrity requirements pass; otherwise
  block and preserve the failed attempt.

## Excluded context

- Current engine `DISPATCH.json`: mutable run-control surface, excluded from the
  corpus.
- Current experiment `WORK-PACK.md`: controlling contract, not a sampled intent
  source.
- Public Arcanum and canonical definitions: outside the write boundary.
- Unrelated repository files: no obligation coverage.
