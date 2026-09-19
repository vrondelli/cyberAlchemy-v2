---
node_type: refresh-report
is_session: true
status: complete
created: 2026-07-02
spell: invoke
mode: refresh
phase_status: flag
mutation_mode: proposal-only
target_artifact: DomainSpec v2 R3 edge-law artifact set
source_review: ../../reviews/2026-07-02-r3-edge-law-formalization/findings.md
source_handoff: ../../HANDOFF-novice-test-edge-findings.md
---

# Invoke Refresh Report - R3 Edge-Law Artifact Set

## Verdict

Refresh input is valid. The accepted R3 review composes into artifact deltas across the batch-1
reformulation package, the meta-type formalization package, the meta-type definitions package, root
definitions, relationship spec, and validator surfaces. The novice-use handoff adds two proposed R3
decisions and one concrete schema/table consistency fixture: Entity-to-Entity associations, Saga
connectability, and Operation edge-participation drift.

Phase status is `flag`, not `pass`, because the refresh is intentionally proposal-only and the target
changes require the batch-1 R3 owner route. This report does not mutate `RELATIONSHIPS.md`, definitions,
validators, work-pack rows, or canonical edge signatures.

## Scope

**Refresh scope:** all artifacts touched by R3 edge-law formalization readiness.

**Mutation mode:** `proposal-only` per Invoke refresh default. The user asked to refresh all artifacts, but
did not explicitly select `apply-approved`; the safe output is therefore this report plus a patch proposal.

**Evidence date:** 2026-07-02.

**Source context selected:**

- `reviews/2026-07-02-r3-edge-law-formalization/findings.md`
- `reviews/2026-07-02-r3-edge-law-formalization/attacks.md`
- `HANDOFF-novice-test-edge-findings.md`
- `../comprehension-novice-test/stall-dataset.md`
- `development/reformulate-batch1/{DESIGN.md,WORK-PACK.md,implementation-layering.md}`
- `development/meta-type-formalization/{DESIGN.md,WORK-PACK.md}`
- `development/meta-type-definitions/{DEFINE.md,DESIGN.md,WORK-PACK.md,CANDIDATES.md}`
- `definitions/{DEFINITIONS.md,DEFINITIONS-INDEX.md}`
- `impl/spec/RELATIONSHIPS.md`
- `impl/tools/{validate-relationships.ts,validate-content.ts}`
- `impl/governance/tags/tools/lib/code-tag-rules.ts`
- `impl/package.json`

## Target Artifact Inventory

| artifact | current state | refresh verdict |
| --- | --- | --- |
| `development/reformulate-batch1/DESIGN.md` | R3 target still names additive `>29` count and R3-P1/P2 add-edge framing. | Refresh required. |
| `development/reformulate-batch1/WORK-PACK.md` | R3 acceptance still count-led; R7 still contains old `impl/spec/DEFINITIONS.md` home in several places. | Refresh required. |
| `development/reformulate-batch1/implementation-layering.md` | L1/L2 dependencies still describe R3/R7 before the accepted review refinements. | Refresh required. |
| `development/meta-type-formalization/DESIGN.md` | Already says edge checks exist conceptually; needs R3-gated DS-D8 wording. | Refresh required. |
| `development/meta-type-formalization/WORK-PACK.md` | Correctly marks MT3 edge half blocked on R3; needs endpoint-aware validator acceptance wording aligned to R3 findings. | Refresh required. |
| `development/meta-type-definitions/DEFINE.md` | DD-D3 already resolves root definitions home. | No-op, keep as source of truth. |
| `development/meta-type-definitions/DESIGN.md` | Already routes Tier 1 to root `definitions/`. | No-op, optional cross-link only. |
| `development/meta-type-definitions/WORK-PACK.md` | DD2 still says cards land in `impl/spec/DEFINITIONS.md`. | Refresh required. |
| `development/meta-type-definitions/CANDIDATES.md` | Still states `domainspec-v2-D9` is aliased `DS-D8` in schemas. | Refresh required. |
| `definitions/DEFINITIONS.md` | DS-D1 note correctly defers DS-D2/DS-D8 after R3. | Keep; optional R3 review cross-link. |
| `definitions/DEFINITIONS-INDEX.md` | Index is not ready for DS-D2/DS-D8 rows yet. | No-op until R3 implementation. |
| `impl/spec/RELATIONSHIPS.md` | Human-readable 29-label table, no authoritative finite signature relation. | Refresh required. |
| `impl/tools/validate-relationships.ts` | Parses canonical labels only. | Refresh required. |
| `impl/tools/validate-content.ts` | Checks node criteria; skips files without Concept Registry; no edge signature check. | Refresh required when R3/MT4 lands. |
| `impl/tools/tests/*` | No bad-endpoint relationship fixture. | Refresh required. |
| `impl/spec/features/sample/SPEC.md` | Relationship validation fixture is vacuous for endpoint law. | Refresh or supplement required. |
| `impl/package.json` | `validate` excludes `validate:content` and `tools:test`. | Refresh when endpoint/content validation is stable. |

## Refresh Signals

| id | type | evidence | target artifacts | claim | safety |
| --- | --- | --- | --- | --- | --- |
| R3-S1 | evidence_added | `findings.md` accepted four MAJOR findings and final approver accepted. | all listed targets | R3 review is valid refresh input. | safe |
| R3-S2 | artifact_drift | `DESIGN.md` and `WORK-PACK.md` still expect `>29`/additive edge growth. | batch-1 design, work-pack, layering | Count-led R3 acceptance conflicts with edge-law admissibility decisions. | needs_review |
| R3-S3 | artifact_drift | `RELATIONSHIPS.md` has a 29-label table; `validate-relationships.ts` reads only labels. | relationships spec, validator, fixtures | R3 lacks machine-enforceable endpoint signatures. | needs_review |
| R3-S4 | blocker_opened | AEO wrong-endpoint labels pass `validate:rels`; `validate:content` checks 0 concepts for sample. | validators, fixtures, package scripts | Forbidden/unconstructible closure is not discriminating yet. | needs_review |
| R3-S5 | route_changed | Meta-type formalization marks MT3 edges blocked on R3; root definitions package resolves DD-D3. | meta-type formalization, meta-type definitions, R7 | MT3b/DS-D8 must consume R3, not invent signatures locally. | safe |
| R3-S6 | artifact_drift | R7 text in batch-1 and meta-type definitions still references `impl/spec/DEFINITIONS.md`. | work-packs, definitions candidate package | Canonical definition cards should route to root `definitions/`, with schemas as machine evidence. | safe |
| R3-S7 | route_changed | Code-tag tooling already parses `From -> To`; `tags:validate` is not a live R3 gate because its input file is absent. | validator implementation plan | Reuse parser precedent, but wire endpoint validation into R3/MT4 gates explicitly. | needs_review |
| R3-S8 | evidence_added | `HANDOFF-novice-test-edge-findings.md` reports a blind novice-use witness with disk-verified edge blockers. | batch-1 R3, relationships spec, validators | Use-based evidence adds R3-F5 Entity-to-Entity association and R3-F6 Saga orphan decisions. | safe |
| R3-S9 | blocker_opened | `RELATIONSHIPS.md:13-27` has no Entity-to-Entity association edge and no `saga` match. | batch-1 design/work-pack, relationships spec | R3 must either add/define these signatures or explicitly rule them out/fold them. | needs_review |
| R3-S10 | artifact_drift | `operation.schema.yml:22` says Operation is source of `performs` and `emits`, but `RELATIONSHIPS.md:13,27` says Entity is the source of both. | meta-type formalization, schemas, validator fixtures | Edge-participation slices need a consistency check against the reconciled signature table. | needs_review |

## Delta Summary

| delta class | count | summary |
| --- | ---: | --- |
| evidence_added | 2 | Accepted R3 review and novice-use handoff become refresh sources. |
| artifact_drift | 4 | Count-led R3 acceptance, label-only validator model, stale definition home drift, and schema/table edge-participation drift. |
| blocker_opened | 2 | Forbidden-edge closure remains unproven; Entity-to-Entity and Saga connectability are undecided. |
| route_changed | 2 | MT3b/DS-D8 now routes through R3; validator implementation should reuse code-tag endpoint parser precedent. |
| no_op | 3 | `meta-type-definitions/DEFINE.md`, `meta-type-definitions/DESIGN.md`, and `DEFINITIONS-INDEX.md` need no immediate mutation. |

## Proposed Changes

Detailed patch instructions are in [REFRESH-PATCH-PROPOSAL.md](./REFRESH-PATCH-PROPOSAL.md).

1. Replace count-led R3 acceptance with decision-led reconciliation.
2. State the authoritative signature surface choice before editing validators.
3. Refresh R7 to root `definitions/`, not `impl/spec/DEFINITIONS.md`.
4. Clarify `DS-D8` vs `domainspec-v2-D9`: use one canonical role name and treat any other spelling as a deprecated alias or explanatory method term.
5. Add endpoint-aware validation acceptance: declared edge admissible iff `(verb, source_type, target_type)` is allowed.
6. Add negative fixtures for wrong/reversed endpoint types.
7. Wire endpoint/content validation into aggregate validation only after discriminating tests pass.
8. Fold the novice-use R3-F5/R3-F6 decisions into R3: Entity-to-Entity association and Saga connectability.
9. Add an `edge_participation` consistency check so schema slices cannot contradict the relationship table.

## Skipped Changes

- No direct canonical mutation was applied.
- No DS-D2/DS-D8 card was promoted.
- No exact canonical edge count was chosen; R3 implementation must compute it after collapse/widen/property decisions.
- No event payload/publisher decision was forced; it remains R3-P3.

## Blockers And Gaps

| id | owner | status | resolution path |
| --- | --- | --- | --- |
| BLK-R3-SIGNATURE-SURFACE | batch-1 R3 / layering + validation governance | open | Choose whether `RELATIONSHIPS.md` itself becomes a strict signature table or whether a companion machine file is authoritative. |
| BLK-R3-EDGE-COUNT | batch-1 R3 | open | Reconcile `enforces-cross`, `applies`, `queries`, `Operation -> ValueObject`, and Event before restating canonical count. |
| GAP-R3-VALIDATOR | validation governance | open | Make `validate:rels` join declared graph edges through Concept Registry types and reject absent/forbidden signatures. |
| GAP-R3-FIXTURES | validation governance | open | Add bad-endpoint fixtures for `enforces`, reversed endpoints, and wrong-target `queries`. |
| GAP-R7-ROUTING | definitions-governance + batch-1 R7 | open | Patch stale `impl/spec/DEFINITIONS.md` references to root `definitions/` and clarify schema-vs-card authority. |
| BLK-R3-ENTITY-ASSOCIATION | batch-1 R3 | open | Decide whether Entity-to-Entity associations are first-class edges or field-table-only references. |
| BLK-R3-SAGA-SIGNATURE | batch-1 R3 | open | Decide whether Saga gets signatures or folds into Workflow plus cross-feature metadata. |
| GAP-R3-EDGE-PARTICIPATION-CONSISTENCY | validation governance + meta-type formalization | open | Check schema `source_of`/`target_of` slices against the reconciled relationship signatures. |

## Dispatch Technique Trace

Selected from `arcanum/formulae/dispatch-spec/TECHNIQUE-CATALOG.md`:

- `sequence`: source review -> artifact inventory -> refresh signals -> patch proposal -> next route.
- `handle_handoff`: references review artifacts and target paths by handle, not copied source blobs.
- `owner_boundary_check`: Invoke authors refresh deltas only; R3/definitions/validation owners apply them.
- `artifact_contract_bridge`: each proposed change maps to a target artifact contract or validator gate.
- `concrete_path_evidence`: every signal cites concrete repo paths.
- `residue_ledger`: blockers and skipped changes stay named.
- `authority_split_gate`: canonical definition promotion and edge-law mutation remain owner-gated.
- `validation_loop`: proposal includes commands and checks to prove the refresh package and later implementation.

Full dispatch JSON was not required: this is a single Invoke refresh package with no delegated subagent
execution and no protected context movement.

## Distill Validation

**Verdict:** `flag`.

The smallest coherent refresh unit is "R3 edge-law artifact alignment." It is broad but coherent because
the accepted review found cross-artifact drift that cannot be repaired one file at a time without breaking
R3/MT3b/DS-D2/DS-D8 recomposition. The implementation must split into SWUs:

- SWU-R3A: reconcile edge-law decisions and signature authority, including Entity-to-Entity and Saga decisions.
- SWU-R3B: patch R3 work-pack/design/layering and definition routing.
- SWU-R3C: implement endpoint-aware validator, schema/table consistency checks, and negative fixtures.
- SWU-R3D: refresh definitions candidates/index only after owner approval.

## Validation

Refresh package validation run:

- `refresh-report.json` parse: pass.
- Refresh package whitespace scan: pass.
- `npm run validate:rels`: pass, `canonicalEdges=29`.
- `npm run validate:content`: pass, `0 concept(s) checked in 1 file(s); schemas=14`.
- `npm run tools:test`: pass, 20/20.
- Handoff verification: `rg -ni "saga" impl/spec/RELATIONSHIPS.md` returns no matches.
- Handoff verification: `operation.schema.yml` edge-participation contradicts `RELATIONSHIPS.md` for `performs` and `emits`.

The current-state checks are intentionally evidence of drift, not R3 completion: they show the label-only
relationship validator is green and the node-content validator is green without checking a real feature
Concept Registry.

## Next Route

`task-session` on the R3 refresh package, beginning with SWU-R3A. Do not start with validator mutation until
the authoritative signature surface and post-reconciliation edge count are decided.
