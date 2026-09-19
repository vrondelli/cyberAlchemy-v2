---
tags: [dependency-map, language-validator-convergence, lean-code-validator, domainspec-language, refinement-run, research]
node_type: research
is_session: true
layer: [domain, application]
nature: reference
status: draft
version: 0.1.0
last_updated: 2026-06-08
---

# DEPENDENCY-MAP — DomainSpec language ↔ Lean validator

> Role: `dependency-mapper`. Read-only x-ray. This is a MAP of every dependency
> edge between the DomainSpec **language** (DESIGN-PACKAGE) and the **Lean
> validator** (`lean-code-validator` v3), in both directions, with the realizing
> artifact and a status flag per edge: **EXISTS** / **DESIGNED** / **MISSING**.
> Every edge cites a source.

## Sources

- **DP** = `research/DESIGN-PACKAGE.md` (language: doc kinds §2, 9-field envelope §3,
  contract↔schema §4, iteration §5, example/fixture §6, validation authority §7,
  lifecycle §8, open decisions §9, blockers §10).
- **VR** = `internal_tools/lean-code-validator/README.md` (Profile, σ-signature,
  EdgeRow, EdgeProvenance, Spec, gradeFor, P1–P5, CodegenReadinessReport).
- **VS** = `lean-code-validator/spec/SPEC.md` (vocabulary authority = `domainspec-core`
  + paper Tables 3 & 4; `MarkdownToSpec`/`SpecToLean`; `#eval gradeFor`).
- **XR** = `2026-06-08-lean-functor-validation/.../VALIDATOR-XRAY.md` (file:line
  evidence for σ-quiver, P1–P5, m6Witnesses, emitter, residue).
- **TD** = `2026-06-08-lean-functor-validation/.../TRANSLATOR-DESIGN.md` (translator
  `T`, provenance split, migration obligations, residue directions).
- **FV** = `2026-06-08-clarity-language-fit/.../LANGUAGE-FIT-VERDICT.md` (DEC-FIT-01
  PARTIAL-BRIDGE; bridge conditions 1–3).

---

## DIRECTION D1 — language → validator (what the validator needs FROM the language)

| Edge | What flows | Realizing interface / artifact | Status | Blocker if missing |
|---|---|---|---|---|
| **D1-1** | Contract concepts → the `Meta` object set (25 metas) | Vocabulary source is `domainspec-core` DEFINITIONS DS-D1/D2/D8 + paper Tables 3&4, lifted read-only into `Sigma.lean:13` `inductive Meta`. NOT the language's doc kinds. | **EXISTS** (but sourced from `domainspec-core`/paper, not DESIGN-PACKAGE language) | — (FV: vocabulary is "incidental" — `domainspec-core`+tables, not the language) |
| **D1-2** | Relationship/composability concepts → the `EdgeType` set (29 edges) + σ-table | `Sigma.lean:28` `inductive EdgeType`; `Sigma.lean:56` `sigmaValid` reifies Tables 3 (R_B) & 4 (R_X), R_CF under composition profile, R_U unsigned (VS §VocabularyEncoding; XR §1.1). Same provenance as D1-1. | **EXISTS** (sourced from paper, not language) | — |
| **D1-3** | Anti-collapse rule (contract must not declare types; every block-level schema rule traces to an `obligation_id` and vice versa) → validator invariant | DP §4 anti-collapse invariants. No validator predicate enforces contract/schema separation; nothing in `Report.lean` checks this. | **MISSING** | B-1 (obligations must be addressable first) |
| **D1-4** | `obligation_id`s per contract → per-meta obligation table `obligationsForMeta` feeding P3 | DP §4 (`obligation_id` blocker), §8.3 P2; intended table sketched `spec/queries.md:45` `obligationsForMeta` (7 metas); `Report.lean:71` `gradeP3Obligations` is a `.pass` STUB. The language side (`obligation_id` predicates) does not exist; the validator side is stubbed awaiting it. | **MISSING** (both ends) | **B-1** (DP §10; FV bridge cond. 1) |
| **D1-5** | Schema kind (`fields`/`row_families`, `validation_rules`) → the `Spec` Lean dialect / structural-closure input | DP §3 schema fields, §7 Layer A; validator side `Richness.lean:58` `Spec` + `unresolvedRefs` (P1 input, `Report.lean:56`). The language's `schema` doc kind and the validator `Spec` are **two different dialects** today (FV bridge cond. 3; DP OD-3). | **DESIGNED** (envelope frozen in DP §3, not unified with `Spec`; OD-3 open) | OD-3 (schema-dialect fork) |
| **D1-6** | `example` docs with `expect: pass\|fail` + negative fixtures → validator test/fault fixtures | DP §6 example model; validator side `examples/FaultInject.lean` (P1-fail, P5-fail, R_CF-ok) and `ZagrMarketplaceGen.lean`. Fault fixtures EXIST in Lean; the language's `expect`-bearing `example` doc kind that would *drive* them is DESIGNED only (DP §6, B-2: no negative fixtures authored yet in the language). | **DESIGNED** (Lean fault harness EXISTS; language example-doc binding DESIGNED) | B-2 (no `expect: fail` fixture authored) |
| **D1-7** | Profile selection (`paperBaseline` vs `compositionExtension`) → `Spec.profile` / σ-table gate | Validator: `Sigma.lean:45` `Profile`, `Profiles.lean` membership, emitter reads `profile:` frontmatter (VR Python emitter; default `paperBaseline`). Language has NO field that emits this — `Saga`/R_CF presence forces it (TD §2). DP envelope §3 has no `profile` field. | **MISSING** (language end) / EXISTS (validator end) | — (hidden edge; see §3) |
| **D1-8** | Source tags in code (`domainspec.concept.type`/`edges[].edge`) → translator `T` inputs → `Spec` | TD §1(a): `governance/tags/CODE-TAG-SCHEMA.md` tag contract → `Meta`/`EdgeType` identity rename. `T` itself is DESIGNED, not built (TD; XR §6 "must be built"). Tag schema EXISTS upstream; `T` and its language-doc binding do not. | **DESIGNED** (`T` design only) | — (`T` unbuilt; not a language blocker per se) |
| **D1-9** | `use_case` kind binding generic contract → concrete project/route → keeps σ-vocabulary generic | DP §2 `use_case` kind. No validator consumption point; vocabulary already generic via paper tables. | **DESIGNED** (language only; no validator edge) | — |

---

## DIRECTION D2 — validator → language (what the language needs FROM the validator)

| Edge | What flows | Realizing interface / artifact | Status | Blocker if missing |
|---|---|---|---|---|
| **D2-1** | `gradeFor` verdict (pass/warn/fail) → lifecycle transition guard | `Report.lean:136` `gradeFor` → `CodegenReadinessReport` (`Report.lean:31`), `aggregateOverall` worst-component (`Report.lean:42`). Language side: DP §8.2 — `pass/flag/block` is the transition guard on `gated→implemented→validated`. The verdict EXISTS; the language transition that *consumes* it is DESIGNED (DP §8). | **DESIGNED** (verdict EXISTS; lifecycle-consumption edge designed) | OD-5 (state vocabulary not ratified) |
| **D2-2** | P1 closure pass → schema-closure obligation discharged | `Report.lean:56` `gradeP1Closure` (REAL; XR §2). Language side: the schema-closure obligation it would discharge is DP §7 Layer A / §8.3 P1. Check EXISTS; the language obligation record is DESIGNED. | **DESIGNED** (P1 EXISTS; language obligation-record binding designed) | — |
| **D2-3** | P5 acyclic pass → "no-cycle" / codegen-order obligation discharged | `Report.lean:116` `gradeP5Acyclic` (REAL, `partial def dfsCycle`; XR §2, §7). Language obligation record DP §8.3 (necessary conditions). Check EXISTS; language binding DESIGNED. | **DESIGNED** (P5 EXISTS; binding designed) | — |
| **D2-4** | P2 σ-typing (free) → "well-typed" obligation discharged by construction | `Richness.lean:50` `EdgeRow.wellTyped` + `Richness.lean:71` Theorem 1 (XR §1.3). EXISTS as a compile-time proof. Language has no record kind that ingests "P2 free." | **DESIGNED** (proof EXISTS; language record binding designed) | — |
| **D2-5** | `CodegenReadinessReport` → `validation`/receipt record in an `iteration` doc | `Report.lean:31` report; VR. Language side: DP §3 optional `validation` field, §5 `validations_run` (receipt-shaped: producer/status/validation_result/residue). Report EXISTS; the language ingestion record (receipt schema mapping report→`validations_run`) is DESIGNED. | **DESIGNED** | — |
| **D2-6** | `EdgeProvenance` (`declared\|contextInferred\|sigmaFallback`) → residue record / P4 verdict | `Richness.lean:17` `EdgeProvenance` EXISTS as a type; emitter writes `.declared` for every edge (VR; XR §6 — no real provenance input). P4 grading wrapper STUB (`Report.lean:80`). Translator provenance split DESIGNED (TD §4). Language residue record (DP §5 `blockers_delta`/residue) DESIGNED. | **MISSING** (real provenance population) / DESIGNED (type + split design + language record) | B-1 / P4 build path (FV) |
| **D2-7** | P3 per-meta obligation findings → unmet-obligation residue in iteration | `Report.lean:71` `gradeP3Obligations` STUB (`.pass`); intended `obligationsForMeta` (`spec/queries.md:45`). Language record DP §5/§8. Neither end real; mutually blocked on B-1. | **MISSING** | **B-1** (FV bridge cond. 1) |
| **D2-8** | P4 M6 ambiguity findings → ambiguity residue graded by provenance | `Report.lean:80` `gradeP4Ambiguity` STUB; detector `Richness.lean:85` `m6Witnesses` REAL but ungraded (XR §2). Language residue record DESIGNED. | **MISSING** (grading wrapper) — detector EXISTS | B-1 / provenance (D2-6) |
| **D2-9** | Two named residue directions (unspecified-behavior code∉spec; unimplemented spec∉code) → language residue/blocker records | TD §5 residue directions (DESIGNED in translator). Language side: DP §5 `blockers_delta`, gap records (DP §2 sub-records). Both DESIGNED, neither wired (T unbuilt, P3/P4 stubbed). | **DESIGNED** | B-1, T-build |

---

## 3. HIDDEN edges most people miss

| Edge | What it is | Status | Why it is hidden |
|---|---|---|---|
| **H-1 Profile selection** (`paperBaseline` vs `compositionExtension`) | The validator gates the whole σ-table on a profile (`Sigma.lean:45`, `Profiles.lean`), read from emitter `profile:` frontmatter or forced by any `Saga`/R_CF (TD §2). The DESIGN-PACKAGE envelope §3 has **no `profile` field** and no doc kind owns it. | **MISSING** (D1-7) | The language is silent on profile; it surfaces only as emitter frontmatter and the `compositionExtension` D6 gate. A spec authored in the language cannot currently *declare* its profile. |
| **H-2 EdgeProvenance population** | `EdgeProvenance` is a real type but every emitted edge is `.declared` (VR; XR §6). P4's whole laundering-firewall (declared→FAIL vs sigmaFallback→WARN) is dead until provenance is *populated per edge* — a job for translator `T` (TD §4), which is unbuilt. | **MISSING** (D2-6) | The type EXISTS so it looks done; the *population* is the real missing edge. |
| **H-3 Promotion gate fork: P8 owner-approval vs Lean pass** | Language P1–P7 are *necessary*; **P8 owner-authority approval is the *sufficient* act** (DP §8.3, CI-R005: "stay local candidates unless promoted by owner"). A Lean `gradeFor` PASS satisfies (at most) P1/P2/P5 — it never satisfies P8. Reaching `validated` ≠ canonical. | **DESIGNED** (DP §8.3) — Lean cannot supply P8 | People conflate "validator passed" with "promoted." The validator can only ever discharge *some necessary* conditions, never the *sufficient* owner act. |
| **H-4 Two-schema-dialect fork (OD-3)** | One `schema` kind must absorb JSON-Schema (dispatch) **and** Craft `row_families`; `extends`/custom `reference` are not expressible in plain JSON-Schema (DP OD-3, R-2). Meanwhile the validator's `Spec` (`Richness.lean:58`) is a *third* Lean structural dialect. FV bridge cond. 3 requires "no dialect fork: language schema kind and validator `Spec` are one dialect." | **MISSING / unratified** (OD-3) | Three structural dialects are in play (JSON-Schema, `row_families`, Lean `Spec`) and convergence is an unmade decision, not a code gap. |

---

## 4. Summary counts and highest-leverage edge

**By direction + status:**

| Direction | EXISTS | DESIGNED | MISSING | Total |
|---|---|---|---|---|
| D1 (language → validator) | 2 (D1-1, D1-2; both sourced from `domainspec-core`/paper, not the language) | 4 (D1-5, D1-6, D1-8, D1-9) | 3 (D1-3, D1-4, D1-7) | 9 |
| D2 (validator → language) | 0 fully (verdict/checks exist but the *language-consumption* edge is designed) | 6 (D2-1..D2-5, D2-9) | 3 (D2-6, D2-7, D2-8) | 9 |
| Hidden | — | 1 (H-3) | 3 (H-1, H-2, H-4) | 4 |
| **Total** | **2** | **11** | **9** | **22** |

Note: the two D1 EXISTS edges exist because vocabulary comes from `domainspec-core`
+ paper Tables 3&4 — i.e. they are satisfied *without* the language. This is exactly
why FV grades the language **incidental today** on Stage-A structural surface.

**Highest-leverage missing edge: B-1 — addressable `obligation_id` predicates.**
B-1 is the single shared precondition for D1-3 (anti-collapse), D1-4 (`obligationsForMeta`→P3),
D2-6 (provenance→P4), D2-7 (P3 residue), D2-8 (P4 residue), and D2-9 (residue records).
Resolving B-1 unblocks **6 of the 9 missing edges** and is the precise act that flips
FV's verdict from "incidental" to "load-bearing" on the P3/P4 half of the grading
surface (FV bridge cond. 1; DP §10 B-1, §4, §7). It is a **language** task, not a
validator task (FV "Why this matters") — the validator side (P3/P4 stubs,
`obligationsForMeta` sketch) is already waiting.

---

## 5. Minimal edge set to close a FIRST mutual-dependency loop

A mutual-dependency loop must have at least one edge each way that *both ends realize*.
The cheapest closable loop avoids B-1 entirely (which is the hard, deferred one) and
uses the already-REAL Stage-A surface:

1. **D1-5 (partial) — freeze the language `schema` envelope (DP §3) as a v0.1 schema doc**
   that maps 1:1 onto `Spec.conceptSpace` + `unresolvedRefs`. Resolves enough of OD-3
   for the *closure* path only (defer `extends`/`reference`). DP §11 step 2.
2. **D1-6 — author one `example` doc with `expect: pass` and one with `expect: fail`**
   in the language, bound to that schema (closes B-2). DP §11 step 3; reuses
   `FaultInject.lean` shapes (P1-fail).
3. **Validator runs `gradeFor`** over the emitted `Spec` (EXISTS: P1 closure +
   P2 σ-typing + P5 acyclicity; `Report.lean:136`).
4. **D2-5 — ingest the `CodegenReadinessReport` back as a `validation`/receipt record**
   in an `iteration` doc (DP §5 `validations_run`, §3 `validation` field).
5. **D2-1 — use that receipt's verdict as the `gated→validated` transition guard**
   (DP §8.2).

That is the loop: **language emits schema+example (D1-5, D1-6) → validator grades
(EXISTS P1/P2/P5) → report flows back as receipt (D2-5) → drives lifecycle
transition (D2-1) → next iteration re-emits.** It closes using only the REAL Stage-A
checks plus DESIGNED language records — **no B-1 required**. The richer P3/P4 loop
(D1-4 ↔ D2-7, D2-8) is the *second* loop and is the one gated on B-1.

---

## Evidence boundary

All validator file:line claims trace to VR/VS/XR (in-tree Lean read fully per XR
§"Evidence boundary"). `audit_richness.py`/`SpecToLean` and `domainspec-core`
DEFINITIONS are referenced-but-absent-upstream (XR §4); their edges are mapped from
in-tree docs/emitted output, not source inspection. Translator `T` is design-only
(TD). Language doc kinds/envelope/obligations/lifecycle trace to DP. The
incidental-vs-load-bearing split and the three bridge conditions trace to FV
(DEC-FIT-01). No claim that the language helps the *running* validator today — it
does not (FV honesty note); the bridge is designed, not wired.
