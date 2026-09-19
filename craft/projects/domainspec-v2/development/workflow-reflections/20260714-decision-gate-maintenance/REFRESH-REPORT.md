# Invoke Refresh Report — Decision Gate Maintenance Approval

## Invoke Validation Fixture Result

- Mode: `refresh`
- Spell: `invoke`
- Canonical ID: `invoke`
- Scope: library
- Phase status: `pass`
- Mode contract: `arcanum/spells/invoke/refresh.md`
- Outputs: `APPROVAL.md`, `REFRESH-REPORT.md`, `refresh-report.json`, refreshed
  maintenance findings and report
- Mutation mode: `apply-approved`
- Evidence date: `2026-07-14` (`2026-07-15T00:50:53Z` receipt time)
- Source signals: 1 `blocker_resolved`
- Proposed changes: record approval and change the maintenance handoff state
- Applied changes: approval record plus private maintenance status/route refresh
- Skipped changes: public canonical skill, generated runtime, experiment evidence,
  and observability counter normalization
- Validation: source linkage, approval-scope equality, private/public boundary scan,
  and Markdown/path checks
- Decisions: `DEC-ARC-DG-COVERAGE-GUARD-APPROVAL`
- Unresolved gaps: reflection-state counter normalization remains separately owned
- Next route: `sigil-development --update`

## Refresh Signal

| ID | Type | Claim and evidence | Targets | Confidence | Safety |
| --- | --- | --- | --- | --- | --- |
| RS-DG-01 | `blocker_resolved` | The operator selected Option 1 after taking the Explain path, approving the exact bounded scope in `APPROVAL.md`. | findings and maintenance report | high | safe |

## Context Builder Selection

- Mode: `lean`, strict refresh selection.
- Obligations: preserve exact approved scope; keep private evidence out of public
  Arcanum; distinguish approval from completed maintenance; retain the separate
  observability residue.
- Selected sources: `APPROVAL.md`, `findings.md`, and the maintenance report.
- Coverage: 4/4 obligations.
- Excluded: public skill bodies, generated skill bodies, implementation source,
  and unrelated DomainSpec planning artifacts.

## Dispatch Technique Trace

| Technique | Refresh effect |
| --- | --- |
| `owner_boundary_check` | Invoke records approval; Sigil Development remains the mutation owner. |
| `handle_handoff` | The next owner receives paths and a public-safe scope instead of copied private evidence. |
| `residue_ledger` | Counter normalization remains separate and explicitly owned. |
| `protected_context_flag` | Private review evidence is not transported into public Arcanum. |
| `concrete_path_evidence` | Approval and reports are cited by exact path. |

A new full dispatch was not created because this refresh does not execute the
cross-capability route or transport protected content into the public target.
Sigil Development must own and validate its mutation/experiment/regeneration
route when invoked.

## Mutation Boundary

This refresh resolves the human approval blocker only. It does not implement the
guard, create the regression, run Experiment Harness, regenerate the runtime, or
claim lifecycle completion.

