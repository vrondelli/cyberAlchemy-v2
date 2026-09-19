# Invoke Refresh Report — Minted Project Node Package

## Invoke Validation Fixture Result

- Mode: `refresh`
- Spell: `invoke`
- Canonical ID: `invoke`
- Scope: library
- Phase status: `pass`
- Mode contract: `arcanum/spells/invoke/refresh.md`
- Outputs: `REFRESH-REPORT.md`, `refresh-report.json`, refreshed S09 plan package
- Mutation mode: `apply-approved`
- Evidence date: `2026-07-14` (`2026-07-15T00:50:53Z` latest receipt time)
- Source signals: 6; 3 blockers resolved, 1 evidence addition, 1 route change,
  and 1 status change
- Target artifacts: 17 existing S09 planning artifacts plus 3 refresh/dispatch outputs
- Proposed changes: bind authority homes, experimental profile admission, fixture
  dispositions, exact write scopes, real verification surfaces, the one-SWU
  route, and the approved first-SWU selection
- Applied changes: S09 planning package and selection-state artifacts only
- Skipped changes: implementation, authority registries, fixtures, migration, Craft, Inventory, public Arcanum
- Validation: JSON parsing, Dispatch Spec validator, planning-link checks, SWU/write-scope checks, Distill Validate
- Decisions: `DEC-DSV2-MINTED-PROJECT-NODE-PACKAGE` and
  `DEC-DSV2-MINTED-PROJECT-FIRST-SWU`
- Unresolved gaps: release promotion, consumer-example destination, cross-feature proof, independent edge lifecycle
- Next route: strict Context Builder runtime pack for selected `SWU-MNP-001`,
  then one separately invoked bounded `task-session`

## Declared Scope

Refresh only the S09 Invoke plan produced by the minted-project node-package
Refine run. The source decisions authorize planning-path binding and selection of
`SWU-MNP-001`; they do not authorize implementation, fixture movement, registry
mutation, release admission, or Task Session execution.

## Source Signals

| ID | Type | Claim and evidence | Targets | Confidence | Safety |
| --- | --- | --- | --- | --- | --- |
| RS-MNP-01 | `blocker_resolved` | PLAN-B1 is resolved by the owner-split authority table in `DEC-DSV2-MINTED-PROJECT-NODE-PACKAGE`. | plan, layering, work-pack, tasks, waves | high | safe |
| RS-MNP-02 | `blocker_resolved` | PLAN-B2 is resolved by experimental profile `feature-with-independent-node-files` and its effective condition. | contract/compiler/conformance/admission tasks | high | safe |
| RS-MNP-03 | `blocker_resolved` | PLAN-B3 is resolved by the boundary-clean fixture disposition table. | work-pack, conformance/admission tasks, W4 | high | safe |
| RS-MNP-04 | `evidence_added` | The decision record supplies exact owner roles, failure separation, digest binding, and migration non-authorization. | all S09 planning artifacts | high | safe |
| RS-MNP-05 | `route_changed` | The next route changes from Decision Gate to refreshed plan validation and explicit first-SWU selection. | plan, work-pack, execution pack, receipts | high | safe |
| RS-MNP-06 | `status_changed` | `DEC-DSV2-MINTED-PROJECT-FIRST-SWU` records `SWU-MNP-001` as selected and not started. | plan, work-pack, contract task, W1, dispatch, receipts | high | safe |

## Context Builder Selection

- Mode: `deep`, strict planning selection.
- Obligations: authority-home binding; profile/admission binding; fixture
  disposition; executable one-SWU route; exact selected/not-started state.
- Selected sources: decision record, selected design, five S09 root artifacts, six
  task contracts, four wave contracts, two machine receipts, existing Refine dispatch,
  and the implementation package manifests needed to bind real verification commands.
- Coverage: 5/5 obligations.
- Exclusions: implementation source, concrete fixture contents, Craft, Inventory writes,
  website code, and public Arcanum artifacts.
- Runtime handoff pack: not generated; selection is now resolved and Context
  Builder must create the fresh strict Markdown plus JSON/index pack before Task
  Session.

## Inventory And Template Selection

The existing S09 package already uses the eligible standalone
`implementation-layering`, `work-pack`, and `domainspec-spec` execution-pack family.
Inventory lookup found no minted-project-specific promoted template; it found only
nearby verified Invoke-package precedents. The current artifacts therefore remain the
selected candidate package and no template or Inventory promotion occurs.

## Applied Delta Summary

1. Bind `supported-profiles.yml` under the definitions authority.
2. Bind source/generated contracts under `impl/spec/minted-project/`.
3. Bind compiler, views, receipts, minter, and generic template under
   `impl/tools/minted-project/`, with tests under the existing tool-test surface.
4. Bind canonical conformance witnesses under the derivation-engine fixture root.
5. Preserve existing engine fixtures as validation witnesses and classify the three
   misplaced `impl/spec/features/` packs for future consumer-example migration.
6. Replace placeholder verification with current repository commands.
7. Establish `SWU-MNP-001` as the only eligible first unit; the later
   `RS-MNP-06` signal records its selection while all later SWUs remain
   dependency-gated.
8. Add and validate a future execution dispatch that enforces one-SWU Task Sessions.
9. Record `SWU-MNP-001` as selected and not started; resolve only dispatch gate
   `g03-explicit-swu-selection`.

## Structured Interview Gap Check

- Questions asked: 0.
- Reason: the preceding Decision Gate resolved the owner decisions and explicit
  SWU selection; Invoke Refresh has no remaining scope or mutation ambiguity.
- Remaining ambiguities are deferred or reversible implementation details and do not
  justify reopening the human gate.
- Verdict: `pass`.

## Mutation Boundary

The refresh does not create `supported-profiles.yml`, schemas, compiler code,
templates, fixtures, runtime context, or migration artifacts. It records the
selected unit and updates plan/dispatch read models only. Source mutation can
begin only through a separately invoked Task Session after strict context passes.

## Dispatch Technique Trace

The existing `EXECUTION-DISPATCH.json` remains the validated full dispatch.
This refresh uses `owner_boundary_check`, `handle_handoff`, `residue_ledger`,
`concrete_path_evidence`, and `observability_grouping` to bind the selection
decision to gate `g03` while preserving `g04` through `g06` as future runtime
controls.
