---
dispatch_id: 2026-07-12-r3c-second-corpus-selection
artifact_role: cited-synthesis
status: accepted
created: 2026-07-12
---

# SWU-R3C-004 Second-Corpus Selection — Findings

## Evidence boundary

This registered dispatch satisfies P1 through synthesis and isolation: two explorers compared repo-owned
corpora against the SWU contract, then two reviewers tested the proposed selection and row adjudication.
The preserved explorer returns are in [research.md](research.md#agent-1--shannon-claude); neither explorer
ran validators or mutated candidate files (`research.md:10-24,26-80`). This finding selects a source and
an execution boundary only. Root DS-D8 remains
`projects/domainspec-v2/definitions/relationships/relationships.yml`; the AEO draft is not authority and
is not acceptance evidence. SWU-R3C-004 still requires a materialized valid pack and a seeded invalid edge
that fails (`projects/domainspec-v2/development/r3-closeout-plan/work-pack/tasks/TASK-R3C-CORPUS.md:34-43`).

## Candidate verdict matrix

| Candidate | Evidence | Verdict |
|---|---|---|
| AEO fixture: `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/agent-execution-orchestrator/` | Distinct owned orchestration domain, draft status, typed registry, aspect set, and 12 authored graph rows (`SPEC.md:1-33,101-168`). AEO is also the previously named richer fallback; the correct citation is `projects/domainspec-v2/research/spec-ontology-unification/DEFINE.md:73-77`, not `:145-149`. | **Select as source only** for bounded normalization. |
| CampusRead: `projects/domainspec-v2/development/comprehension-novice-test/task.md` | Direct library facts support `Library --owns--> Copy`, `Copy --belongs-to--> Title`, and `Copy --belongs-to--> Branch` (`task.md:18-38`); current DS-D8 uses those examples (`definitions/relationships/relationships.yml:244-273`). No materialized feature pack exists (`research.md:50-78`). | **Defer, retain as the next targeted Entity-to-Entity corpus.** |
| Spec-ontology toy: `projects/domainspec-v2/research/spec-ontology-unification/toy/` | Its graph is explicitly financial-settlement (`toy/graph.md:7,12-17`), despite useful 10-signature analysis (`toy/graph.md:51-74`). | **Reject as a second corpus.** |
| Sample: `projects/domainspec-v2/impl/spec/features/sample/SPEC.md` | Minimal fixture with no relation declarations (`SPEC.md:1-10`; explorer matrix `research.md:50-57`). | **Reject as vacuous.** |
| APE work-pack: `projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md` | Governing plan for two-pack breadth, not independent business semantics (`research.md:14-20,50-57`). | **Not a corpus.** |

## Preserved disagreement and reviewer outcome

Shannon selected AEO because it is already a substantial owned feature source and can add five signatures
absent from the current financial-settlement pack (`research.md:14-24`). Noether selected CampusRead
because the task expressly prefers Entity-to-Entity evidence and CampusRead directly witnesses it
(`research.md:26-78`; `TASK-R3C-CORPUS.md:25-30`). Both concerns survive: **AEO is the bounded choice for
this SWU; CampusRead is the next breadth target, not discarded residue.**

- **Popper reviewer: UPHOLD with bounded corrections.** AEO is distinct and source-backed, the 9/3 row
  count is exact, the DEFINE citation is `:73-77`, and the fixture remains source-only until the Task
  Session proves green/red acceptance (`AEO/SPEC.md:2-8,29-33,101-157`; `TASK-R3C-CORPUS.md:36-41`).
- **Noether reviewer: UPHOLD with bounded correction.** Treat normalization as a projection onto current
  DS-D8: re-emit admissible rows unchanged with their aspect anchors, omit invalid rows without invented
  replacements, and exclude absent cross-feature siblings (`AEO/SPEC.md:142-175`;
  `definitions/relationships/relationships.yml:36-49,84-97,132-209`).

Here `AEO/` abbreviates
`projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/agent-execution-orchestrator/`.

## Selected bounded normalization

Re-emit these nine authored graph rows unchanged, preserving the evidence anchor already attached in
`AEO/SPEC.md:146-157`:

| Count | Rows | Existing aspect evidence |
|---:|---|---|
| 2 | `FeatureLifecyclePipelineWorkflow --orchestrates--> ExecutePipelineRoute`; `FeatureLifecyclePipelineWorkflow --orchestrates--> EmitGovernanceSignals` | `AEO/workflows.md:10-47`; DS-D8 `relationships.yml:148-161` |
| 1 | `PipelineRouteTemplate --contains--> StageContract` | `AEO/domain.md:29-43`; DS-D8 `relationships.yml:196-209` |
| 2 | `BranchStrategyPolicy --applies--> ExecutePipelineRoute`; `CancellationPolicy --applies--> CancelSupersededRun` | `AEO/rules.md:41-66,86-90`; DS-D8 `relationships.yml:164-177` |
| 3 | `RouteArtifactInterface --exposes--> AssemblePipelineRoute`; `SandboxProviderInterface --exposes--> ExecutePipelineRoute`; `DelegationTelemetryLedgerInterface --exposes--> EmitGovernanceSignals` | `AEO/interfaces.md:9-25,76-93,104-118`; DS-D8 `relationships.yml:132-145` |
| 1 | `EmitGovernanceSignals --produces--> GovernanceSignalEmission` | `AEO/operations.md:477-508`; `AEO/observability.md:30-47`; DS-D8 `relationships.yml:36-49` |

Omit these three invalid authored rows **without replacements**:

- `AssemblePipelineRoute --enforces--> StageContract` is Operation-to-Value Object; `enforces` requires
  Rule-to-Operation.
- `RunStateMachine --enforces--> ExecutePipelineRoute` has a State Machine source; DS-D8 explicitly names
  that endpoint shape as a non-example.
- `RunArtifactMapping --maps--> TelemetryEnvelope` targets a Value Object; `maps` admits Entity or
  Interface targets (`AEO/SPEC.md:121-140,148-156`;
  `definitions/relationships/relationships.yml:84-97,180-193`).

Exclude the cross-feature declarations in `AEO/SPEC.md:170-175`: their referenced fixture siblings under
`projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/domainspec-gsd-integration/` are absent.
Do not invent local stand-ins.

## Exact parent Task Session handoff

Run one bounded Task Session for `SWU-R3C-004`:

1. Source only from `AEO/`; materialize
   `projects/domainspec-v2/impl/spec/features/agent-execution-orchestrator/` within the task's allowed
   write scope (`TASK-R3C-CORPUS.md:36-43`).
2. Preserve source-backed concepts needed by the nine rows and re-emit those rows unchanged with their
   existing aspect evidence. Omit the three invalid rows and all absent-sibling cross-feature declarations;
   add no replacement semantics.
3. Seed
   `impl/spec/features/agent-execution-orchestrator/__redcheck__/run-state-machine-enforces-operation.md`
   with `RunStateMachine --enforces--> ExecutePipelineRoute`. This is the clean one-axis negative:
   `RunStateMachine` is a State Machine and `ExecutePipelineRoute` an Operation (`AEO/SPEC.md:122,126`),
   while DS-D8 requires a Rule source (`relationships.yml:84-97`).
4. Record positive `validate:content` and `validate:rels` results plus the focused negative rejection.
   Run `tags:composability` only if the materialized pack has code tags
   (`TASK-R3C-CORPUS.md:39-41`). Until those receipts exist, report AEO as selected source, not a valid pack.
5. Return `projects/domainspec-v2/development/r3-closeout-plan/task-sessions/2026-07-12-swu-r3c-004/TASK-SESSION-RESULT.md`
   with the exact files, commands, green/red outcomes, omitted-row list, unresolved residue, and the
   `GAP-DSV2-EXERCISE` synchronization handoff (`TASK-R3C-CORPUS.md:45-47`). Stop rather than invent
   semantics if current pack criteria cannot be met from the cited AEO evidence.

CampusRead remains the explicitly retained next corpus for `owns`/`belongs-to` and broader Entity-to-Entity
exercise; it must be versioned around current scoped Workflow and must not import the superseded Saga
instrument (`research.md:56-78`).

## Dispatch closeout

- Final approver: Brandenburg, Martin — **ACCEPT**.
- Exit reason: `resolved`.
- Agents spawned: 7 total — 2 explorers, 1 synthesizer, 2 skeptics,
  1 writer, 1 auditor, 0 helpers.
- Loops used: 1 bounded synthesizer/reviewer exchange; no feedback revision
  was required.
- Claim boundary: source selection is resolved; pack implementation and
  validation remain parent Task Session work.
