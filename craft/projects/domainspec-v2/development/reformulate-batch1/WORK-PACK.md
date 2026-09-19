---
node_type: work-pack
is_session: false
status: candidate
boundary: INTERNAL — reformulate Batch-1 spec docs (v1→v2); v1 read-only; engine src/rules δ-algorithm never described
created: 2026-07-01
authored_by: invoke (mode: plan)
design: ./DESIGN.md
layering: ./implementation-layering.md
target_artifact: projects/domainspec-v2/impl/spec (+ authority/constitutions on R6b)
source_of_verdicts: ../../research/2026-06-29-v1-import-triage/findings.md
manifest: ../../IMPORT-MANIFEST.md
complexity: medium
---

# Reformulate Batch-1 Spec Docs — Work-Pack

Batch 1's engine fork is done and green; its **6 spec docs are `reformulation-pending`** (copied verbatim
to unblock the build). This work-pack re-authors them for v2's *govern + enforce Ontology A on evidence*
mandate, binds each to its ratified governance owner, and closes the **v1-freeze gate**
([IMPORT-MANIFEST.md](../../IMPORT-MANIFEST.md)). **v1 (`implementation/domainspec/`) is read-only** —
reformulate the v2 copies under `impl/spec/`. Validators are runnable post-G3, so acceptance is
machine-checkable, not just declared.

**Reformulation contract (every SWU):** (a) strip v1-specific content/paths; (b) re-anchor to
`impl/spec/`; (c) bind to the governance owner + matching constitution rule; (d) make the governance
method *runnable* where one exists; (e) preserve load-bearing terms with tracked definition IDs (C(meta-4));
(f) no v1 residue (grep clean); (g) **no moat leak** — never describe the engine `src/rules` δ-algorithm;
(h) **matches the target-result in [DESIGN.md](./DESIGN.md) §3** for this doc — the *semantic* gate, above
validator-green (validator green proves well-formed; §3 proves it says the right v2 thing).

**Pre-execution blockers (from [DESIGN.md](./DESIGN.md) §4 — resolve before the mapped SWU runs):**
D1 drift-surface reconciliation → **R5** · D2 UI scope (25 vs backend-14) → **R2** · D3 v1-only file
references → **R5/R6a** · D4 forbidden-edge law form → **R3**.

## SWU manifest
| SWU | Layer | Doc → governance | Depends | Acceptance (green) |
| --- | --- | --- | --- | --- |
| **R0 ✅ DONE** | pre (repair) | **Deleted** `impl/spec/RELATIONSHIPS.md` projection + repointed `validate-code-tags` at root `definitions/relationships/relationships.yml` via build-from-owned `loadRelationshipRulesFromAuthority` — per `DEC-DSV2-SPEC-HOMING` | — | **[met 2026-07-06]** projection gone; `tags:test` 8/8 (was 2 fail `CT-VAL-002`); validator reads 31 root signatures; validate/engine:test/typecheck RC 0 |
| **R1 ✅ DONE** | L0 | `authority/AXIOMS.md` + `authority/AXIOMS.yml` → base + layering (A2); **homed to `authority/` (constitution basis), NOT `definitions/`** (`DEC-DSV2-SPEC-HOMING` — a proposition is not a term); `impl/spec/AXIOMS.md` deleted/non-authority | — | **[met 2026-07-10]** `validate:docs` RC 0; A2 bound to C6; Saturn-routed material preserved; CAV2-D49/D53/D54 definition-sync complete; review-pass. `DEC-B1-SATURN-AXIOM-SCOPE` resolved: keep A1/A2/A3-recast; A4/A6 + C3/C4/C9/C11 → Saturn; A5 split. |
| **R2** | L1 | `impl/spec/TAXONOMY.md` → layering | R1, R0, CT-1 | `tags:test`/`validate-code-tags` recognizes schema-backed concept types; `engine:lint` CLEAN; no v1 residue. **Consumes** the child `meta-type-formalization` for the formal per-type criteria (does not re-derive them). **State 2026-07-10: content v2-native; code-tag consumer repaired by CT-1; remaining close gate = `GAP-SH-UI11-MIGRATE` before TAXONOMY deletion/generation** |
| **R3** | L1 | root `definitions/relationships/relationships.yml` + `impl/spec/RELATIONSHIPS.md` projection → layering law (C6) + validation check (C11) | R2 | ✅ **executed (R3A, 2026-07-02)** — `validate:rels` PASS at `canonicalSignatures=31`; edge-law = what C11 checks & C6 forbids; endpoints typed; generated/deprecated/deferred relation views separated from canonical authored edges. **Side-effect: orphaned the code-tag consumer → see R0** |
| **R4** | L2 | `impl/spec/TEST-PIPELINE.md` → validation (C5, C10) — **STAYS contract-plane** (`DEC-DSV2-SPEC-HOMING`; two-plane rule, not migrated to root) | R2, R3 | Consistent w/ engine `derive`/`lint`; contract-only (no δ-algorithm); review-pass |
| **R5** | L2 | `impl/spec/DRIFT-CONVERGENCE.md` → drift (C7) — **home authority on the drift-governance owner surface** (`DEC-DSV2-SPEC-HOMING`); generated impl view optional | R2 | 5 surfaces + trend-not-signal + write-authority proviso; code-tag-drift bound; review-pass |
| **R6a** | L3 | `impl/spec/CONSTITUTION.md` (v1 C1–C11) → domain governance | R1–R5 | Each v1 C-rule crosswalked or explicitly dropped; validators stay green; **OQ-2 crosswalk closed** |
| **R6b** | L3 | credibility-constitution per-governance split | R6a | base + validation/layering/drift constitutions created; C6↔C11 binding preserved; `npm run validate`+`engine:test` green |
| **R7** | L2 | `DEFINITIONS.md` (**NET-NEW** — migration omitted it) → domain vocabulary | R2, R3 | DS-D1 meta-types + DS-D2 verbs defined w/ IDs (3-voice); concept-registry home; `validate:docs` clean. **Consumes** the child `meta-type-formalization` (DS-D1/D2). **Home = root `definitions/`** per the consolidation (not `impl/spec/`). |

> **R0 is a repair, not a reformulation (added 2026-07-06 refresh).** R3A relocated the relationship
> authority to the root machine file and thinned `impl/spec/RELATIONSHIPS.md` to a projection.
> `validate-relationships` follows the root authority (green), but the Batch-2 code-tag composability
> validator still loads rules from `spec/RELATIONSHIPS.md` and now errors (`CT-VAL-002`). Until R0 lands,
> `tags:test` — **R2's acceptance gate** — stays red. See `refreshes/2026-07-06-batch1-post-r3a-retriage/`.

> **`DEC-DSV2-SPEC-HOMING` (2026-07-06 dialectic) re-scopes this pack.** Root `definitions/` is the sole
> *authored* authority; **no hand-authored projections** (impl/spec views are generated + CI-verified or
> deleted); governance prose routes to its **owner surface**, not "root." So R0 **deletes**
> `impl/spec/RELATIONSHIPS.md`; R2 migrates UI-11 → root then deletes/generates TAXONOMY; R1 homes AXIOMS to
> `authority/` (not `definitions/`); R4 keeps TEST-PIPELINE **contract-plane**; R5 homes DRIFT to
> drift-governance; R6a/R6b unchanged. Full verdict table: DESIGN §0.5. See
> `refreshes/2026-07-06-spec-homing-synthesis/`.

Global regression gate for **every** SWU: `npm run validate`, `npm run engine:test`, **and** `npm run tags:test` stay RC 0 after the edit. (`tags:test` added 2026-07-06: R3A showed the aggregate `validate` does not cover the code-tag composability path — a real gate can be red while `validate` is green.)

---

## R1 — AXIOMS (L0) — DONE
- **State (2026-07-10):** R1 is closed. `authority/AXIOMS.md` and `authority/AXIOMS.yml` are the R1 continuity authority pair; `impl/spec/AXIOMS.md` is deleted/non-authority. A1/A2/A3 are retained as D54-shaped rows; A4/A6 route to Saturn; A5 splits between DomainSpec shift-left validation and Saturn reflection. `DEC-B1-SATURN-AXIOM-SCOPE` is resolved and the CAV2-D49/D53/D54 definition-sync repair is applied.
- **Write scope delivered:** `authority/AXIOMS.md`, `authority/AXIOMS.yml`, deletion/de-authorization of `impl/spec/AXIOMS.md`, and parent status sync.
- **Evidence:** `development/reformulate-batch1/r1-axioms-closeout/TASK-SESSION-SWU-R1A-001.md`; `development/reformulate-batch1/r1-axioms-closeout/definition-sync-repair/TASK-SESSION-SWU-R1A-002A.md`; `development/reformulate-batch1/r1-axioms-closeout/definition-sync-repair/TASK-SESSION-SWU-R1A-002B.md`.
- **Validation:** `npm run validate`, `npm run tags:test`, `npm run engine:test`, and `npm run typecheck` pass in the closeout stream.
- **Residue preserved:** R2 TAXONOMY, R5 DRIFT owner-home, R6a crosswalk, and R6b constitution split remain open.

## R2 — TAXONOMY (L1, layering)
- **State (2026-07-10):** `TAXONOMY.md` is v2-native (14 backend / 11 UI), no v1 residue. R0 repaired the
  relationship consumer and CT-1 repaired the taxonomy consumer: `validate-code-tags` now reads the backend-14
  type set from `spec/meta-types` and passes with `TAXONOMY.md` absent. **Remaining gate:** `GAP-SH-UI11-MIGRATE`
  — the 11 UI meta-types still need root meta-type authority before `TAXONOMY.md` can be deleted/generated.
- **Write scope:** `impl/spec/TAXONOMY.md`.
- **Steps:** migrate/define the UI-11 meta-types in root authority, then delete or generate the old
  `impl/spec/TAXONOMY.md` projection per `DEC-DSV2-SPEC-HOMING`; preserve layer-membership + the layer-law
  statement under layering governance.
- **Impl detail:** the concept-type list is load-bearing (the tag validator checks tag `concept.type` against
  root meta-type schemas after CT-1); every type needs a tracked definition ID; layer-membership assigns each
  concept a layer (feeds C6/adapter-line). A layer *assignment* is not a dependency *verdict* (C6).
- **Validation:** `npm run tags:test` RC 0 (8/8) with the reformulated taxonomy; `npm run engine:lint` CLEAN; no v1 residue.
- **Verification:** flip one concept type in a fixture → tag validator flags it (discriminating).

## R3 — RELATIONSHIPS (L1, layering law + validation check)
- **Write scope:** root `definitions/relationships/relationships.yml` (machine authority) + `definitions/relationships/relationships.md` (human authority companion) + `impl/spec/RELATIONSHIPS.md` (implementation projection/view only).
- **Steps:** author the typed relationship vocabulary + endpoint signatures + generated/deprecated/deferred sections; bind the LAW to layering (C6) and note the CHECK is validation (C11, `validate-relationships`); keep the C6↔C11 relationship explicit.
- **Catalog-coverage reconciliation:** `queries` is generalized to `Behavioral -> Entity`; `produces-for` covers `Operation -> Entity`; `Operation -> ValueObject` returns and the Event payload+publisher composite remain deferred candidates until they prove distinct implementation behavior.
- **Edge-law admissibility (build-from-owned — CAV2-D22 orthogonal classification / D29 axis orthogonality / D16 typed coupling):** an edge type is admissible only if it composes into *different code*; else fold the distinction into the node type or a typed coupling flag. Rulings: **keep** `enforces`≠`applies` (guard vs select); **collapse/deprecate** `enforces-cross` into `enforces` plus cross-feature metadata; **reject** `queries` for `Calc→Policy` (redundant); **widen** `applies : Policy→{Operation, Calculation}`; **treat** `owned-by` as a generated inverse view of `owns`, not a canonical authored edge. Governance orthogonality only (NOT Lean/Hilbert). See `DEC-DSV2-EDGE-ADMISSIBILITY`.
- **Impl detail:** each active signature = (verb, source type, target type, lifecycle status) over TAXONOMY concepts; forbidden pairs are any authored edge outside active signatures or inside generated/deprecated/deferred-only surfaces; `validate-relationships` reads the root authority by default, while `impl/spec/RELATIONSHIPS.md` mirrors only the implementation view.
- **Validation:** `npm run validate:rels` PASS at `canonicalSignatures=31`; invalid endpoint fixtures return `unconstructible-edge`; generated inverse fixture (`owned-by`) returns `noncanonical-edge`; `validate:content` also checks declared feature edges.
- **Verification:** every declared feature edge has typed endpoints; schema `edge_participation` slices agree with the root authority.

## R4 — TEST-PIPELINE (L2, validation)
- **Write scope:** `impl/spec/TEST-PIPELINE.md`.
- **Steps:** re-author the derived-obligation rules the engine runs; bind to **validation governance** (C5 derivation-from-spec, C10 completeness); describe the derive→check→emit **contract** and the obligation classes — **NOT** the `src/rules` δ-algorithm (moat).
- **Impl detail:** state, per spec construct, which obligations are derived + expected-value source (the spec, per C5); align terminology with the engine CLI (`derive`/`lint`/`emit-tests`); the algorithm that produces obligations stays private.
- **Validation:** cross-check the documented obligation classes against `engine:test` (97/97) behavior; **no-moat-leak** grep (no rule internals); review-pass.
- **Verification:** a reviewer can predict `derive` output classes from the doc without seeing `src/rules`.

## R5 — DRIFT-CONVERGENCE (L2, drift)
- **Write scope:** `impl/spec/DRIFT-CONVERGENCE.md`.
- **Steps:** re-author the 5 drift surfaces (semantic / contract / runtime / governance / coordination) + convergence criteria; bind to **drift governance** (C7); state convergence = evidence-backed trend, never a single signal; state the **write-authority proviso** (no surface writes a node's promotion-status) and that **Saturn is the actuator, not the authority**.
- **Impl detail:** the code-tag-drift tooling (`compare-code-tag-drift.ts`) is a drift *method* — bind it; note the `Stream<CheckResult>` + guardedness engine impl is **separate residue** (R-trend-type), not delivered here.
- **Validation:** review-pass (surfaces + criteria present); code-tag-drift method reference resolves; write-authority proviso stated.
- **Verification:** the 5 surfaces are enumerated and each has a convergence criterion.

## R6a — CONSTITUTION crosswalk (L3, domain governance)
- **Write scope:** `impl/spec/CONSTITUTION.md`.
- **Steps:** crosswalk each v1 C1–C11 into a v2 domain-governance rule (or explicitly DROP with reason); bind each rule to its governance (validation/layering/drift) + AXIOMS; reconcile with the credibility constitution's rules (no double-ownership).
- **Impl detail:** this is **OQ-2**'s crosswalk half; keep domain-governance rules (impl/spec) distinct from credibility rules (authority/); every rule gets a validation-mode label.
- **Validation:** `constitution-governance validate`; `npm run validate` + `engine:test` stay green; every v1 C-rule accounted for (crosswalked or dropped).
- **Verification:** a v1→v2 rule crosswalk table exists; no orphaned v1 rule.

## R6b — Credibility-constitution split (L3)
- **Write scope:** `authority/constitutions/{domainspec-v2-CONSTITUTION.md (slim to base), validation-governance-CONSTITUTION.md, layering-governance-CONSTITUTION.md, drift-governance-CONSTITUTION.md}`.
- **Steps:** execute the split plan recorded in the credibility constitution — move C5/C9/C10/C11 → validation, C6 → layering, C7 → drift; keep base = C1–C4, C8, C(meta-1..4); preserve the **C6↔C11** cross-binding; set each new file's owner route + selectors; update the split-plan section to "executed".
- **Impl detail:** composition order (narrowest-first) must be documented in the base; no rule text changes beyond relocation + the crosswalk from R6a; do not over-fragment (per-governance, never per-rule).
- **Validation:** `constitution-governance validate`; the four files compose without conflict; validators still green.
- **Verification:** every rule lives in exactly one file; C6↔C11 reference resolves across files; OQ-2 marked closed.

## R7 — DEFINITIONS (net-new, L2)  ← added 2026-07-01 (refresh)
- **State (2026-07-06):** substantially delivered out-of-band by the `meta-type-definitions` cycle — DS-D1 (backend) meta-type cards + DS-D2/DS-D8 relationship cards live in `definitions/DEFINITIONS.md`, `definitions/DEFINITIONS-INDEX.md`, and `definitions/meta-types/`. Remaining R7 work is **reconcile-and-close** (confirm every TAXONOMY type / RELATIONSHIPS verb resolves to a DS-D* card; mark the IMPORT-MANIFEST R7 row done). UI DS-D1.15..25 stay deferred to MT5.
- **Write scope:** root `definitions/DEFINITIONS.md` + `definitions/DEFINITIONS-INDEX.md`; implementation schemas remain cited machine evidence, not definition authority.
- **Depends:** R2 (meta-types) + R3 (edge verbs). **Net-new** — no v1 source in the 6-doc Batch-1 set (the migration omitted it; v1 definitions lived under `research/projects/domainspec/definitions/`).
- **Steps:** aggregate the finalized 25 TAXONOMY meta-types as **DS-D1** definitions + the RELATIONSHIPS edge verbs as **DS-D2** definitions (+ the DS-D8 relationship-signature surface), each with a stable ID + 3 voices (formal / plain / domain-context); wire it as the `definitions-governance` M2-C1 concept-registry-aggregation home.
- **Impl detail:** DS-D* = the *domain* vocabulary inside root `definitions/`; do NOT duplicate the governance/synthesis vocabulary `domainspec-v2-D*` already living there. Each entry is a **term**, not a rule (rules stay in CONSTITUTION — no `RULES.md`, per domainspec-v2-D3/CAV2-D22 orthogonality). `.schema.yml` files and `impl/spec/RELATIONSHIPS.md` are implementation evidence/projections, not definition authority.
- **Validation:** `npm run validate:docs` clean; every TAXONOMY type + RELATIONSHIPS verb resolves to a DS-D* entry; `definitions-governance` can aggregate a feature Concept Registry against it.
- **Verification:** reviewer confirms every meta-type/verb has a definition; index synced.

---

## Dispatch technique trace
`sequence` (L0→L3 dependency gates) · `owner_boundary_check` (each doc→its governance owner; moat untouched; v1 read-only) · `artifact_contract_bridge` (each doc must satisfy its governance validator) · `validation_loop` (per-SWU acceptance = validator RC 0 + review) · `concrete_path_evidence` (exact paths + validators per SWU) · `scu_swu_reduction` (7 SWUs, one coherent doc/step each) · `recomposition_proof` (→ freeze gate) · `residue_ledger` (below). **No full dispatch JSON** — single-owner sequence. **Fan-out option:** R1→R6 are per-doc independent enough to dispatch one subagent each via `domainspec-subagents-strategy` (respecting the dependency order); that is a **task-session execution-mode choice**, not required by the plan.

## Distill validation — flag
- **Smallest coherent units:** ✅ one doc/step per SWU (R6 pre-split into R6a crosswalk + R6b split so neither is oversized).
- **Recomposition proof:** ✅ 7 SWUs green ⇒ 6 REFORMULATE rows done ⇒ freeze gate opens.
- **Gaps named (repair path):** (1) **R-trend-type** — DRIFT documents the surface; the `Stream<CheckResult>`+guardedness engine impl is separate → owner: validation/drift engine lane. (2) **moat-contract-only** — R4 documents the derive contract, never the δ-algorithm → enforced by the no-moat-leak check.
- **Verdict:** flag (routable — both gaps carried in the residue ledger below).

## Residue
- R-trend-type: drift's engine realization (`Stream<CheckResult>` + guardedness) is not in this pack.
- Moat boundary: TEST-PIPELINE is contract-only; `src/rules` stays private.
- The `sample` feature fixture is a test surface; real feature packs are separate work (makes C10 non-vacuous).

## Freeze gate
When R1–R6b are green AND the build-proof stays green, `implementation/domainspec/` becomes a FROZEN
evidence source (`IMPORT-MANIFEST.md` Freeze gate). Until then v1 stays readable, not edited.

## Next route
`task-session` per SWU in the order **UI-11 migration / R2 verify-close → reconcile-close R7 → {R4, R5} → R6a → R6b**.
**R0, R1, and CT-1 are done** — R0 completed R3A's relationship-consumer recomposition; R1 closed the AXIOMS
authority home plus CAV2 definition-sync; CT-1 closed the code-tag taxonomy consumer landmine. (Re-baselined 2026-07-06: R2
is verify-and-close, R3 is done, R7 is substantially delivered — see
`refreshes/2026-07-06-batch1-post-r3a-retriage/`.) Solo or fan-out is the task-session decision. **Note:**
the code-tag validator retarget was done once in G3 against `impl/spec/RELATIONSHIPS.md`, but **R3A moved the
authority out from under it** — so R0 re-did the relationship retarget against the root authority, and CT-1
re-did the taxonomy retarget against root meta-type schemas. Batch 2's other items (waiver reset; code-tag
contract/gate) remain a sibling work-pack.
