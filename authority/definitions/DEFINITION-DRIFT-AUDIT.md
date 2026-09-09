# CyberAlchemy v2 Definition Drift Audit

Status: active
Owner: definitions-governance
Last updated: 2026-09-03

## Audit Scope

This first audit covered the starter artifacts created for CyberAlchemy v2:

- [../../README.md](../../README.md)
- [../../SOURCE-MAP.md](../../SOURCE-MAP.md)
- [../README.md](../README.md)
- [../AUTHORITY-MODEL.md](../AUTHORITY-MODEL.md)
- [../boundaries.md](../boundaries.md)
- [../promotion-policy.md](../promotion-policy.md)
- [../constitutions/STABLE-REPOSITORY-CONSTITUTION.md](../constitutions/STABLE-REPOSITORY-CONSTITUTION.md)
- [../../disciplines/DISCIPLINES.md](../../disciplines/DISCIPLINES.md)
- [../../disciplines/cards/stable-repository-stewardship.md](../../disciplines/cards/stable-repository-stewardship.md)
- [DEFINITION-TOWERS.md](DEFINITION-TOWERS.md)
- [DEFINITIONS-INDEX.md](DEFINITIONS-INDEX.md)
- [../../CRAFT.md](../../CRAFT.md)
- [../../.craft/ledger.yml](../../.craft/ledger.yml)
- [../../ontology/README.md](../../ontology/README.md)
- [../../development/research/2026-06-21-ontology-package-consolidation-model/findings.md](../../development/research/2026-06-21-ontology-package-consolidation-model/findings.md)
- [../../VALUE-AND-PHILOSOPHY-PROPOSITION.md](../../VALUE-AND-PHILOSOPHY-PROPOSITION.md)
- [../../../projects/ide-ergonomics/README.md](../../../projects/ide-ergonomics/README.md)
- [../../../projects/ide-ergonomics/PRODUCT-VIEW.md](../../../projects/ide-ergonomics/PRODUCT-VIEW.md)
- [../../../projects/ide-ergonomics/connective-task-manager/README.md](../../../projects/ide-ergonomics/connective-task-manager/README.md)

## Findings

| Finding | Status | Remediation |
| --- | --- | --- |
| Starter artifacts use `stable repository`, `source-ledgered amalgamation`, `authority layer`, `source spine`, `promotion gate`, and `stable repository stewardship` consistently with [DEFINITIONS.md](DEFINITIONS.md). | pass | None. |
| Existing upstream CyberAlchemy terms are referenced but not yet promoted into this project definition source. | flag | Later audit should review `AgenticSystem`, `ContextSolution`, and `TranslationResidue`; `OperationalOntology` is already demoted into D19/D23 language. |
| Arcanum-wide `contract` and `schema` semantics are not redefined locally. | pass | Continue linking to Arcanum definitions when needed. |
| Authority imports were missing from the first project skeleton. | fixed | Added `CAV2-D7`, `CAV2-D8`, and import manifests under [../imports/](../imports/README.md). |
| Canonical local definitions lacked explicit domain-context voices under the current definitions-governance contract. | fixed | Added domain-context voice sections for `CAV2-D1` through `CAV2-D8`. |
| Top-anchor tower terms were candidate-only in the Craft and tower surfaces. | fixed | Promoted `CAV2-D9` through `CAV2-D15` in [DEFINITIONS.md](DEFINITIONS.md) and synced [DEFINITIONS-INDEX.md](DEFINITIONS-INDEX.md). |
| [DEFINITION-TOWERS.md](DEFINITION-TOWERS.md) now references the promoted Q1 anchors rather than treating them as candidate-only. | pass | Continue using the tower map for clustering remaining imports. |
| Non-orthogonal dependencies were implicit in source material under orthogonality, typed edges, provenance, and coupling language. | fixed | Promoted `CAV2-D16` typed coupling invariant and synced [DEFINITIONS-INDEX.md](DEFINITIONS-INDEX.md). |
| Reflection tower appeared across Craft, framework-unification, and DomainSpec evidence as both structure and method, with risk of conflating it with ontology or capability towers. | fixed | Promoted `CAV2-D17` reflection tower method with an explicit residue-escalation boundary and synced [DEFINITIONS-INDEX.md](DEFINITIONS-INDEX.md). |
| Direct formalization evidence in `domainspec-formalization` and `domainspec-lean-formalization` sharpens `CAV2-D17` beyond the earlier Craft-only wording. | fixed | Updated [DEFINITIONS.md](DEFINITIONS.md) with the `Carrier(mu_n)` promotion hook and omega/fixed-point caution; synced [source-clusters/primordial.md](source-clusters/primordial.md). |
| Residue had multiple source meanings across DomainSpec formalization, Lean residue files, Craft, and reflection-tower material. | fixed | Promoted `CAV2-D18` as the local umbrella primitive while preserving subtype boundaries for `ResidueObject`, `ResidueStructure`, `ResidueCat`, `Carrier(mu_n)`, and imported `TranslationResidue`. |
| Entropy evidence appeared across Lean residue objects, finite Boltzmann FF-residue bridges, entropy profiles, retrieval-entropy classification evidence, and thermodynamics research notes, creating risk that bare entropy would be promoted as an overloaded primitive. | fixed | Promoted `CAV2-D27` residue entropy as a primitive observable under typed residue, and added constitution rule `CAV2-C12` requiring entropy-register and residue-source declarations before entropy claims can govern authority. |
| The TO-VLAD AX-ONT review showed that Shannon-style label independence and Lean Hilbert/projector orthogonality are different objects, while preserving a useful edge-layer tripwire. | fixed | Clarified `CAV2-D22` as classification/admission discipline, promoted `CAV2-D28` value-cycle edge guard, and added constitution rule `CAV2-C13` for value-constraining cyclic edge proposals. |
| Ontology was overloaded across inventory, ontology-vault, CyberAlchemy operational ontology, branch-aware business/system/bridge maps, framework-unification ontology-view, and Ontologize branch language. | fixed | Promoted `CAV2-D19` as the local governed meaning layer while demoting `Operational Ontology` to source-local shorthand for an operation-facing D19 projection governed by D23 lifecycle axes. |
| Craft method was defined operationally in Arcanum Craft and supported by `CRAFT-FORMAL-FOUNDATIONS.md`, but CyberAlchemy v2 only had a Craft execution surface definition. | fixed | Promoted `CAV2-D20` Craft method while keeping `CAV2-D12` as the surface and preserving the formal-foundations honesty boundary. |
| Four-facet action obligations were first framed too narrowly as promotion-readiness, while the operator intent was a basic CyberAlchemy action primitive. | fixed | Promoted `CAV2-D21` four-facet action method and preserved the correction that each governed action must bind, create, or residue classification/taxonomy, schema, human-continuation view, and machine-checkable view. |
| The imported house_project vault surfaced reusable value concepts, but they were still only Inventory read models and source-local vocabulary. | fixed | Promoted `CAV2-D22` through `CAV2-D26` for orthogonal classification, authority lifecycle axis, provenance-first navigation, schema amendment witness, and append-only event ledger; preserved source-local vocabulary in [source-clusters/house-project-vault.md](source-clusters/house-project-vault.md). |
| Ledger is emerging as a cross-method primitive candidate, but overlaps `authority import`, `Craft execution surface`, ontology, and signal ledgers. | flag | Added [reviews/ledger-primitive-review.md](reviews/ledger-primitive-review.md); `CAV2-D30` resolves the recursivity-name blocker, but canonical ledger promotion remains deferred until relation inheritance and local Craft ledger conformance are resolved. |
| Schema and relationship invariant evidence is spread across Arcanum definitions, DomainSpec edge catalogs, framework-unification invariants, and formalization sources. | flag | Added [../../../.arcanum/inventory/queries/2026-06-21-schema-relationship-invariants/search-sequence.md](../../../.arcanum/inventory/queries/2026-06-21-schema-relationship-invariants/search-sequence.md); keep `schema` as Arcanum authority and route `relationship invariant` through inventory evidence before promotion. |
| Repository objective was implicit in narrative discussion: CyberAlchemy v2 should become the downloadable CyberAlchemy base, while `ontology/` fixes authority shape as a candidate/projection package. | fixed | Updated [DEFINITIONS.md](DEFINITIONS.md) for `CAV2-D1`, `CAV2-D9`, and `CAV2-D19`; synced [DEFINITIONS-INDEX.md](DEFINITIONS-INDEX.md), [../../README.md](../../README.md), and [../../ontology/README.md](../../ontology/README.md). |
| Operational Ontology's relation to `CAV2-D19`, `CAV2-D22`, and `CAV2-D23` was unresolved after the authority lifecycle review. Identity collapse into D23 failed, but the term still lacked a D22-tested unique distinction. | fixed | Accepted the demotion decision: `Operational Ontology` is not a primitive, peer ontology branch, standalone subtype, separate candidate term, or D23 alias. Normalize it into D19 typed ontology obligations plus D23 lifecycle-axis obligations; name any remaining agent-operation obligation directly. |
| Broad orthogonality was ambiguous across primordial axis independence, D22 orthogonal classification, D16 non-orthogonal coupling, D23 lifecycle axis separation, and Lean/Hilbert projector orthogonality. | fixed | Promoted `CAV2-D29` axis orthogonality invariant as the broad governance invariant. `CAV2-D22` remains the classification specialization; Hilbert/projector orthogonality remains excluded from CAV2 authority unless separately typed. |
| `Recursivity` was witnessed but too vague to promote as an unbounded label. It overlapped ordinary recursion, generic self-hosting, `CAV2-D17` reflection tower method, and `CAV2-D20` Craft method. | fixed | Promoted `CAV2-D30` bounded recursive self-application. `recursivity` is now only an alias for the bounded meaning with artifact, altitude, owner, gate, residue/state, recomposition, and stopping conditions. |
| `Primitive type`, generic `method`, and `definition` were T-1 candidate terms but still lived as queue language rather than canonical CyberAlchemy v2 semantics. | fixed | Promoted `CAV2-D31` primitive type, `CAV2-D32` method, and `CAV2-D33` definition. The promotion keeps local CAV2 primitive roles separate from programming types, DomainSpec meta-types, Arcanum schema/contract terms, concrete methods, and non-authority glossary or inventory records. |
| `Authority`, `provenance`, `traceability`, `gate`, `claim <= proof`, and `intent` were still T-1 queue terms even though they govern how CyberAlchemy v2 makes work count, carries receipts, navigates links, moves through checkpoints, bounds claims, and preserves work purpose. | fixed | Promoted `CAV2-D34` authority, `CAV2-D35` provenance, `CAV2-D36` traceability, `CAV2-D37` gate, `CAV2-D38` claim <= proof, and `CAV2-D39` intent. `artifact` remains the only explicit T-1 review candidate. |
| Challenge/contradiction handling existed as House-vault challenge response, `contradicts`, `validates`, confidence axes, and v2 promotion residue, but the v2 node shape had no single field for how a node may be contested. | fixed | Promoted `CAV2-D40` challenge contract and added `challenge_contract` to the candidate ontology node/package shape while preserving `veracidade` and `convicção` as the existing confidence axes rather than adding a third confidence dimension. |
| `Authority model` was already load-bearing in the stable repository objective, source map, ontology package, and extraction gate, but it had no owner-facing authority document or canonical local definition. | fixed | Added [../AUTHORITY-MODEL.md](../AUTHORITY-MODEL.md), promoted `CAV2-D41` authority model in [DEFINITIONS.md](DEFINITIONS.md), and synced [DEFINITIONS-INDEX.md](DEFINITIONS-INDEX.md). |
| Architecture knowledge needed a lens-specific governance interface after the governed-artifact primitive review rejected a broad primitive but preserved the need for inspectable artifact trees, pattern candidates, and governed views. | fixed | Promoted `CAV2-D42` governed artifact tree, `CAV2-D43` pattern promotion lifecycle, and `CAV2-D44` view-bearing concept. These definitions make architecture-pattern-inventory the architecture-view producer while preserving the guardrail that trees, views, inventory rows, and pattern candidates are not authority without owner promotion. |
| UX/UI knowledge needed a lens-specific governance interface so interface lessons, browser evidence, accessibility checks, screenshot review, studio intents, and human-study residue can feed knowledge promotion without becoming a false UX authority. | fixed | Promoted `CAV2-D45` UX/UI knowledge governance, `CAV2-D46` experience evidence lifecycle, and `CAV2-D47` interface evidence boundary. These definitions make `ux-lessons`, `ux-evidence-validator`, and `ui-prototyping-studio` part of a governed experience-knowledge view while preserving the guardrail that browser evidence, UX patterns, screenshots, and subjective claims do not promote themselves. |
| CyberAlchemy value framing now uses `synergetic cybernetic human-machine integration` as a load-bearing proposition across CAV2 and IDE Ergonomics. | flag | Added [source-clusters/cyberalchemy.md](source-clusters/cyberalchemy.md) with candidate `CAV2-CAND-HMI-001`, wired it into T5, and resolved promotion-prep blockers in [the HMI decision record](../decisions/2026-06-23-hmi-candidate-promotion-prep.md). Do not promote until a canonical definition draft, index sync, drift audit, and Connective proof fixture or owner approval exist. |
| `constitution`, `invariant`, and `axiom` are all load-bearing in CAV2 imports, but their role boundary was implicit and later Constitution references incorrectly reused `CAV2-D34` (Authority). | fixed | `CAV2-D53` defines Axiom, `CAV2-D54` defines Invariant, and `CAV2-D58` now defines Constitution. `CAV2-D34` remains Authority. Axiom grounds; Invariant states the must-hold condition; Constitution carries owner-adopted scoped rules and policies; validators or gates perform or check enforcement. |

## CAV2-D65 Prototype-First Revision Audit — 2026-09-03

| Finding | Status | Remediation |
| --- | --- | --- |
| The prior D65 wording required validated or admitted semantic and system-ontology predecessors before implementation could begin. That made authority-like owner gates prerequisites to learning whether the product was testable. | fixed in canonical definition | Revision 2 begins with prototype definitions, treats ontology as agent-facing scaffolding, permits bounded iteration across product, business, DomainSpec, compiled-system, and implementation prototypes, and freezes exact bytes only at the testable-product boundary. |
| The old chain allowed requests for profile admission, system-ontology admission, implementation acceptance, and plan acceptance before a tested product existed. | fixed in canonical definition and routing guidance | Product approval is now the first product decision and is eligible only after the exact candidate passes its required tests. Every authority, admission, activation, cutover, publication, release, and deployment request is prohibited until after product approval. Product approval grants none of those effects. |
| Governance and Goals machine `ConstructionBinding` schemas, concrete bindings, evaluators, generated graphs, and prior plan/decision packages encoded the superseded stage-admission sequence. | partially fixed | Governance now has a parallel revision-2 prototype schema, non-authoritative ontology scaffold, deterministic freezer/evaluator, frozen candidate, exact PASS evidence, and request-eligibility checks. Keep the legacy Governance and Goals bindings plus historical receipts immutable and diagnostic until their own migrations; do not infer product approval from the new PASS. |
| The unadmitted CyberAlchemy-lab `CAL-PLAN-0004` candidate contains a pre-product owner-decision request. | blocked successor | Preserve revision 1 as unadmitted evidence. Its owner request is ineligible under D65 revision 2; author a superseding prototype-first revision that runs construction and product tests before preparing any approval or authority request. |

## Knowledge Exchange Protocol Ordering Audit — 2026-08-31

| Finding | Status | Remediation |
| --- | --- | --- |
| Knowledge Exchange Protocol business vocabulary was initially placed in shared CyberAlchemy-v2 definition authority even though it had only one product consumer. | fixed | Relocated the terms to the product-local [Knowledge Exchange Protocol definitions](../../product/knowledge-exchange-protocol/authority/definitions/DEFINITIONS.md) as `KEP-D1` through `KEP-D12`. Reserved `CAV2-D70` through `CAV2-D81` as withdrawn IDs that must not be reused. |
| The candidate business ontology does not yet bind its concepts and rules to the exact product-local definition IDs and digest. | flag | Route through `CA2-ROUTE-GOVERNANCE`; admit a digest-bound ontology candidate only after exact mapping and dependency-closure validation. |
| DomainSpec-generated and Rust implementation artifacts already exist downstream of the unbound candidate ontology. | blocked successor claim | Treat them as premature candidate evidence. Do not claim DomainSpec admission, implementation conformance, Solana realization, publication, or deployment until the ontology is admitted and the successors are rebuilt or proven exact against that admitted predecessor. |

## Undefined Critical Terms

| Term | Source pressure | Route |
| --- | --- | --- |
| Agentic System | Prior CyberAlchemy definition material. | definitions-governance after project shape review. |
| Context Solution | Prior CyberAlchemy retrieval concept. | definitions-governance after storage route is selected. |
| Translation Residue | CyberAlchemy and framework-unification material. | definitions-governance plus residuality-spec review; classify as subtype, alias, or separate term relative to `CAV2-D18`. |
| Ledger | Craft recursive ledger, authority import ledgers, framework-unification signal ledgers, and v2 tower execution material. | Defer promotion; `CAV2-D30` resolves the recursivity-name blocker, but ledger still requires inheritance-relation and local Craft ledger conformance review. |
| Relationship Invariant | DomainSpec typed relationship system, `CAV2-D16`, framework-unification graph invariants, and sigma-valid edge formalization. | Use the inventory [schema/relationship search sequence](../../../.arcanum/inventory/queries/2026-06-21-schema-relationship-invariants/search-sequence.md); classify as subtype of `CAV2-D16`, alias, or separate primitive after evidence-cards exist. |
| Synergetic Cybernetic Human-Machine Integration | CyberAlchemy value proposition and IDE Ergonomics now use this as the umbrella product/philosophy claim for agents, software, knowledge, interfaces, Craft state, tests, and handoffs becoming one governed loop. | Candidate `CAV2-CAND-HMI-001` in [source-clusters/cyberalchemy.md](source-clusters/cyberalchemy.md); promotion-prep decisions are resolved in [the HMI decision record](../decisions/2026-06-23-hmi-candidate-promotion-prep.md), but canonical promotion still needs definition drafting and proof or owner approval. |
| Build-From-Owned | Load-bearing across `CAV2-C17` (candidate constitution), `CAV2-D48`'s definition text, and the research-skill precedent gate; functions as a recurring discipline but has **no canonical term**. (Queued 2026-06-26.) | **definitions-governance: define the term** — clean sweep on the *definition* kind → net-new-OK, NOT "re-defining" (C17's non-example conflates defining the term with re-promoting the rule — kinds are orthogonal, `D49`). Then **promote `CAV2-C17` candidate→canonical** (constitution-governance) + correct C17's two lines (the "habit not a gate" framing and the define-vs-re-promote non-example). Optional later hardening: a discipline card + the SMT build-from-owned validator (OQ-1-gated). See [[non-collapse-and-build-from-owned-definitions-map-synthesis]]. |
| Non-Collapse | Umbrella over `CAV2-D22` + `CAV2-D29` + the 7 AUTHORITY-MODEL Non-Collapse Rules + the `forbidden_collapse` field; load-bearing everywhere but **no standalone term**. (Queued 2026-06-26.) | definitions-governance: either **define** it canonically or formally **declare it an umbrella** pointing to `D22`/`D29` (so the word stops standing in for an undefined concept). |

## Imported Definition Candidate Count

| Ledger | Candidates | Auxiliary sources | Status |
| --- | --- | --- | --- |
| [../imports/definitions/MANIFEST.md](../imports/definitions/MANIFEST.md) | 149 | 28 | candidate import only |

## Open Questions

### OQ-1. Should prior CyberAlchemy glossary terms be imported or referenced?

Context: the import ledger now stages the broad corpus. Recommendation: classify
and deduplicate the imported terms before promoting any large batch into this
canonical file. The Q1 top-anchor terms are already promoted. Status: OPEN.

## Ancestral Lineage Reconciliation — CyberAlchemy Method + Discipline Growth Rule (2026-06-23)

Trigger: definitions-governance pass following research dispatch
`2026-06-23-cav2-repo-primitives-authority-sweep`. Owner decision: **drift-reconcile
+ provenance only; no promotion** (consolidate, not import).

### Lineage mapping (ancestral source → cav2 re-authored descendant)

| Ancestral source (posture for cav2) | cav2 descendant | relation |
| --- | --- | --- |
| **CyberAlchemy Method** — [`arcanum/framework/CYBERALCHEMY-METHOD.md`](../../../arcanum/framework/CYBERALCHEMY-METHOD.md) (5 anchors: Objective / Output / Discovery / Tension / **Route**) | `CAV2-D32` method (generic); owner-route principle in `CAV2-D41` authority model + `CAV2-D34` authority | descendant — generic method + owner-route principle re-authored; **no** named "CyberAlchemy Method" term, *by design* (D32 kept generic, separate from concrete methods) |
| **Discipline Growth Rule** — [`arcanum/disciplines/DISCIPLINES.md`](../../../arcanum/disciplines/DISCIPLINES.md) (maturity ladder candidate → active-pattern → canonical; promote only with steward/owner + evidence + maturity + next-hardening move) | `CAV2-D43` pattern promotion lifecycle (**shape only**); discipline promotion lives in the `disciplines/` surface | **partial** — D43 shares the promotion *shape* but its **object is architecture patterns, not disciplines** |

### Finding (drift)

- **`CAV2-D43` ≠ discipline growth rule.** D43 is the *pattern* promotion lifecycle
  (architecture / code / spec hypothesis → reusable *pattern* authority). It shares the
  earn-authority-by-evidence / generalization / challenge / owner-promotion shape but
  governs patterns, not recurring disciplines. The Arcanum Discipline Growth Rule has
  **no canonical cav2 definition** — discipline promotion is *referenced* via the
  `disciplines/` surface (e.g. the `stable-repository-stewardship` card, status candidate)
  but the growth rule itself is an **un-promoted gap**. Status: **flag**.

### Posture (claim ≤ proof)

Both ancestral sources hold **Evidence / Original-authority** posture for cav2
(AUTHORITY-MODEL Authority Postures); **neither is deployed** as cav2 authority. cav2
already embodies their principles in `D32` / `D34` / `D41` / `D43`, so the action is
**consolidation, not import**. Authority must not flow by lineage or proximity
(AUTHORITY-MODEL non-collapse rules + narrowest-owner rule).

### Remediation

| Item | Target | Recommended action | Status |
| --- | --- | --- | --- |
| Inline provenance cross-refs absent from the descendant definitions | [DEFINITIONS.md](DEFINITIONS.md) `CAV2-D32`, `CAV2-D34`, `CAV2-D41`, `CAV2-D43` | Owner-greenlit 2026-06-23: added one non-normative "Ancestral provenance" header line per definition citing the Arcanum source. Formal voice unchanged; no IDs changed; index unchanged. | done |
| Discipline growth rule gap | `disciplines/` + definitions-governance | Route to **discipline-governance**: decide whether the discipline growth rule needs a canonical cav2 definition or stays a referenced Arcanum rule — mirrors `DISCIPLINES.md` ("Decide which discipline terms need canonical definitions versus local explanations"). | open |
| Named "CyberAlchemy Method" term | [DEFINITIONS.md](DEFINITIONS.md) | **No action** — generic `CAV2-D32` + this lineage record suffice; promote a named term only if it becomes load-bearing beyond `D32`. | resolved (no-promotion) |

No new terms promoted; `DEFINITIONS-INDEX.md` unchanged.

## Authority-Lifecycle Candidate Staged (2026-06-23)

Following from the lineage reconciliation: the Discipline Growth Rule, pattern
lifecycle (`CAV2-D43`), and experience lifecycle (`CAV2-D46`) share one shape.
Staged a paired candidate in
[source-clusters/authority-lifecycle.md](source-clusters/authority-lifecycle.md):

- `CAV2-CAND-LIFECYCLE-001` `authority promotion lifecycle` (aka `scientific
  authority lifecycle`) — the general lifecycle **object** the existing
  [promotion-policy.md](../promotion-policy.md) ladder already instantiates
  (build-from-owned; `D43` / `D46` / Growth Rule are its instances).
- `CAV2-CAND-LIFECYCLE-002` `no authority without a lifecycle` — the binding
  **invariant** (references `-001`), carrying its inline collapse-test.

Source evidence: inventory synthesis
[scientific-authority-lifecycle-synthesis.md](../../../.arcanum/inventory/entries/scientific-authority-lifecycle-synthesis.md).
Source evidence: inventory synthesis. Scope correction recorded earlier:
**authority-bearing kinds only, not "everything."**

**Status: PROMOTED 2026-06-23.** `-001` → **`CAV2-D48` authority promotion lifecycle**
(build-from-owned generalization inference); `-002` (re-scoped per review CR-1 from
"no authority without a lifecycle" to **`closed authority-kind enumeration`**) →
**`CAV2-D49`**. `DEFINITIONS.md` + `DEFINITIONS-INDEX.md` synced (D48/D49 + aliases).
**OQ-2 advanced** per the AUTHORITY-MODEL recommendation ("promote the definitions
before adding to the kind table"): definitions promoted; the `invariant`/`axiom`
**kind-table amendment stays a future decision-gate call**. **Still blocked:** the
`CAV2-C16` *enactment* of closure (validator adapter `none-yet`) — the definition
`D49` names the invariant; it does not enact the kind table as closed.

**Update (2026-06-23, decision-gate):** closure now **enacted in review mode** — a
default-deny catch-all row was added to the AUTHORITY-MODEL Authority Kinds table
([decision record](../decisions/2026-06-23-authority-kind-closure-catchall-row.md)).
The stand-alone `CAV2-C16` rule is **superseded** by that row; only the
**deterministic validator** (automated kind-enumeration scan) remains pending
(OQ-1). `invariant`/`axiom` as their own kinds (OQ-2) still deferred — they govern
as the `Definition` kind, not blocked by the catch-all.

## Discipline promoted (CAV2-D50) + Ledger HELD (2026-06-23)

**`CAV2-D50` discipline — PROMOTED.** Build-from-owned from the AUTHORITY-MODEL
Authority Kinds row + `concept.discipline` + the Arcanum discipline model.
Prerequisite for the governance stack (the `tracking` discipline, the
non-collapsing-discipline validator, the validating constitution). Index synced
(main row + 3 aliases). `non-collapse` stays **covered** by `CAV2-D22`/`D29` +
`forbidden_collapse` + AUTHORITY-MODEL non-collapse rules — no separate term promoted.

**`ledger` — HELD, NOT promoted** (requested, but blocked by its own review). The owned
[`reviews/ledger-primitive-review.md`](reviews/ledger-primitive-review.md) verdict is
**defer**, and only 1 of its 5 conditions is met:

| Condition | Status |
| --- | --- |
| recursivity promoted/renamed | MET (`CAV2-D30`) |
| Craft-ledger conformance gaps fixed/waived | UNMET |
| parent/child containment separated from authority inheritance | UNMET |
| v2 relation profile (inheritance/override/promotion/coupling/recomposition/residue) | UNMET (RELATION-MODEL still candidate) |
| fixture proving parent+child ledger, inherited constraint, override, promotion, residue, recomposition, index | UNMET (does not exist) |

Promoting now would reverse a recorded `defer` verdict with 4/5 conditions unmet
(demote/promote protocol). The unmet conditions ride the still-candidate
authority-object schema / relation work (OQ-1-gated). **Route:** clear the relation
profile + conformance fixture (or an explicit decision-gate override) before promotion.

## Canonical Artifact + Durability promoted (CAV2-D51, CAV2-D52) — 2026-07-07

Trigger: definitions-governance design session on "canonical artifacts." Owner
greenlit the promotion.

- **`CAV2-D51` canonical artifact — PROMOTED.** The *instance predicate* over a
  new Tier-1 **canonical-kind enumeration** ([../../ontology/canonical-kinds/CANONICAL-KINDS.md](../../ontology/canonical-kinds/CANONICAL-KINDS.md)):
  an artifact that is typed and born from a governed process, **decoupled from
  authority** (a discovery is canonical yet non-authoritative). Non-canonical =
  unenumerated kind = free working material. Schema `CAV2-D51-SCHEMA` tracked in
  [DEFINITION-SCHEMAS.md](DEFINITION-SCHEMAS.md).
- **`CAV2-D52` artifact durability — PROMOTED.** The `ephemeral | perennial`
  lifespan axis, orthogonal to authority-kind (`CAV2-D49`) and maturity (`CAV2-D23`),
  carrying the contradiction-tolerance coupling: ephemeral may hold live
  contradictions, perennial may not (temporal supersession in a ledger/decision
  record is not a live contradiction).
- Index synced (2 rows + 9 aliases). New Tier-1 registry
  [../../ontology/canonical-kinds/CANONICAL-KINDS.md](../../ontology/canonical-kinds/CANONICAL-KINDS.md) created as
  **candidate**, rolling canonical-kinds up to the [AUTHORITY-MODEL Authority Kinds](../AUTHORITY-MODEL.md#authority-kinds).

### Drift finding — "canonical artifact" prose predates this term. Status: flag.

The phrase "canonical artifact" appears in dated 2026-06-21 review/refinement prose
([../../development/reviews/2026-06-21-authority-elevation-protocol-review/attacks.md](../../development/reviews/2026-06-21-authority-elevation-protocol-review/attacks.md),
[../../development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/](../../development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/))
meaning **"target-owned / deployed authority"** — the *authoritative-version* sense,
the opposite of the promoted decoupled-from-authority sense. **Remediation:** none to
the source docs — they are **ephemeral** artifacts (`CAV2-D52`) under the very
taxonomy promoted here, and may hold the older wording. The perennial `CAV2-D51`
definition now owns the term; its Boundary section records the divergence. Do not
rewrite the historical prose.

### Field rename — `fine_type`→`canonical_kind`, `coarse_group`→`authority_kind`. 2026-07-08. Status: pass.

The CAV2-D51 canonical-artifact record fields were renamed for explicitness (owner call):
`fine_type` → `canonical_kind` (the field now names its Tier-1 enumeration,
[../../ontology/canonical-kinds/CANONICAL-KINDS.md](../../ontology/canonical-kinds/CANONICAL-KINDS.md)) and `coarse_group` →
`authority_kind` (names its Tier-2 enumeration, the [AUTHORITY-MODEL Authority Kinds](../AUTHORITY-MODEL.md#authority-kinds)
table). **Names only** — no change to the term's meaning, the record shape, or the rollup
invariant (now `authority_kind = rollup(canonical_kind)`). Synced across
[DEFINITIONS.md](DEFINITIONS.md#cav2-d51-canonical-artifact) (CAV2-D51/D52),
[DEFINITION-SCHEMAS.md](DEFINITION-SCHEMAS.md) (`CAV2-D51-SCHEMA`), and CANONICAL-KINDS.md.
No promotion gate (field-name change, not a term-semantics change). The CAV2-D51 prose that
read "each canonical-kind declares …" was reworded to "each canonical artifact declares …"
to avoid self-reference under the new field name.

### `authority_state` enum extended — added `demoted`. 2026-07-08. Status: pass.

The CAV2-D51 `authority_state` enum was extended from `none | candidate | promoted` to
`none | candidate | promoted | demoted`, build-from-owned on `CAV2-D48` (Authority Promotion
Lifecycle), which explicitly names a stopping/**demotion** rule the enum previously omitted.
`demoted` = authority that was promoted then withdrawn or superseded; its semantics live in
`CAV2-D48`, the CA record only carries the position. Vocabulary correspondence with the
definitions surface (recorded so the two do not drift): `promoted` ≈ `active`, `demoted` ≈
`deprecated` — same lifecycle stages, different local wording. This is a schema amendment
(`CAV2-D25`), not a term-semantics change — no promotion gate. `CANONICAL-KINDS.md` Rule 3 was
also clarified: an authority-reachable kind's instance is authoritative only at
`authority_state: promoted` (a `candidate` definition is still a definition, just not yet
authority).

### Non-drift note — this does NOT reverse the held `ledger` promotion. Status: pass.

`CANONICAL-KINDS.md` lists `ledger` as a candidate **fine artifact-type** (an
instance-typing entry that references the already-promoted `CAV2-D26` append-only
event ledger for behavior). This is **not** the deferred promotion of `ledger` as a
canonical **primitive term/definition**, which remains HELD (see the 2026-06-23
section above; 4/5 conditions unmet). The two are different objects: a candidate
row in an artifact-type enumeration vs. a canonical primitive definition.

## Axiom + Invariant promoted (CAV2-D53, CAV2-D54) — 2026-07-08

Trigger: definitions-governance design session working the `axiom → invariant →
constitution → validator` ladder, stress-tested against the ZefraHub and
maestro-trama axiom corpora. Owner greenlit the promotion.

- **`CAV2-D53` axiom — PROMOTED.** A foundational proposition taken as given
  (bedrock, high-veracity, non-derived within the system) with **fan-out** to a
  family of premises/invariants/rules. Subject = the **world/domain** the system is
  built around; the system **cannot violate** it. Carries its own `### Open
  Questions` (species, authority-kind, axiom-vs-premise threshold + defeasibility).
- **`CAV2-D54` invariant — PROMOTED** as the **generic parent** of the existing
  invariant instances (`CAV2-D16`/`D29`/`D38`/`D49`). Subject = the **system**; a
  violation is drift/defect; operationalized by a constitution (`CAV2-D58`),
  enforced by a validator/gate (`CAV2-D37`). Carries its own `### Open Questions`
  (parent-vs-instances, authority-kind, trace-obligation-as-constitution-rule).
- **The discriminator** between them is the **subject-test**: world-truth (axiom)
  vs. system must-hold (invariant). This sharpens the provisional wording in
  [reviews/constitution-invariant-axiom-role-review.md](reviews/constitution-invariant-axiom-role-review.md)
  with the corpus evidence.
- Index synced (D53/D54 rows + aliases). **`CAV2-D55` premise — PROMOTED same
  session:** the `veracidade: low / convicção: high` bet layer, completing the
  axiom/invariant/premise trio. The premise is where veracity and conviction
  diverge (`CAV2-D23`); promotion premise → axiom is evidence-gated (`CAV2-D48`),
  never by conviction alone. `AX-ONT-7`/`AX-SYS-3` are the corpus examples of
  premises mislabeled as axioms. Index synced (premise row + 5 aliases).

### Still open (not resolved by this promotion). Status: flag.

- **CANONICAL-KINDS `axiom` row is stale.** [../../ontology/canonical-kinds/CANONICAL-KINDS.md](../../ontology/canonical-kinds/CANONICAL-KINDS.md)
  line 48 still rolls `axiom → Definition / authority-reachable: yes`. Now that
  `CAV2-D53` exists and we hold that an axiom is *not* a definition, that row should
  reference `CAV2-D53` and mark its rollup `unresolved (OQ-2) / deferred`. Left for
  the owner per AX-OQ-2 / CANONICAL-KINDS OQ-2. **Route:** decision-gate on
  AUTHORITY-MODEL OQ-2 (first-class `invariant`/`axiom` kinds).
- **`invariant`/`axiom` remain the `Definition` authority-kind** (AUTHORITY-MODEL
  OQ-2). Promoting the *definitions* does not add them to the kind table.

## Process promoted (CAV2-D56) + CAV2-D51 prose repair — 2026-07-09

Trigger: definitions-governance session opened on the observation that `process` is
called by `CAV2-D51`'s formal clause (`origin(a) = process(kind(a))`) and fills the
`Process` column of [../../ontology/canonical-kinds/CANONICAL-KINDS.md](../../ontology/canonical-kinds/CANONICAL-KINDS.md),
but was never defined anywhere in the spine. The canonical predicate was therefore
undecidable: neither side of `origin(a) = process(kind(a))` had a referent. Owner
greenlit build-from-owned and the record-only posture on the arity mismatch.

- **`CAV2-D56` process — PROMOTED**, build-from-owned on `CAV2-D32` method. A process
  *is* a method, specialized by two obligations D32 does not impose: **(P1)** it
  declares a nonempty `output_kinds` subset of `CANONICAL-KINDS`, and **(P2)** each
  execution is individually identifiable, yielding the `run_id` an artifact cites as
  `process_origin`. The induced inverse `processes(k) = { P : k in output_kinds(P) }`
  is what `CAV2-D51` actually needs. `CAV2-D20` Craft method and `CAV2-D17` reflection
  tower method are methods but **not** processes — they declare no output kind, so they
  cannot be inverted from a kind. Schema `CAV2-D56-SCHEMA` registered.
- **`CAV2-D51` prose repaired.** The card read "Each canonical artifact declares … an
  `authority_kind`", contradicting its own schema invariant `authority_kind =
  rollup(canonical_kind)` two paragraphs below. Now: an artifact **declares**
  `canonical_kind` + `process_origin` and **inherits** `authority_kind` + `durability`.
  The `process_origin` schema row now names `CAV2-D56` and types its value as a `run_id`.
- Index synced (D56 row + 5 aliases). Schema registry synced.

### Still open (not resolved by this promotion). Status: flag.

- **`CAV2-D51` arity mismatch — RECORDED, NOT FIXED.** `CAV2-D51`'s formal clause states
  `origin(a) = process(kind(a))`, a **function**: one process per kind. `CANONICAL-KINDS.md`
  contradicts it in two rows — `spec` names "spec owner + decision-gate" (a composite) and
  `research` names "research dispatch / research-tower" (an alternation). `CAV2-D56` defines
  the relation as **set-valued** (`origin(a) in processes(kind(a))`), which the enumeration
  supports. The two active cards therefore disagree. Owner elected to record rather than
  patch the active clause. Tracked as `CA-OQ-1` on D51 and `PC-OQ-1` on D56.
  **Route:** definitions-governance owner call.
- **`CANONICAL-KINDS` `ledger` row is a category error.** Its `Process` is "append-only
  ledger (`CAV2-D26`)" — a data structure, not a producing procedure. Under `CAV2-D56`
  (P1)+(P2) the producer should be a procedure (e.g. *ledger append*). **Route:** ontology
  route to propose the row edit.
- **Two `Process` values name no realizer.** `axiom authoring` and `scope/discovery run`
  are activities; every other row names an installed capability. Under (P2) these rows
  yield no citable `process_origin`, so their instances cannot satisfy `canonical(a)`.
  Tracked as `PC-OQ-2`. **Route:** owner assignment, or admit an `unrealized` posture.
- **`process` is not itself an enumerated canonical kind** (`PC-OQ-3`) — whether the
  enumeration should be closed under its own producers is undecided (`CAV2-D30` territory).

### Audit self-correction — 2026-07-09

The 2026-07-08 section above states, under "Still open", that `CANONICAL-KINDS.md` line 48
"still rolls `axiom → Definition` / authority-reachable: yes". **That remediation has since
landed**: the row now reads `unresolved — OQ-2` with `authority_reachable: deferred (OQ-2)`
and cites `CAV2-D53`. The audit entry, not the ontology file, was stale. The underlying
AUTHORITY-MODEL OQ-2 decision-gate call remains genuinely OPEN.

## RETRACTION — `CAV2-D56` process, promoted and withdrawn same day (2026-07-09)

The `CAV2-D56` promotion recorded in the section above is **retracted**. The card,
its `DEFINITIONS-INDEX.md` row and five aliases, and its `CAV2-D56-SCHEMA` registry
row have been removed. Nothing had been committed. The prior section is left
unrewritten (append-only record; the promotion happened and its reasoning is part of
the trail).

**Why it was wrong.** `CAV2-D56` was derived backwards from a single consumer.
`CAV2-D51`'s formal clause calls `process(kind(a))`, so `process` was defined as "a
method that declares its output kinds" — a definition of *what D51 needed*, not of
what a process is. Counter-example that settles it: `make bump-check` is a process
and emits no canonical kind. Output-typing is an accidental property of some
processes, never the essence of any. This repeats the error the two-agent review
caught on 2026-07-08 when it rejected the fat `semantic authority` card for
re-encoding `CAV2-D3` — a genus term must not be shaped by one consumer's needs.

**What the excursion did establish, kept as open questions on `CAV2-D51`:**

- **`CA-OQ-1`** (arity) — the `origin(a) = process(kind(a))` clause presumes one
  producer per kind; `CANONICAL-KINDS.md` gives `spec` a composite and `research` an
  alternation. Unchanged by the retraction.
- **`CA-OQ-2`** (attested vs declared) — **the fork that replaced `process`.**
  `process_origin` has no defined referent. Naming an installed skill handle as the
  producer removes any need for a `process` genus (a skill is already a named,
  enumerable thing), but splits into: *attested* (cite the Arcanum
  `observed-invocation-loop` telemetry signal; mechanically checkable) vs *declared*
  (a self-asserted string, which `CAV2-D34` holds is no evidence basis and `CAV2-D38`
  bars from carrying a "process-born" claim). Route: decision-gate.

### Findings that survive the retraction. Status: flag.

Established by a 12-row cursor/terminates/observable test over the `CANONICAL-KINDS`
`Process` column. The test was authored and scored by one party and is **not**
adversarially verified — `CAV2-D38`: these are flags, not settled law.

- **`ledger` and `session record` name artifacts, not producers.** The `Process` cell
  should name what *makes* the artifact (`ledger append`; `close-session`), not the
  artifact itself.
- **`axiom authoring` is not a producer.** It has no cursor and no termination
  condition — it is a way of working. The producer that actually emits axioms is
  `definitions-governance`.
- **`scope/discovery run` has a realizer** (`scope-interview`) and should name it.
  *(This corrects the claim in the retracted section above that it named no realizer.)*
- **`CAV2-D32` was NOT edited.** A proposal to delete "or phases" from its prose —
  on the ground that its record `M` carries no ordering field — was raised and not
  executed. The `actions or phases` hedge remains. It is only worth revisiting if
  `CA-OQ-2` resolves toward a reading that needs a producer genus at all.
- **No artifact in this repository declares a producing skill**, and
  `.arcanum/observability/by-sigil/` holds one populated file. Under an *attested*
  reading of `CA-OQ-2`, the authority spine itself is currently non-canonical.

## Domain-Originated CAV2 Generalization Clarified (2026-08-22)

Trigger: the proof-obligation substrate guide exposed a one-way reading of CAV2:
CAV2 supplies a base and domains extend it, but the upward route by which domains
improve the base was distributed across `CAV2-D8`, `D13`, `D43`, and `D48`.

**Finding: fixed.** The canonical definitions now make the two-way learning loop
explicit without adding a competing lifecycle or authority kind:

- `CAV2-D8` preserves the originating domain's exact ownership and authority
  posture when reusable definitions, rules, methods, specifications, knowledge,
  validators, patterns, and supporting evidence enter CAV2 review.
- `CAV2-D13` requires a generalization proposal to retain the source version,
  proposed abstraction, changed or lost meaning, cross-context evidence and
  counterevidence, challenge contract, and promotion owner.
- `CAV2-D43` now shows the challenge and residue review already required by its
  prose and formal tuple.
- `CAV2-D48` remains the single parent lifecycle. Its domain-originated branch
  requires local evidence, exercise in another independently owned or materially
  distinct context, challenge review, a CAV2 owner decision, a promoted CAV2
  version, and separate version-exact adoption by each consuming domain.
- [promotion-policy.md](../promotion-policy.md) and
  [ARCHITECTURE-KNOWLEDGE-GOVERNANCE.md](../../architecture/ARCHITECTURE-KNOWLEDGE-GOVERNANCE.md)
  now expose the same route, and the proof-substrate human guide explains it
  without becoming definition authority.

Stale current-definition and index references to a proposed `CAV2-C16` were also
repaired. The current authority-kind closure is the review-mode `CAV2-D49` plus
the AUTHORITY-MODEL catch-all row; deterministic scanning remains pending. The
older dated audit history remains unchanged as an append-only record of the
superseded proposal.

**Authority and claim ceiling:** no domain authority moved to CAV2, no second
domain decided CAV2 promotion, no CAV2 decision adopted a version for a domain,
and no Lean, Cedar, Datalog, test, receipt, or Inventory result self-promoted.
This change defines and explains the route. It does not deploy the process, run
a cross-domain generalization example, promote a candidate, implement a
validator, or establish generality.

## Proof-Substrate Gates 6–8 Materialized (2026-08-22)

Trigger: the accepted proof-substrate owner decisions resolved process-origin
assurance, cross-owner generalization/adoption, and private-to-public release,
but correctly left their canonical vocabulary materialization to
definitions-governance.

### Gate 6 — process-origin assurance. Finding: fixed at the definition layer.

- `CAV2-D51` now separates an exact `process_origin` declaration from its
  assurance level: `declared`, `integrity-bound`, or future `actor-attested`.
- `CA-OQ-1` is resolved as a set-valued allowed-producer relation with one exact
  origin bound by each artifact. This supports multiple possible producers
  without promoting the candidate canonical-kind table.
- `CA-OQ-2` is resolved by tiered assurance. Current review-mode owner admission
  may use `declared`; L1 verifies bound-byte integrity; L2 remains unshipped and
  requires a real external-signature and identity-policy receipt.
- `CAV2-D35` needed no wording change: its active boundary already states that
  provenance is not proof, authority, trust, or validation.
- `CAV2-D51-SCHEMA` and the lookup index are synchronized.

Deterministic enforcement remains deferred. Positive, tampered, wrong-level,
missing-reference, and unsupported-L2 fixtures plus a separate activation
decision are still required before any validator may claim conformance.

### Gate 7 — provenance and optional adoption. Finding: already represented.

`CAV2-D8`, `D13`, and `D48` already preserve the originating owner's exact
source, a separately owned CAV2 generalization, cross-context exercise, CAV2
promotion, and optional version-exact adoption by each domain. `CAV2-D48` now
states explicitly that upstream provenance and later adoption are separate
events and create no permanent semantic adapter, synchronized crosswalk,
mapping owner, or live coupling. No new definition or adapter was added.

### Gate 8 — exact publication authorization. Finding: fixed at the definition layer.

Promoted `CAV2-D57` exact publication authorization and registered
`CAV2-D57-SCHEMA`. The term defines private-by-default, two-step release:
source owners first authorize exact ingredients and limits; the named publishing
principal later approves exact final bytes, audience, channel, and claim ceiling.
A generator, validator, proof, discharge, promotion, or adoption cannot grant
publication permission.

**Authority and effect ceiling:** these definition changes activate no schema or
validator, ratify no candidate canonical-kind rows, create no adapter, publish no
bytes, authorize no current audience or channel, and do not turn provenance,
integrity, attestation, proof, validation, adoption, or promotion into truth or
authority beyond their owner-scoped meanings.

## Constitution Identity Repaired (CAV2-D58) — 2026-08-29

The generic Constitution concept was load-bearing but had no canonical definition
card. `CAV2-D53` and `CAV2-D54` consequently pointed Constitution-shaped references
at `CAV2-D34`, which already and correctly defines Authority.

- Promoted `CAV2-D58` Constitution as an owner-scoped, selector-bound,
  composable rulebook for named governed subjects.
- Repointed live Constitution references and aliases from `CAV2-D34` to
  `CAV2-D58`; `CAV2-D34` remains Authority without semantic change.
- Registered documentary `CAV2-D58-SCHEMA` and synchronized the lookup index.
- Clarified that axioms ground, invariants state must-hold conditions,
  constitutions carry adopted constraints, and validators or gates perform or
  check enforcement.
- Preserved `definitions-refactor/old-definitions-index.md` as a historical
  snapshot; its old D34 mappings are provenance, not the live lookup surface.

**Authority and effect ceiling:** this is an active Definition promotion, so it
changes canonical term meaning at the Definition authority layer. It does not
promote or activate a constitution artifact, adopt a governance rule or policy,
attach a validator or gate, change a lifecycle state, or authorize product,
publication, deployment, repository, agent, or external-system effects. The
Stable Repository Constitution remains `candidate`.
