# E11: Technique/Specialization Applicability and Trade-off Study

**Status:** planned
**Paper Claim:** C2 primary, C1 secondary (extends composition evidence from E9)
**Paper Section:** Section 9.2 (cross-feature composition), Section 5 (derivation boundaries)
**MARS Claim Priority:** MARS-C2 primary, MARS-C1 secondary
**Priority:** P0 | **Effort:** High
**Analysis Tier:** full
**Reliability Mode:** dual-rater with adjudication

---

## Decision Lock (Methodology Round)

| Decision | Choice |
| --- | --- |
| Namespace | DomainSpec E11 |
| Category design | Techniques with Specializations |
| Ontology timing | Provisional catalog first (taxonomy change after evidence) |
| Analysis unit | Both edge-level and scenario-level |
| Rigor tier | Full |
| Reliability guard | Dual-rater with adjudication |
| Catalog breadth | Broad external sweep |
| Claim optimization | MARS-C2 first |
| Run naming standard | `run-YYYY-MM-DD[-suffix].jsonl` |
| Inventory onboarding | All 25 selected sources before first run row |
| Adjudication tie-break | Third-rater final decision |
| Baseline pinning | E9 run2 rerun artifact hash and commit pin |
| G4 strictness | Full-tier fields required from first row |
| Evidence upgrade timing | One full run plus one confirming rerun |

Technique families required in run-1:
- Saga orchestration vs choreography
- Queueing and backpressure
- Batching and chunking
- Optimistic vs pessimistic locking
- Abstraction patterns
- Retry, idempotency, circuit breaker
- CQRS and related variants

## Protocol Declarations (G1 Hard Requirements)

- Dependency declarations (MARS): `dep-mars-c2-baseline`, `dep-mars-protocol-method`.
- Inventory entry type declaration: each selected source ID must map to one inventory markdown entry that includes source ID and exact version pin used in E11.
- Context bundle declaration: `context.md` must define source role matrix, terminology map, metric definitions, and conflict log before full extraction.
- Execution is blocked until G2 and G3 are both pass.

## Objective

Test whether a provisional techniques/specializations catalog produces reproducible, symptom-driven, and cost-aware decisions for cross-context composition edges and scenarios.

Primary evidence objective: reduce construct-validity and reproducibility uncertainty highlighted in E9 rerun.

Reference artifact:
- `../E9-cross-feature-composition/results/E9-run2-rerun-results.md`

## Success Criteria

| ID | Criterion | Target |
| --- | --- | --- |
| SC-TS-1 | Technique applicability rate | >= 0.80 with unresolved ambiguity <= 0.15 |
| SC-TS-2 | Trade-off completeness | >= 0.85 rows with >= 3 quantified trade-off dimensions |
| SC-TS-3 | Complexity evidence quality | >= 0.95 complexity completeness and >= 0.70 justification rate |
| SC-TS-4 | Token/cost overhead vs baseline | median overhead <= 0.20 |
| SC-TS-5 | Symptom-to-technique precision | F1 >= 0.75 and false-negative rate <= 0.15 |

## Unit Of Analysis And Sampling Plan

Two coupled units are mandatory:

1. Edge-level dataset
- Minimum rows: 120
- Domain coverage: >= 8 domains
- Inputs include E9 edge inventory plus new external domains

2. Scenario-level dataset
- Minimum rows: 30 scenarios
- Coverage: >= 3 scenarios per technique family
- Each scenario must include symptom profile, selected specialization, and observed trade-offs

Sampling controls:
- Stratify by technique family and domain complexity tier.
- Keep at least 20% of rows for blind second-rater adjudication.
- Pre-register inclusion/exclusion criteria before extraction.

## Data Schema

### Minimum Required Fields

| Group | Fields |
| --- | --- |
| Identity | `experiment_id`, `run_id`, `row_id`, `timestamp` |
| Provenance | `operator`, `model`, `model_temperature`, `system_prompt_hash`, `domainspec_version` |
| Analysis scope | `analysis_unit` (`edge` or `scenario`), `domain_id`, `domain_name`, `source_context`, `target_context` |
| Edge or scenario key | `edge_id` or `scenario_id`, `pattern_id` |
| Technique decision | `technique_family`, `technique_specialization`, `selected_technique`, `applicability_confidence` |
| Symptom profile | `symptom_type`, `symptom_severity`, `symptom_present`, `adjudicated_need_label` |
| Trade-offs | `benefit_dimensions`, `cost_dimensions`, `tradeoff_score` |
| Complexity | `complexity_score`, `complexity_axis_breakdown`, `complexity_rationale` |
| Token/cost | `prompt_tokens`, `completion_tokens`, `total_tokens`, `estimated_cost` |
| Decision audit | `alternative_candidates`, `selection_rationale`, `reviewer_id`, `review_status` |

### Full Tier Additions

- `failure_mode_risk`
- `operability_impact`
- `governance_impact`
- `sensitivity_variant`
- `source_id`
- `source_version_pin`
- `inventory_entry_id`
- `claim_id`

## Baseline Definition (for SC-TS-4)

Baseline is the E9-style composition labeling pass without specialization scoring fields. Overhead is measured against baseline median tokens and estimated cost per row.

Baseline reference is pinned to:
- Artifact: `../E9-cross-feature-composition/results/E9-run2-rerun-results.md`
- Pin record: `results/E11-baseline-pin.md` (must include commit and sha256 before first run row)

## Pre-Registered Inclusion/Exclusion Rules

Inclusion criteria:
- Row maps to one declared analysis unit (`edge` or `scenario`) and one required technique family.
- Row contains enough context to compute symptom profile and trade-off fields.
- Source lineage is present and pin-resolved (`source_id`, `source_version_pin`, `inventory_entry_id`).

Exclusion criteria:
- Duplicate row for the same analysis unit and context key with no additional adjudication signal.
- Missing source lineage or unresolved version pin.
- Out-of-scope artifact that does not represent a cross-context decision.

## Adjudication Policy

- At least 20% of rows are blind-labeled by second rater.
- Any disagreement is resolved by a third rater.
- Third-rater outcome is final for metrics and must include rationale code.
- Adjudication log is required in `results/E11-adjudication-log.md`.

## Procedure

1. Lock protocol hash and baseline pin record (`results/E11-baseline-pin.md`).
2. Build provisional catalog (`catalog.md`) with family/specialization definitions and symptom triggers.
3. Complete source selection in `sources.md` with immutable version pins.
4. Complete inventory linkage for all selected source IDs and pin consistency checks.
5. Finalize `context.md` and ensure context fields are consistent with `sources.md` and inventory linkage.
6. Extract edge and scenario rows using pre-registered inclusion/exclusion rules.
7. Validate G4 on pilot subset; stop on any schema or metadata violation.
8. Continue extraction to sampling minimums.
9. Perform independent dual-rater labeling on adjudication subset.
10. Resolve disagreements with third-rater final decisions and record adjudication log.
11. Execute full analysis pipeline and publish results and claim delta.

## Gate Obligations (G1-G4)

| Gate | Requirement | Pass Condition |
| --- | --- | --- |
| G1 | Protocol quality | Measurable SCs, explicit schema, metadata completeness, sampling plan, dependency declarations, inventory entry-type declaration, claim traceability |
| G2 | Source quality | All selected sources have accessibility, depth, and version pin |
| G3 | Inventory readiness | Every selected source has inventory entry linkage and pin consistency |
| G4 | Data integrity | JSONL fields complete, metadata complete, no mixed protocol versions |

## Verification Commands

Run from this directory (`research/projects/domainspec/experiments/E11-technique-specialization`):

```bash
# G1 quick protocol sanity check
set -e
grep -c "SC-TS-" protocol.md
grep -q "## Data Schema" protocol.md
grep -q "## Gate Obligations" protocol.md
```

```bash
# G2 source quality check (must be zero violations)
set -e
python3 - <<'PY'
from pathlib import Path

allowed_prefixes = (
    'release-', 'tag-', 'commit-', 'sha256-', 'isbn-', 'doi-', 'archive-'
)
blocked_tokens = ('pending', 'tbd', 'snapshot-', 'docs-current', 'current-')

lines = Path('sources.md').read_text(encoding='utf-8').splitlines()
violations = []

for line in lines:
    if not line.startswith('| `SRC-'):
        continue
    cols = [c.strip() for c in line.strip('|').split('|')]
    source_id = cols[0].strip('` ')
    pin = cols[6]
    pin_l = pin.lower()
    if any(token in pin_l for token in blocked_tokens):
        violations.append(f"{source_id}: blocked-token pin '{pin}'")
        continue
    if not any(pin_l.startswith(prefix) for prefix in allowed_prefixes):
        violations.append(f"{source_id}: non-immutable pin '{pin}'")

print(f'g2_violations={len(violations)}')
for v in violations:
    print(v)
if violations:
    raise SystemExit(1)
PY
```

```bash
# G3 inventory linkage and pin-consistency check
set -e
python3 - <<'PY'
import re
from pathlib import Path
inventory_dir = Path('../../inventory')
index_text = (inventory_dir / 'INVENTORY-INDEX.md').read_text(encoding='utf-8')
source_lines = Path('sources.md').read_text(encoding='utf-8').splitlines()
inventory_files = list(inventory_dir.glob('*.md'))

rows = []
for line in source_lines:
    if line.startswith('| `SRC-'):
        cols = [c.strip() for c in line.strip('|').split('|')]
        source_id = cols[0].strip('` ')
        pin = cols[6]
        rows.append((source_id, pin))

missing_index = []
missing_entry = []
pin_mismatch = []

for source_id, pin in rows:
    if source_id not in index_text:
        missing_index.append(source_id)
    matched = []
    pin_ok = False
    for f in inventory_files:
        txt = f.read_text(encoding='utf-8')
        if source_id in txt:
            matched.append(f.name)
            if pin in txt:
                pin_ok = True
    if not matched:
        missing_entry.append(source_id)
    elif not pin_ok:
        pin_mismatch.append(f"{source_id}: expected pin '{pin}'")

print(f'missing_inventory_index={len(missing_index)}')
print(f'missing_inventory_entries={len(missing_entry)}')
print(f'pin_mismatches={len(pin_mismatch)}')
for sid in missing_index:
    print(f'index-missing: {sid}')
for sid in missing_entry:
    print(f'entry-missing: {sid}')
for item in pin_mismatch:
    print(f'pin-mismatch: {item}')

if missing_index or missing_entry or pin_mismatch:
    raise SystemExit(1)
PY
```

```bash
# G4 strict full-tier schema and metadata check for each JSONL row
set -e
python3 - <<'PY'
import glob
import json
import re
from pathlib import Path

required = [
  'experiment_id','run_id','row_id','timestamp','operator','model',
  'model_temperature','system_prompt_hash','domainspec_version',
  'protocol_version','protocol_hash','baseline_ref',
  'analysis_unit','domain_id','technique_family','technique_specialization',
  'selected_technique','applicability_confidence',
  'symptom_type','symptom_severity','symptom_present','adjudicated_need_label',
  'benefit_dimensions','cost_dimensions','tradeoff_score',
  'complexity_score','complexity_axis_breakdown','complexity_rationale',
  'prompt_tokens','completion_tokens','total_tokens','estimated_cost',
  'alternative_candidates','selection_rationale','reviewer_id','review_status',
  'failure_mode_risk','operability_impact','governance_impact','sensitivity_variant',
  'source_id','source_version_pin','inventory_entry_id','claim_id'
]
violations = 0
run_name_re = re.compile(r'^run-\d{4}-\d{2}-\d{2}(-[a-z0-9-]+)?\.jsonl$')
configs = set()

paths = sorted(glob.glob('data/*.jsonl'))
for path in paths:
    name = Path(path).name
    if not run_name_re.match(name):
        violations += 1
        print(f"{path}: invalid run filename; expected run-YYYY-MM-DD[-suffix].jsonl")
    with open(path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            miss = [k for k in required if k not in row]
            if miss:
                violations += 1
                print(f"{path}:{i}: missing={','.join(miss)}")
                continue
            if row.get('analysis_unit') not in ('edge', 'scenario'):
                violations += 1
                print(f"{path}:{i}: invalid analysis_unit={row.get('analysis_unit')}")
            run_id = row.get('run_id', '')
            if not re.match(r'^run-\d{4}-\d{2}-\d{2}(-[a-z0-9-]+)?$', run_id):
                violations += 1
                print(f"{path}:{i}: invalid run_id={run_id}")
            configs.add((row.get('protocol_version'), row.get('protocol_hash'), row.get('domainspec_version')))

if len(configs) > 1:
    violations += 1
    print(f"mixed_protocol_or_version_configurations={len(configs)}")

print(f'violations={violations}')
if violations:
    raise SystemExit(1)
PY
```

## Claim And Traceability Mapping

| Claim | Role | Why |
| --- | --- | --- |
| C2 / MARS-C2 | Primary | Reproducibility of deterministic decision protocol under technique specialization pressure |
| C1 / MARS-C1 | Secondary | Improves traceability from symptom to architecture decision and governance effects |

## Deliverables

- `sources.md` with pinned source set and G2 decision.
- `catalog.md` with family and specialization definitions.
- `data/run-YYYY-MM-DD[-suffix].jsonl` append-only run data.
- `results/run-<id>-results.md` full-tier analysis report.
- `results/E11-claim-delta.md` claim impact update proposal.
- `results/E11-baseline-pin.md` baseline commit and digest record.
- `results/E11-adjudication-log.md` disagreement and third-rater final decisions.

## Risks And Mitigations

1. Construct validity circularity.
- Mitigation: dual-rater adjudication and disagreement analysis.
2. Source bias toward DDD-heavy ecosystems.
- Mitigation: broad external sweep with explicit category diversity constraints.
3. Metric gaming by post-hoc thresholds.
- Mitigation: lock SC thresholds in protocol before data collection.
4. Inconsistent complexity scoring.
- Mitigation: require complexity axis breakdown and rationale codes.
5. Excessive token overhead.
- Mitigation: baseline comparison and per-family overhead caps.
