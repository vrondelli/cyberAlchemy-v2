---
mode: refresh
phaseStatus: pass
phaseStatusBasis: artifact-complete
mutationMode: proposal-only
handoffStatus: gated
refreshed_at: 2026-07-21
---

# Invoke Refresh Report — contract-completeness audit 002 rebase

## Result

The refresh proposal is complete. The correct implementation owner is the
existing Backend Type Test Engine package under `projects/domainspec-v2/`.
The narrow EVF package remains design and proof evidence; CyberAlchemy, IOLM,
Body War, Craft, and Inventory remain consumers or projections.

Invoke `full` was considered and rejected by the capability gate because that
mode is deferred. The supported route is:

```text
refresh proposal
  -> invoke define
  -> Decision Gate: current-v1 formation authority
  -> invoke design
  -> bounded relationship and Rule-predicate decisions
  -> invoke plan
  -> Distill validate
  -> separately authorized independent review
  -> one-SWU Task Session handoff
```

No target artifact, implementation source, definition, decision, SWU status,
consumer contract, Craft state, or release state changed in this run.

## Why the existing package cannot simply continue

The current BTE package contains the implementation lane and completed kernel/
adapter receipts, but it lacks its own Define, Requirements, and six-view
Design. Its current Plan and Work-Pack also predate audit 002 and overstate some
relationships:

- current-v1 JSON formation can be bypassed by the YAML adapter (`GAP-029`);
- only one exact criterion has compiler-path proof (`GAP-030`);
- 13 kinds and 16 criteria are machine-schema inventory, while the 16
  relationship families are selected planning coverage pending admission;
- the graph-to-obligation-to-execution-to-receipt chain and fail-closed
  aggregates remain incomplete;
- IOLM and Body War have not returned independently executed, replayable
  receipts.

The EVF package contains reusable graph/obligation/binding/evaluator/receipt
design, but its work-pack intentionally targets one `enforces` edge. Making it
the all-backend implementation owner would duplicate BTE and preserve two
competing lanes.

## Refresh signals

| Signal | Type | Claim | Target | Safety |
| --- | --- | --- | --- | --- |
| `RS-BTE-A2-001` | `evidence_added` | Audit 002 is accepted as a 53×12 non-authority review package with 55 evidence entries. | all BTE authoring artifacts | safe |
| `RS-BTE-A2-002` | `status_changed` | Old `GAP-009` is fixed and `GAP-028` is repaired; neither stays active. | gaps and traceability | safe |
| `RS-BTE-A2-003` | `blocker_opened` | Current-v1 has a JSON/YAML formation-authority false green (`GAP-029`). | Define, Requirements, Design, SWU-BTE-002 | needs review |
| `RS-BTE-A2-004` | `blocker_opened` | Exact compiler positive/discriminating-negative proof is missing for 15 of 16 criteria (`GAP-030`). | Requirements, Plan, SWU-BTE-004 | safe after authority decision |
| `RS-BTE-A2-005` | `artifact_drift` | Existing BTE text conflates admitted/profile claims with 16 relationship-family planning coverage. | Plan, layering, work-pack, tasks/waves | needs review |
| `RS-BTE-A2-006` | `artifact_drift` | The all-backend implementation owner lacks Define/Requirements/Design outputs and inherits narrow EVF concepts only by prose. | BTE package root | safe authoring delta |
| `RS-BTE-A2-007` | `route_changed` | BTE becomes the single all-backend implementation pack; EVF becomes selected design evidence and optional narrow proof. | both development packages | needs approval |
| `RS-BTE-A2-008` | `blocker_opened` | Required-structure, discriminators, equality, graph causality, bindings, evaluators, exact sets, replay, aggregates, and consumers remain open. | Requirements, Design, Plan, Work-Pack | safe planning delta |

## Target inventory and proposed artifact family

Existing BTE targets to regenerate through active modes:

- `PLAN.md`, `IMPLEMENTATION-LAYERING.md`, `WORK-PACK.md`, `EXECUTION-PACK.md`,
  `EXECUTION-DISPATCH.json`, and `DISTILL-VALIDATION.md`;
- `work-pack/shared/{CONTEXT,DECISIONS,GAPS,TRACEABILITY}.md`;
- task-local implementation contracts and W0–W4 wave files.

New BTE authoring outputs required before Plan:

- `DEFINE.md` — goal, claim boundaries, object set, authority map, and
  discovery evidence;
- `REQUIREMENTS.md` — exact numbered requirements, denominators, causal-chain
  obligations, negative controls, and receipt/replay rules;
- `DESIGN.md` — all six Invoke design views;
- `GLOSSARY.md` and `GLOSSARY-CONSISTENCY.md` — explanatory terms linked to
  machine sources without promotion.

Machine-source changes are not authored by this proposal. The later Plan must
name exact YAML/JSON/code targets and must keep every Markdown artifact
non-authoritative.

## Required authored correction model

The new package must distinguish these sets:

```text
D_kind = 13 canonical backend-kind schema inventory
D_form = 16 canonical formation-criterion inventory
D_rel  = 16 selected relationship-family planning rows, pending admission
```

For each admitted formation obligation after the authority decision:

```text
O_spec = O_gen = T_gen = E_run = M_killed
```

with nonempty exact sets, unique digest-bound bindings, independent evaluators,
zero skip/todo/orphan/unrunnable/surviving-mutant residue, and replayable
receipts joining source, profile, schema/criterion, graph, obligation, binding,
test, evaluator, execution, mutation, and aggregate identities.

## Distill result

Distill passes this proposal and rejects creation of a third implementation
package. The smallest responsible future implementation unit is the
formation-authority compatibility contract and its discriminating controls.
It must precede successor compiler breadth but does not absorb that breadth,
relationships, graph derivation, or consumer work.

## Dispatch and validation

- Context Builder: deep/strict, `8/8` obligations, zero context blockers.
- Dispatch Spec: nine-step active-mode route, `VALIDATION=pass`, zero flags or
  blocks.
- Subagents: future independent review is recommended but not authorized or run
  by this proposal.
- Distill: Standard local Proposer/Balancer trace, proposal verdict `pass`.
- `full` mode: unsupported/deferred and not evaluated as a mutation route.

## Phase and blockers

`phaseStatus=pass`: this proposal-only Refresh artifact is exact and complete;
there are no Refresh-authoring blockers.

`handoffStatus=gated`: applying the route requires explicit approval. Target
lifecycle blockers remain:

1. `GAP-029` current-v1 formation-authority decision and compatibility proof;
2. `GAP-030` exact-16 compiler-path parity;
3. relationship-family admission/selection without count inflation;
4. `DEC-GCP-001` for the optional key-and-door semantic proof only;
5. remaining audit gaps for formation details, graph causality, derivation,
   bindings, evaluators, execution, replay, aggregates, and consumers;
6. an independent audit after the complete authored package exists.

## Next route

After explicit apply approval, run active Invoke `define` against the existing
BTE package. Do not start Task Session from the stale work-pack and do not run
deferred `full` mode.
