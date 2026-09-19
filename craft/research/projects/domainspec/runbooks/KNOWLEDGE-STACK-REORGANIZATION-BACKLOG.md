# DomainSpec Knowledge Stack Reorganization Backlog

Date: 2026-04-26
Scope: DomainSpec project only

## Objective

Reorganize definitions, references, context, and resource artifacts into a consistent executable pattern across all DomainSpec experiments.

## Definition Candidate Register (Executed)

| Candidate Family | Source Artifact(s) | Normalized Target |
|---|---|---|
| Method tier semantics and reproducibility metadata | `definitions/METHODOLOGY-PROFILE.md`, `experiments/EXPERIMENTS.md` | `definitions/DEFINITIONS-INDEX.md` (DS-M4, DS-M5) |
| Protocol gate and checklist semantics | `protocols/DOMAINSPEC-PROTOCOL-CHECKLIST.md` | `definitions/DEFINITIONS-INDEX.md` (DS-M7, DS-M8) |
| Signal envelope and telemetry vocabulary | `telemetry/SIGNAL-SCHEMA.md` | `definitions/DEFINITIONS-INDEX.md` (DS-M6, DS-M12) |
| Claim acceptance and evidence status vocabulary | `claims/CLAIMS.md`, `results/DOMAINSPEC-EVIDENCE-STATUS.md` | `definitions/DEFINITIONS-INDEX.md` (DS-M10, DS-M11) |

## Reference Candidate Register (Executed)

| Candidate Family | Source Artifact(s) | Normalized Target |
|---|---|---|
| Paper bibliography refs [1]-[32] | `papers/domainspec-paper.md`, `sources/REFERENCE-LEDGER.md` | `sources/AUTHORITY-SOURCES-2026-04-26.md` + updated `sources/REFERENCE-LEDGER.md` |
| Method authorities (Wohlin/Basili/Runeson/Kitchenham) | `definitions/METHODOLOGY-PROFILE.md` | `sources/AUTHORITY-SOURCES-2026-04-26.md` + ledger method section |
| E11 operational technique sources (25 IDs) | `experiments/E11-technique-specialization/sources.md` | `sources/AUTHORITY-SOURCES-2026-04-26.md` + inventory linkage parity |
| Waiver-controlled references | ledger/status scan | `sources/REFERENCE-WAIVERS.md` |

## Taxonomy Decisions

### Definition ID policy

- Prefix: `DS-`
- Families:
  - `DS-C*` contributions
  - `DS-D*` named definitions
  - `DS-P*` properties
  - `DS-COR-*` corollaries
  - `DS-F*` formal constructs/equations
  - `DS-M*` methodology/governance operational terms

### Reference status policy

- `operationalized`: source ID + pin + inventory linkage present.
- `waived`: temporary exception with explicit waiver record.
- `pending normalization`: source normalization incomplete.

### Authority level policy

- `primary`: required for protocol criteria or claim adjudication.
- `supporting`: triangulation/interpretive support.
- `fallback`: contextual references not used as primary authority.

## Remaining Backlog

1. Convert mutable repository references to commit-SHA hard pins where currently snapshot-level.
2. Resolve all waiver entries in `sources/REFERENCE-WAIVERS.md` or reclassify as contextual-only.
3. Split clustered authority inventory entries into per-source entries if source-level deep extraction is needed by future experiments.
4. Backfill the remaining 12 E6-only domain inventories into `inventory/*.md`.
