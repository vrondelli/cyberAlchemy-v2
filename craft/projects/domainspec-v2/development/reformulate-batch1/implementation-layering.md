---
node_type: implementation-layering
is_session: false
status: candidate
created: 2026-07-01
authored_by: invoke (mode: plan)
work_pack: ./WORK-PACK.md
target_artifact: projects/domainspec-v2/impl/spec (+ authority/constitutions on R6b)
---

# Reformulate Batch-1 Spec Docs — Implementation Layering

**Layer-boundary heuristic:** each layer makes exactly one *governance surface* v2-native and (where a
method exists) enforceable. Value rises with each governance the freeze-gate can rely on; cost is
re-authoring/regression risk. **Promotion requires the previous layer green** (its validator RC 0 +
review), never preference.

**Homing invariant (`DEC-DSV2-SPEC-HOMING`, 2026-07-06):** root `definitions/` is the sole *authored*
authority; **no hand-authored projections** — any `impl/spec` view is generated from root and CI-verified, or
deleted. So L1 consumes the root relationship/meta-type authority *directly* (RELATIONSHIPS.md deleted at R0);
governance prose (AXIOMS/DRIFT/CONSTITUTION) routes to its owner surface; TEST-PIPELINE stays contract-plane.

| Layer | Slice | Minimum working unit | Promotion evidence (gate to next layer) |
| --- | --- | --- | --- |
| **L0 — foundation** | R1 `AXIOMS.md` | The axioms the other 5 docs cite resolve to v2-native statements (semantic-authority A1, adapter-line A2). | `validate-doc-links` RC 0 over the doc; review-pass; A2 bound to layering C6. |
| **L1 — structure (layering governance)** | R2 `TAXONOMY.md`, R3 root `definitions/relationships/relationships.yml` + `impl/spec/RELATIONSHIPS.md` projection | The layer-membership table + the typed relationship law are v2-native and machine-checked from root authority. | **R0: code-tag composability validator repointed at root `definitions/relationships/relationships.yml` (`tags:test` RC 0);** `validate-code-tags` recognizes every concept type; `validate-relationships` PASS at `canonicalSignatures=31`; schema edge-participation slices agree with the root authority; engine `lint`/`derive` consistent. |
| **L2 — methods (validation + drift governance)** | R4 `TEST-PIPELINE.md`, R5 `DRIFT-CONVERGENCE.md`, **R7 root `definitions/DEFINITIONS.md` (net-new)** | The derived-obligation rules + the 5 drift surfaces are v2-native, contract-accurate, and (where runnable) exercised; **R7: the DS-D1/DS-D2/DS-D8 domain vocabulary exists in root `definitions/` (depends R2+R3)**. | engine `derive`/`lint` consistent with TEST-PIPELINE; code-tag-drift bound as a drift method; **no moat leak**; review-pass; **R7: every meta-type/verb/signature resolves to a DS-D* definition**. |
| **L3 — codification** | R6a `impl/spec/CONSTITUTION.md`, R6b credibility-constitution split | v1 C1–C11 crosswalked into v2 rules; the per-governance constitution split executed with the C6↔C11 binding preserved. | `constitution-governance validate`; full `npm run validate` + `engine:test` stay green; **OQ-2 closed**; freeze-gate-ready. |

**Dependency order:** **R0 (code-tag repair)** → R1 → {R2 → R3 ✅} → {R4, R5} → R6a → R6b.

**Recomposition:** L0–L3 green ⇒ all 6 `REFORMULATE` rows reformulated ⇒ with the (already-green)
build-proof, the **v1-freeze gate** (`IMPORT-MANIFEST.md`) opens.

**Layer risks / residue carried down:** L2 documents the engine *contract only* (δ-rules private);
L2's drift surface names the `Stream<CheckResult>` engine impl as separate residue (R-trend-type);
L3's R6b executes the split plan already recorded in the credibility constitution.
**L1 carries a repair pre-req (R0, added 2026-07-06):** R3A's authority relocation left the code-tag
validator reading a now-ruleless `spec/RELATIONSHIPS.md` (`tags:test` red until repointed).
