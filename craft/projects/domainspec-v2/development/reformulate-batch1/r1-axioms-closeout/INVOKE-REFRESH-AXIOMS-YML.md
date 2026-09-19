---
node_type: invoke-refresh-report
is_session: true
status: pass
created: 2026-07-09
mode: refresh
mutation_mode: apply-approved
target_artifact: DomainSpec v2 R1 AXIOMS authority-home closeout
---

# Invoke Refresh - AXIOMS YAML Companion

## Source Signal

| ID | Type | Source | Claim | Safety |
| --- | --- | --- | --- | --- |
| SIG-R1-YML-001 | artifact_drift | user prompt, 2026-07-09 | R1 created a human authority file but omitted the machine-readable YAML companion expected by nearby DomainSpec v2 authority patterns. | safe |

## Target Artifacts

- `authority/AXIOMS.md`
- `authority/AXIOMS.yml`
- `authority/source-spine.md`
- `README.md`
- `WORK-PACK.md`
- `TASK-SESSION-SWU-R1A-001.md`

## Applied Changes

- Added `authority/AXIOMS.yml` as the machine-readable AXIOMS registry.
- Updated `authority/AXIOMS.md` to name the authority pair.
- Updated current source references to include `AXIOMS.{md,yml}`.
- Updated the R1 receipt/work-pack so `SWU-R1A-002` consumes the corrected
  evidence set.

## Boundary

The YAML companion is not a move to `definitions/` and not an `impl/spec`
projection. It is a colocated machine-readable authority companion under
`authority/`.

## Validation

- `python3 -c "import yaml; yaml.safe_load(open('projects/domainspec-v2/authority/AXIOMS.yml'))"`
- `npm --prefix projects/domainspec-v2/impl run validate`
- `git diff --check -- selected R1 files`

## Next Route

`task-session` on `SWU-R1A-002`.
