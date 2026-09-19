---
node_type: refresh-report
is_session: true
status: complete
created: 2026-07-06
spell: invoke
mode: refresh
phase_status: flag
mutation_mode: apply-approved
target_artifact: DomainSpec v2 Batch-1 reformulation pack (WORK-PACK / DESIGN / implementation-layering)
target_owner: CTX-DSV2-REFORMULATE-BATCH1
source_session: 2026-07-06 spec-homing dialectic (this session)
decision_recorded: DEC-DSV2-SPEC-HOMING
---

# Invoke Refresh Report — Batch-1 Spec-Homing Synthesis

## Verdict

Second refresh pass on the batch-1 pack, **apply-approved**. Evidence = the 2026-07-06 dialectic on the
proposal "remove all `impl/spec/*.md` and consume everything from root."

The dialectic did **not** ratify the literal proposal. It resolved to a sharper invariant recorded as
**`DEC-DSV2-SPEC-HOMING`**:

> **Root `definitions/` is the sole *authored* authority. There are no *hand-authored* projections — any
> `impl/spec` view is generated from root and CI-verified, or it does not exist. Governance prose routes to
> its *owner surface*, not to "root."**

This re-scopes batch-1 from *"reformulate the 6 docs in place"* to *"home each doc's authority on the
correct owner surface and eliminate the hand-authored projection."* It subsumes the R0 repair (RELATIONSHIPS
is **deleted**, not kept as a projection) and refines the targets of R1/R2/R4/R5.

Phase status `flag`: the decision + plan deltas are applied, but the migrations themselves (delete
RELATIONSHIPS, home the prose docs) are downstream task-sessions with named residue.

## Why the literal proposal was rejected (evidence)

- **Only 2 of 6 top-level docs are machine-consumed** — `validate-code-tags` reads `spec/RELATIONSHIPS.md`
  + `spec/TAXONOMY.md`. The **engine reads none of them** (it reads `spec/features/**` + a sibling
  `validation/poker-team` submodule). So "consume from root" is a data-doc statement, not a whole-set one.
- **4 of 6 have no root home and no consumer** — AXIOMS / DRIFT-CONVERGENCE / TEST-PIPELINE / CONSTITUTION
  are governance prose. Forcing AXIOMS into `definitions/` would put a proposition in a *term* surface,
  violating the project's own orthogonality rule (`domainspec-v2-D3` / CAV2-D22).
- **The R3A bug was "hand-authored + unverified," not "projection."** A generated + CI-verified view removes
  the drift-bug class without collapsing the two-plane boundary (`DEF-DSV2-TWO-PLANE`).

## Per-doc verdict (the applied re-scope)

| Doc | SWU | Verdict | Home |
| --- | --- | --- | --- |
| RELATIONSHIPS.md | R0/R3 | **Delete projection; consume root** | `definitions/relationships/relationships.yml` (exists) |
| TAXONOMY.md | R2 | **Migrate UI-11 → root, then delete/generate** | `definitions/meta-types/meta-types.yml` (backend today; UI-11 owed) |
| CONSTITUTION.md | R6a/R6b | **Route to owner** | `authority/constitutions/` (already the plan) |
| AXIOMS.md | R1 | **Route to owner (basis), NOT root definitions** | `authority/` |
| DRIFT-CONVERGENCE.md | R5 | **Route to owner** | drift-governance home (generated view optional) |
| TEST-PIPELINE.md | R4 | **STAYS contract-plane** | near `impl/` — two-plane rule protects it |

## Source Signals

| ID | Type | Evidence | Target | Claim | Safety |
| --- | --- | --- | --- | --- | --- |
| SH-S1 | decision_made | 2026-07-06 dialectic (thesis/antithesis/synthesis). | DESIGN §0.5, ledger `decisions` | `DEC-DSV2-SPEC-HOMING` closed: reject "all-to-root"; adopt "no hand-authored projections + route-to-owner". | safe |
| SH-S2 | route_changed | RELATIONSHIPS is a pure restatement; root `relationships.yml` exists. | WORK-PACK R0/R3, layering L1 | R0 becomes **delete** projection + repoint validator at root (not keep). | needs_review |
| SH-S3 | route_changed | TEST-PIPELINE is the derivation contract; two-plane boundary. | WORK-PACK R4, DESIGN §3-R4 | R4 target refined: TEST-PIPELINE **stays contract-plane**, does not migrate to root. | needs_review |
| SH-S4 | route_changed | A proposition is not a term (orthogonality D3/CAV2-D22). | WORK-PACK R1, DESIGN §3-R1 | AXIOMS homes to `authority/` (constitution basis), NOT `definitions/`. | needs_review |
| SH-S5 | route_changed | Root meta-types.yml is backend-14 only; DRIFT has an owner surface. | WORK-PACK R2/R5, DESIGN §3-R2/R5 | R2 = migrate UI-11 → root then delete/generate; R5 routes to drift-governance owner. | needs_review |
| SH-S6 | policy_added | The R3A orphan was a hand-authored-projection failure. | DESIGN §0.5, layering invariant | New invariant: **no hand-authored projections** — impl/spec views are generated + CI-verified or absent. | safe |

## Delta Summary

| Delta class | Count | Summary |
| --- | ---: | --- |
| decision_made | 1 | `DEC-DSV2-SPEC-HOMING` recorded (closed, rationale = dialectic). |
| route_changed | 4 | R0 deletes; R4 stays contract-plane; R1 → authority/; R2/R5 owner homing. |
| policy_added | 1 | "No hand-authored projections" invariant. |

## Applied Changes (apply-approved, 2026-07-06)

- **`.craft/ledger.yml`** — added `DEC-DSV2-SPEC-HOMING` (closed) + `DESC-DSV2-SPEC-HOMING-001`; re-baselined batch-1 `next_move` to the migrate-to-root target.
- **DESIGN.md** — new **§0.5 Spec-homing decision** (policy + per-doc verdict table + the invariant).
- **WORK-PACK.md** — R0 → delete projection; R1 → authority/ homing note; R4 → contract-plane note; pointer to `DEC-DSV2-SPEC-HOMING`.
- **implementation-layering.md** — "no hand-authored projections" invariant; L1 consumes root directly.

## Skipped / Not Applied (downstream task-sessions)

| Item | Owner | Why deferred |
| --- | --- | --- |
| Actually delete `impl/spec/RELATIONSHIPS.md` + repoint validator | R0 task-session | Execution step (the un-regretted first move). |
| Migrate the 11 UI meta-types to root | R2 / meta-type-definitions MT5 | Content must land before TAXONOMY.md is deleted. |
| Author AXIOMS/DRIFT owner-surface homes | R1/R5 + constitution-governance | Prose-homing is per-SWU. |
| Choose generated-view-vs-none per doc | each SWU | Policy allows either; local choice. |

## Blockers And Gaps

| ID | Owner | Status | Next action |
| --- | --- | --- | --- |
| GAP-SH-UI11-MIGRATE | R2 / meta-type-definitions (MT5) | open | Move the 11 UI meta-types into root `meta-types.yml` before `TAXONOMY.md` is deleted (else orphaned). |
| GAP-SH-PROSE-HOMES | R1/R5 + constitution-governance | open | Author `authority/` homes for AXIOMS (basis) and DRIFT (drift-governance) before deleting the projections. |
| DEC-B1-SATURN-AXIOM-SCOPE | R1/R6a | open (carried) | Still gates R1; the Saturn axioms A3–A6 keep/relocate call is orthogonal to homing. |

## Dispatch Technique Trace

- `sequence`: dialectic evidence → decision → per-doc verdict → applied deltas → residue.
- `authority_split_gate`: root = sole authored authority; prose routes to owner surfaces (not folded into definitions/).
- `owner_boundary_check`: Invoke records the decision + plan deltas; each migration is its SWU owner's execution.
- `artifact_contract_bridge`: each verdict maps to a WORK-PACK SWU + a validator/home.
- `concrete_path_evidence`: every claim cites a path or a ledger row-id.
- `residue_ledger`: UI-11 migration + prose-homes carried as named gaps.

Full dispatch JSON not required: single refresh, no delegated subagents, no protected-context movement.

## Distill Validation

**Verdict:** `flag`. The decision is a single coherent unit; execution splits into: R0 (delete RELATIONSHIPS
+ repoint), UI-11 migration (GAP-SH-UI11-MIGRATE), prose-homing (GAP-SH-PROSE-HOMES), and the unchanged
R6a/R6b. Gaps named with owners → routable.

## Validation

- Ledger YAML parse: expected pass (verified post-apply).
- No code changed in this refresh → `validate` stays RC 0 / `tags:test` stays red until R0 runs.

## Next Route

`task-session` on **R0** — delete `impl/spec/RELATIONSHIPS.md`, repoint `validate-code-tags --relationships`
at root `definitions/relationships/relationships.yml` (with a yml loader), `tags:test` green. Un-regretted
under every branch of the dialectic. Then GAP-SH-UI11-MIGRATE → R2, and prose-homing → R1/R5.
