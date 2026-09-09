---
node_type: research
is_session: false
status: candidate
boundary: INTERNAL — supply-side inheritance audit; intended-not-shipped
created: 2026-07-01
authored_by: research subagent (Alexander, Christopher — supply-side completeness auditor)
angle: SUPPLY-SIDE COMPLETENESS AUDIT — enumerate everything cav2's authority+ontology
       machinery contains that a minted domain COULD inherit, then mark seeded/partial/not.
       Does NOT decide whether an element SHOULD be seeded (another agent owns that verdict).
scope: cyberAlchemy-v2/authority/ + cyberAlchemy-v2/ontology/ + cyberAlchemy-v2/disciplines/
       vs. cyberAlchemy-v2/development/mint/ (templates + EMIT-PROCEDURE + worked example)
note: Paths are repo-root-relative from domainspec-core/.
---

# Mint ↔ cav2 Inheritance Audit — SUPPLY MAP

## Method & evidence base

**Supply side** (what a minted domain COULD inherit) read in full:
- `cyberAlchemy-v2/authority/`: `AUTHORITY-MODEL.md`, `boundaries.md`, `promotion-policy.md`,
  `README.md`, `constitutions/` (3 files), `decisions/` (7 files), `definitions/` (6 top-level docs
  + `reviews/` + `source-clusters/`).
- `cyberAlchemy-v2/ontology/`: `PACKAGE-MODEL.md`, `ARTIFACT-TREE.md`, `NODE-MODEL.md`,
  `RELATION-MODEL.md`, `LIFECYCLE-MODEL.md`, `BRANCH-AS-VIEW.md`, `AUTHORITY-KINDS.md`,
  `AUTHORITY-POSTURES.md`, `RELATIONSHIP-CROSSWALK.md`, `SOURCE-SURFACE-CROSSWALK.md`,
  `TAXONOMY-CROSSWALK.md`, `README.md`, `views/`, `projections/`, `promotion-requests/`.
- `cyberAlchemy-v2/disciplines/DISCIPLINES.md`.

**Current-seed side** (what Mint emits TODAY) read in full:
- `cyberAlchemy-v2/development/mint/`: `ARCHITECTURE-BUNDLE.md`, `EXECUTION-PACK.md`, `SPEC.md`,
  `SKILL.md`, `WORK-PACK.md`.
- `cyberAlchemy-v2/development/mint/templates/`: `EMIT-PROCEDURE.md`, `L0-compose-contract.md`,
  `authority-model.md`, `source-spine.md`, `promotion-policy.md`, `constitution.md`,
  `definitions.md`, `crosswalk.md`.
- Ground-truth of actual output: `cyberAlchemy-v2/development/mint/examples/release-approval/`
  (the worked example) emits **exactly 7 files**: `authority/AUTHORITY-MODEL.md`,
  `authority/source-spine.md`, `authority/promotion-policy.md`,
  `authority/constitutions/<DOMAIN>-CONSTITUTION.md`, `definitions/DEFINITIONS.md`,
  `authority/decisions/<date>-mint.md`, `RELATED-FRAMEWORK-CROSSWALK.md`. **No** ontology package,
  definitions-index, drift-audit, disciplines catalog, boundaries.md, or navigation README appears.

**"Seeds" definition used here.** *Seeds* = Mint's templates/EMIT-PROCEDURE materially instantiate
the element into the minted repo (verbatim-inherited FORMAT or a localized placeholder set).
*Partial* = the element's principle is inherited but only a fragment of the machinery / no dedicated
artifact / no lifecycle surface. *No* = the element has no corresponding emit and no worked-example
artifact. This maps SUPPLY vs CURRENT-SEED only; the SHOULD-verdict is deferred to the boundary skeptics.

---

## (1) Full supply × seeded table

Legend: **Y** = seeded · **P** = partial · **N** = not seeded.

### 1a. authority/ — owner-facing machinery

| # | Element | cav2 source path | Seeds? | If N/P: one-line "why under-inheritance" |
|---|---|---|---|---|
| A1 | Authority Rule (authority moves by owner route, not proximity) | `authority/AUTHORITY-MODEL.md:23-29` | Y | Inherited as the localized AUTHORITY-MODEL "Core Rule". |
| A2 | Core promotion flow (source→import→candidate→owner→behavior→asset) | `authority/AUTHORITY-MODEL.md:31-46` | P | Mint emits a domain "Source Movement" pipeline (`templates/authority-model.md:90-105`) but drops the *import*/inventory rung entirely — no import-candidate stage exists in the minted spine. |
| A3 | Authority-Kinds enumeration (9 kinds + 4-col table format) | `authority/AUTHORITY-MODEL.md:48-72` | Y | FORMAT inherited verbatim; rows localized (`templates/authority-model.md:62-88`). This is the load-bearing seed. |
| A4 | Default-deny closure / catch-all row (D49) | `authority/AUTHORITY-MODEL.md:61-72` | P | Each *proposed kind* carries a default-deny Blocked-use cell, but the minted table has **no catch-all row** enforcing default-deny for *unenumerated* kinds — the closure invariant itself is not seeded, only per-row denial. |
| A5 | Authority Postures (8 postures + allowed/blocked table) | `authority/AUTHORITY-MODEL.md:74-88`; `ontology/AUTHORITY-POSTURES.md` | P | Reduced to a 7-label `Source-Kind Labels` list (`templates/source-spine.md:50-63`); the posture allowed-use/blocked-use *table* and the reliance-vs-confidence separation are dropped. |
| A6 | Narrowest-Owner Rule (movement→owner-route table) | `authority/AUTHORITY-MODEL.md:90-104` | N | No minted artifact carries a movement→narrowest-owner routing table; the domain gets kinds+gates but not the "which owner decides which movement" map. |
| A7 | invariant→axiom→constitution→validator derivation pattern | `authority/AUTHORITY-MODEL.md:105-120` | N | The derivation-chain routing pattern (how an invariant becomes a constitution rule) is not seeded; minted constitutions appear as flat rule lists with no invariant/axiom ancestry surface. |
| A8 | Non-Collapse Rules (7 canonical) | `authority/AUTHORITY-MODEL.md:122-133` | P | Rule STRUCTURE ("X is not Y") inherited + one Obs-B rule verbatim (`templates/authority-model.md:107-122`), but the domain must author its own; only the harvested-precedent rule is guaranteed. cav2's 7 specific invariants (evidence≠authority, ontology-can't-decide, inventory-can't-promote, etc.) are not carried as a baseline. |
| A9 | Gate Vocabulary (pass/flag/block/defer) | `authority/AUTHORITY-MODEL.md:135-142` | Y | Inherited verbatim (`templates/authority-model.md:124-132`). |
| A10 | Validation Surface section (links ladder+constitution+drift+ontology) | `authority/AUTHORITY-MODEL.md:144-151` | N | The minted AUTHORITY-MODEL has no "Validation Surface" section wiring its own constitution/drift/promotion together — the cross-links that make the spine navigable are absent. |
| A11 | Open-Questions-as-residue discipline (OQ blocks) | `authority/AUTHORITY-MODEL.md:153-165`; `STABLE-…-CONSTITUTION.md` CAV2-C8 | P | Constitution template carries one `OQ-1` stub (`templates/constitution.md:139-143`); the "every durable area exposes OQ residue" discipline (C8) is not seeded as a rule. |
| A12 | boundaries.md — public/private, source/read-model, generated/canonical, research/spec | `authority/boundaries.md` (whole) | N | No `boundaries.md` is emitted. Public/private appears only as a Mint-side BLOCK (`SPEC.md:50-52`), not as a *minted-repo-owned* boundary doc. A domain repo inherits zero boundary machinery of its own. |
| A13 | Free/paid + engine-mechanism withholding boundary | `authority/boundaries.md:45-56` | N | Not seeded (arguably cav2-specific; listed for completeness — a domain may need its own moat/disclosure boundary). |
| A14 | promotion-policy: promotion ladder (7-rung) | `authority/promotion-policy.md:8-18` | Y | FORMAT inherited, rungs localized (`templates/promotion-policy.md:32-48`). |
| A15 | promotion-policy: Required Gates table (6 owner gates) | `authority/promotion-policy.md:20-29` | P | Gate FORMAT + source-kind/authority gate seeded (`templates/promotion-policy.md:50-65`); but cav2's *named owner gates* (definitions-governance, discipline-governance, constitution-governance, authority import, decision-gate, task-session) are not carried as the standard gate-set — the domain must invent its own gate list. |
| A16 | promotion-policy: Pass/Flag/Block prose | `authority/promotion-policy.md:31-37` | P | Overlaps A9 gate vocab; the promotion-block *list* is localized (`templates/promotion-policy.md:68-79`) but the standalone pass/flag/block prose is folded into A9. |
| A17 | authority/README navigation ("Surfaces" table + Authority Rule digest) | `authority/README.md` (whole) | N | No `authority/README.md` (or any authority-surface index) is emitted; the minted `authority/` folder has no entrypoint/navigation surface (violates C7 Navigable Work Surface if inherited). |

### 1b. authority/definitions/ — definitions machinery

| # | Element | cav2 source path | Seeds? | If N/P: one-line "why under-inheritance" |
|---|---|---|---|---|
| D1 | Canonical DEFINITIONS.md (three-voice card format) | `authority/definitions/DEFINITIONS.md`; card format at `CAV2-D33` | Y | Three-voice card FORMAT inherited (`templates/definitions.md:20-47`); seeds 1–2 cards only (a skeleton, by design). |
| D2 | DEFINITIONS-INDEX.md (lookup index + aliases) | `authority/definitions/DEFINITIONS-INDEX.md` | N | No index emitted; template says index is "generated as the card set grows" (`templates/definitions.md:99-104`) — deferred, so the minted repo ships with no definitions-index machinery. |
| D3 | DEFINITION-DRIFT-AUDIT.md (semantic drift + undefined-critical-term ledger) | `authority/definitions/DEFINITION-DRIFT-AUDIT.md` | N | Not emitted. The load-bearing-term rule (`templates/constitution.md:127-138`) *references* a drift audit that must flag drift — but no drift-audit artifact is seeded for it to write to. Dangling reference. |
| D4 | DEFINITION-SCHEMAS.md (colocated `### Schema` registry + handle convention) | `authority/definitions/DEFINITION-SCHEMAS.md` | N | Not emitted. Definitions asserting structural shape have nowhere to register a tracked schema; the schema-as-first-class-artifact machinery is not inherited. |
| D5 | DEFINITION-TOWERS.md (tower map / definition clustering) | `authority/definitions/DEFINITION-TOWERS.md` | N | Not emitted. No tower/cluster organization for the domain's definition set. |
| D6 | DEFINITION-LOCALIZATION-ROUTE.md (import→represent→canonical layer model + 6 local-posture values) | `authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md` | N | Not emitted. Ironically the *mechanism cav2 used to localize Arcanum/DomainSpec definitions* is itself not handed to the minted domain — the domain has no localization-route for its own imported terms. |
| D7 | definitions/reviews/ (review-only candidate cards before canonical promotion) | `authority/definitions/reviews/` | N | Not emitted. No pre-canonical review staging surface for domain definitions. |
| D8 | definitions/source-clusters/ (per-source representation rows) | `authority/definitions/source-clusters/` | N | Not emitted. No source-cluster surface for domain-imported definition material. |
| D9 | Definition lifecycle (candidate→reviewed→canonical + drift route) | `CAV2-D33`; `DEFINITION-DRIFT-AUDIT.md` | P | Referenced in prose ("author the rest through the definitions lifecycle", `templates/definitions.md:99-102`) but no lifecycle artifacts (D2/D3/D7) are seeded to run it — lifecycle is named, not equipped. |

### 1c. authority/constitutions/ — constitution machinery

| # | Element | cav2 source path | Seeds? | If N/P: one-line "why under-inheritance" |
|---|---|---|---|---|
| C1 | Constitution header schema (Status/Owner/Authority-level/Selectors) | `STABLE-REPOSITORY-CONSTITUTION.md:1-6`; `CAV2-D34` | Y | Inherited verbatim (`templates/constitution.md:31-37`). |
| C2 | Per-rule Validation-mode + Examples/Non-examples structure | `STABLE-…-CONSTITUTION.md` (each rule) | P | `Validation mode:` line inherited (`templates/constitution.md`), but the Examples/Non-examples pedagogy block per rule is dropped — minted rules are terser than cav2's. |
| C3 | Validation Adapters table (rule→adapter mapping) | `STABLE-…-CONSTITUTION.md:402-420` | N | Not emitted. Minted constitution rules carry `Validation mode:` but no rule→adapter map, so the "how is this checked" surface is absent. |
| C4 | CAV2-C1 Source-Ledgered Consolidation | `STABLE-…-CONSTITUTION.md:16-32` | Y | Inherited as `<DOMAIN>-C2 Claim≤Evidence` + primary-source rule (`templates/constitution.md:54-66`). |
| C5 | CAV2-C2 Authority Layer Separation | `STABLE-…-CONSTITUTION.md:34-51` | Y | Inherited as `<DOMAIN>-C4 Separation of Concerns`. |
| C6 | CAV2-C3 Research Before Specification | `STABLE-…-CONSTITUTION.md:52-67` | Y | Inherited as `<DOMAIN>-C3` (proposal-unit before commitment). |
| C7 | CAV2-C4 Inventory & Ontology Non-Promotion | `STABLE-…-CONSTITUTION.md:68-84` | N | Not seeded — consistent with the ontology package being wholly absent (see 1e); the minted constitution has no non-promotion rule for ontology/inventory. |
| C8 | CAV2-C5 Public/Private Boundary | `STABLE-…-CONSTITUTION.md:85-100` | N | Not seeded as a *minted-repo* rule; only enforced Mint-side as a BLOCK. Domain inherits no public/private constitution rule. |
| C9 | CAV2-C6 Generated Projection Traceability | `STABLE-…-CONSTITUTION.md:101-115` | N | Not seeded. If the domain ever generates `.claude/`/`.agents/` projections, it has no traceability rule. |
| C10 | CAV2-C7 Navigable Work Surface | `STABLE-…-CONSTITUTION.md:116-130` | N | Not seeded — corroborated by absent READMEs (A17). |
| C11 | CAV2-C8 Open Questions As Residue | `STABLE-…-CONSTITUTION.md:131-145` | P | One OQ stub in the constitution template; not a governing rule. |
| C12 | CAV2-C9 Validation Before Implementation | `STABLE-…-CONSTITUTION.md:146-160` | P | Overlaps `<DOMAIN>-C3`; not carried as its own rule. |
| C13 | CAV2-C10 Standalone Extraction Gate | `STABLE-…-CONSTITUTION.md:161-176` | N | Not seeded (a minted repo *is* standalone — but has no extraction/maturity gate of its own). |
| C14 | CAV2-C11 Import Before Promotion | `STABLE-…-CONSTITUTION.md:177-205` | N | Not seeded. No import-ledger machinery in the minted repo (ties to A2, D6, E-imports). |
| C15 | CAV2-C12 Entropy Register Declaration | `STABLE-…-CONSTITUTION.md:206-246` | N | Not seeded. |
| C16 | CAV2-C13 Value-Cycle Edge Guard | `STABLE-…-CONSTITUTION.md:247-282`; `CAV2-D28` | N | Not seeded. The minted repo has no value-cycle/contextuality-obstruction guard for any future edge/schema it defines. |
| C17 | CAV2-C14 Governed Artifact Tree Interface | `STABLE-…-CONSTITUTION.md:283-329` | N | Not seeded. Any load-bearing artifact tree the domain builds has no governance-interface requirement. |
| C18 | CAV2-C15 Interface Evidence Boundary | `STABLE-…-CONSTITUTION.md:330-370` | N | Not seeded (UX-specific; may be domain-irrelevant — listed for completeness). |
| C19 | CAV2-C17 Precedent Sweep Before Net-New (Build-From-Owned) | `STABLE-…-CONSTITUTION.md:371-401`; `CAV2-D48` | P | Applied *inside Mint's emit procedure* as a precedent sweep (`templates/EMIT-PROCEDURE.md:96-101`) but **not seeded as a rule the minted repo carries** — the domain does not inherit build-from-owned as its own constitution rule. |
| C20 | Anti-Reciprocal-Authority-Laundering rule | precedent `RESEARCH-CREDIBILITY-CONSTITUTION.md` REC-C13 | Y | Inherited verbatim as `<DOMAIN>-C(meta-3)` (`templates/constitution.md:112-125`) — an Obs-B positive control. |
| C21 | Local-Status-Non-Collapse rule | precedent REC constitution | Y | Inherited as `<DOMAIN>-C(meta-2)` (`templates/constitution.md:101-110`). |
| C22 | Finding-To-Development Contract rule | precedent REC constitution | Y | Inherited as `<DOMAIN>-C(meta-1)` (`templates/constitution.md:89-99`). |
| C23 | Load-Bearing-Term Tracking rule | precedent REC constitution; ties to D3 drift audit | Y (rule) / P (machinery) | Rule inherited (`templates/constitution.md:127-138`) but its target (drift audit D3, index D2) is not seeded — the rule fires into a void. |
| C24 | CONSTITUTION-IMPORT-PACK (composition over imported constitutions) | `authority/constitutions/CONSTITUTION-IMPORT-PACK.md` | N | Not seeded. Domain has no composition/import pack for combining constitutions. |
| C25 | VAULT-CONCEPT-ADOPTION-CONSTITUTION (re-author imported vault concepts) | `authority/constitutions/VAULT-CONCEPT-ADOPTION-CONSTITUTION.md` | N | Not seeded (this is the L3 "adopt-back", explicitly deferred — `SPEC.md`, `SKILL.md:53`). Deferral is disclosed; still an omission today. |

### 1d. authority/decisions/ — decision machinery

| # | Element | cav2 source path | Seeds? | If N/P: one-line "why under-inheritance" |
|---|---|---|---|---|
| DEC1 | Signed decision record (the mint-act governance record) | `authority/decisions/README.md`; precedent | P | An `authority/decisions/<date>-mint.md` IS emitted, but only as an **L0-attributional PLACEHOLDER** (`templates/EMIT-PROCEDURE.md:170-182`) — cryptographic/attested signing is BLOCKED on the attestation capability. Decision-*record* seeded; decision-*attestation* machinery not. |
| DEC2 | decisions/README + decision card schema (question/options/chosen/rationale/effect) | `authority/decisions/README.md`; `CAV2-D36` | N | No decisions/README index or the CAV2-D36 decision-card schema is seeded; the minted `decisions/` has one record and no card format or index. |
| DEC3 | decision-gate lifecycle (contested→human-decision→record) | `promotion-policy.md:28`; `CAV2-D36` | P | Named as the D49 owner-gate (propose→ratify) but the general decision-gate machinery for *other* contested domain choices is not seeded. |

### 1e. ontology/ — the ontology package (candidate authority-model machinery)

| # | Element | cav2 source path | Seeds? | If N/P: one-line "why under-inheritance" |
|---|---|---|---|---|
| O1 | Ontology PACKAGE-MODEL (models-authority-doesn't-decide law + package boundary) | `ontology/PACKAGE-MODEL.md` | N | Not seeded. The minted repo has **no ontology package at all** — the "make authority structure explicit & reviewable before building above" surface (the package's stated repository-objective role, `ontology/README.md:20-31`) is entirely absent. |
| O2 | Candidate Record Shape (candidate_id/authority_kind/posture/challenge_contract/… YAML) | `ontology/PACKAGE-MODEL.md:90-124` | N | Not seeded. The domain gets no candidate-record shape to stage authority-bearing candidates before promotion — arguably the single richest reusable machinery cav2 has. |
| O3 | NODE-MODEL (candidate authority-object concepts + node contract + status axis) | `ontology/NODE-MODEL.md` | N | Not seeded. No candidate-node concept model for domain authority objects. |
| O4 | challenge_contract field (CAV2-D40 — challenge/contradict/validate/route protocol) | `ontology/NODE-MODEL.md:29-55` | N | Not seeded. The domain's candidates carry no challenge-contract protocol — no structured way to contest/validate a candidate. |
| O5 | confidence axes (evidence_confidence + commitment_confidence) | `ontology/NODE-MODEL.md:24`, `PACKAGE-MODEL.md:100-103` | N | Not seeded. Domain artifacts carry no two-axis confidence surface. |
| O6 | RELATION-MODEL (candidate relation predicates + relation contract) | `ontology/RELATION-MODEL.md` | N | Not seeded. No candidate-relation vocabulary for the domain's authority graph. |
| O7 | Value-cycle guard on relations (value_effect/cycle_policy classification) | `ontology/RELATION-MODEL.md:29-44`; `CAV2-D28`/`C13` | N | Not seeded (ties to C16). Any edge the domain proposes is unguarded against value-constraining cycles. |
| O8 | Schema-evolution-only / blocked-movement relation family | `ontology/RELATION-MODEL.md:60-72`; `RELATIONSHIP-CROSSWALK.md:40-49` | N | Not seeded. No blocked-movement-relation register. |
| O9 | LIFECYCLE-MODEL (workflow-state / vault-maturity / verdict / projection axis separation) | `ontology/LIFECYCLE-MODEL.md` | N | Not seeded. The 4-axis lifecycle separation + candidate workflow-state machine (source-evidence…deprecated) is absent. |
| O10 | Typed-Hole Rule (shared rail → owner profile → verdict) | `ontology/LIFECYCLE-MODEL.md:38-50` | N | Not seeded. |
| O11 | Multi-Provenance Rule (many sources → one owner-decided synthesis) | `ontology/LIFECYCLE-MODEL.md:51-56` | N | Not seeded. |
| O12 | BRANCH-AS-VIEW (branch = interpretive view, not authority; branch contract) | `ontology/BRANCH-AS-VIEW.md` | N | Not seeded. |
| O13 | AUTHORITY-KINDS ontology view (kind contract for routing review) | `ontology/AUTHORITY-KINDS.md` | P | The *authority kinds* live in the seeded AUTHORITY-MODEL (A3); but the ontology-layer *kind contract* (kind_id/candidate_inputs/forbidden_collapse routing fields) is not seeded. |
| O14 | AUTHORITY-POSTURES ontology view (posture contract; posture≠confidence) | `ontology/AUTHORITY-POSTURES.md` | P | See A5 — collapsed to a label list; posture-contract fields not seeded. |
| O15 | ontology/views/ (ontology-view / system-view / bridge-view triad) | `ontology/views/` | N | Not seeded. No paired-views triad for the domain's authority model. |
| O16 | ontology/projections/ + projection rules (read-model boundary) | `ontology/projections/`; `PACKAGE-MODEL.md` projection rows | N | Not seeded. No projection/read-model machinery. |
| O17 | ontology/promotion-requests/ (staged promotion-request surface) | `ontology/promotion-requests/` | N | Not seeded. The domain has no promotion-request staging area feeding its owner gates. |
| O18 | authority-object schema proposal (the concrete object schema) | `ontology/promotion-requests/2026-06-23-authority-object-schema-proposal.md` | N | Not seeded. |
| O19 | ARTIFACT-TREE (source-area → view-role orientation + tree-to-view role rule) | `ontology/ARTIFACT-TREE.md` | N | Not seeded. No orientation map for reading the minted tree through views. |
| O20 | TAXONOMY-CROSSWALK (DS-D1 meta-type classifier) | `ontology/TAXONOMY-CROSSWALK.md` | N | Not seeded. Domain objects get no DS-D1 meta-type classification. |
| O21 | RELATIONSHIP-CROSSWALK (DS-D2/D7/D8 typed-relation bridge) | `ontology/RELATIONSHIP-CROSSWALK.md` | N | Not seeded. |
| O22 | SOURCE-SURFACE-CROSSWALK (witness-surface mapping w/ forbidden-reading rule) | `ontology/SOURCE-SURFACE-CROSSWALK.md` | P | The *framework crosswalk* (`RELATED-FRAMEWORK-CROSSWALK.md`) is seeded (E-crosswalk) but the source-surface witness-mapping pattern (allowed/forbidden-reading per source path) is not. |

### 1f. disciplines/ — discipline machinery

| # | Element | cav2 source path | Seeds? | If N/P: one-line "why under-inheritance" |
|---|---|---|---|---|
| DIS1 | DISCIPLINES.md catalog (ID/discipline/status/steward/evidence/next-hardening) | `disciplines/DISCIPLINES.md` | N | Not seeded. The minted repo has no discipline catalog — recurring domain practices have no card/steward/hardening route. |
| DIS2 | Discipline status vocabulary (candidate/active-pattern/implemented/canonical/deprecated) | `disciplines/DISCIPLINES.md:19-27` | N | Not seeded. |
| DIS3 | Discipline Growth Rule (promote only when owner+evidence+validation+boundary named) | `disciplines/DISCIPLINES.md:28-34` | N | Not seeded. |
| DIS4 | disciplines/cards/ (per-discipline card artifacts) | `disciplines/cards/` (referenced) | N | Not seeded. |

### 1g. cross-cutting authority-object machinery (definitions that ARE machinery)

| # | Element | cav2 source path | Seeds? | If N/P: one-line "why under-inheritance" |
|---|---|---|---|---|
| M1 | CAV2-D48 Authority Promotion Lifecycle (stages/gates/owner/stop-rule) | `authority/definitions/DEFINITIONS.md:3184-3245` | P | The *ladder* (A14) instantiates D48's cross-kind default, but the D48 *abstraction* (a kind is valid only when it names stages+gates+owner+stop-rule) is not seeded as a per-kind requirement — proposed kinds get a default-deny cell but no declared lifecycle. |
| M2 | CAV2-D49 Closed-Kind Enumeration invariant | `authority/definitions/DEFINITIONS.md:3247-3313` | P | The *rule* D49 is inherited (Mint proposes into the domain's own table); but the domain's table is not itself declared *closed with default-deny* — see A4. |
| M3 | authority/imports/ ledger surface (stage source paths before promotion) | `authority/README.md:13`; `boundaries.md:24-32`; CAV2-C11 | N | Not seeded (ties C14, A2, D6). The minted repo has no import-ledger to stage scattered source material before it governs. |
| M4 | Source-map surface (SOURCE-MAP.md cohorts/roles/posture) | referenced `../SOURCE-MAP.md` (CAV2-C1) | P | The `source-spine.md` covers source *families*; a SOURCE-MAP-style cohort/role/posture ledger is not seeded. |

---

## (2) The omission list (everything cav2 HAS that Mint does NOT seed)

Marked **N** (fully absent) or **P** (principle present, machinery incomplete). Every item is a
candidate under-inheritance because a domain-repo could have inherited the meta-machinery for it.

**Fully absent (N):**
- Narrowest-Owner Rule (movement→owner routing table) — `AUTHORITY-MODEL.md:90-104`
- invariant→axiom→constitution→validator derivation pattern — `AUTHORITY-MODEL.md:105-120`
- AUTHORITY-MODEL "Validation Surface" cross-linking section — `AUTHORITY-MODEL.md:144-151`
- boundaries.md (public/private, source/read-model, generated/canonical, research/spec) — `authority/boundaries.md`
- Free/paid + engine-mechanism withholding boundary — `boundaries.md:45-56`
- authority/README navigation surface — `authority/README.md`
- DEFINITIONS-INDEX.md — `authority/definitions/DEFINITIONS-INDEX.md`
- DEFINITION-DRIFT-AUDIT.md — `authority/definitions/DEFINITION-DRIFT-AUDIT.md`
- DEFINITION-SCHEMAS.md (tracked-schema registry) — `authority/definitions/DEFINITION-SCHEMAS.md`
- DEFINITION-TOWERS.md — `authority/definitions/DEFINITION-TOWERS.md`
- DEFINITION-LOCALIZATION-ROUTE.md (import→represent→canonical + local-posture vocab) — `authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md`
- definitions/reviews/ (pre-canonical review staging) — `authority/definitions/reviews/`
- definitions/source-clusters/ — `authority/definitions/source-clusters/`
- Constitution Validation-Adapters table (rule→adapter) — `STABLE-…-CONSTITUTION.md:402-420`
- CAV2-C4 Inventory & Ontology Non-Promotion rule — `STABLE-…-CONSTITUTION.md:68-84`
- CAV2-C5 Public/Private Boundary rule (as minted-repo rule) — `STABLE-…-CONSTITUTION.md:85-100`
- CAV2-C6 Generated Projection Traceability rule — `STABLE-…-CONSTITUTION.md:101-115`
- CAV2-C7 Navigable Work Surface rule — `STABLE-…-CONSTITUTION.md:116-130`
- CAV2-C10 Standalone Extraction Gate — `STABLE-…-CONSTITUTION.md:161-176`
- CAV2-C11 Import Before Promotion — `STABLE-…-CONSTITUTION.md:177-205`
- CAV2-C12 Entropy Register Declaration — `STABLE-…-CONSTITUTION.md:206-246`
- CAV2-C13 Value-Cycle Edge Guard — `STABLE-…-CONSTITUTION.md:247-282`
- CAV2-C14 Governed Artifact Tree Interface — `STABLE-…-CONSTITUTION.md:283-329`
- CAV2-C15 Interface Evidence Boundary — `STABLE-…-CONSTITUTION.md:330-370`
- CONSTITUTION-IMPORT-PACK — `authority/constitutions/CONSTITUTION-IMPORT-PACK.md`
- VAULT-CONCEPT-ADOPTION-CONSTITUTION (L3 adopt-back, deferred) — `authority/constitutions/VAULT-CONCEPT-ADOPTION-CONSTITUTION.md`
- decisions/README + CAV2-D36 decision-card schema — `authority/decisions/README.md`
- Ontology PACKAGE-MODEL (models-authority law + package boundary) — `ontology/PACKAGE-MODEL.md`
- Candidate Record Shape (the richest reusable candidate-staging YAML) — `ontology/PACKAGE-MODEL.md:90-124`
- NODE-MODEL (candidate authority-object concepts) — `ontology/NODE-MODEL.md`
- challenge_contract protocol field (CAV2-D40) — `ontology/NODE-MODEL.md:29-55`
- two-axis confidence (evidence_confidence + commitment_confidence) — `ontology/NODE-MODEL.md`, `PACKAGE-MODEL.md`
- RELATION-MODEL (candidate relation predicates) — `ontology/RELATION-MODEL.md`
- value-cycle guard on relations (value_effect/cycle_policy) — `ontology/RELATION-MODEL.md:29-44`
- blocked-movement / schema-evolution-only relation family — `ontology/RELATION-MODEL.md:60-72`
- LIFECYCLE-MODEL (4-axis separation + workflow-state machine) — `ontology/LIFECYCLE-MODEL.md`
- Typed-Hole Rule (rail→owner-profile→verdict) — `ontology/LIFECYCLE-MODEL.md:38-50`
- Multi-Provenance Rule — `ontology/LIFECYCLE-MODEL.md:51-56`
- BRANCH-AS-VIEW (branch contract) — `ontology/BRANCH-AS-VIEW.md`
- ontology/views/ triad (ontology/system/bridge view) — `ontology/views/`
- ontology/projections/ + projection rules — `ontology/projections/`
- ontology/promotion-requests/ staging surface — `ontology/promotion-requests/`
- authority-object schema proposal — `ontology/promotion-requests/2026-06-23-authority-object-schema-proposal.md`
- ARTIFACT-TREE orientation map (source-area→view-role) — `ontology/ARTIFACT-TREE.md`
- TAXONOMY-CROSSWALK (DS-D1 meta-type classifier) — `ontology/TAXONOMY-CROSSWALK.md`
- RELATIONSHIP-CROSSWALK (DS-D2/D7/D8 typed-relation bridge) — `ontology/RELATIONSHIP-CROSSWALK.md`
- DISCIPLINES.md catalog + status vocab + Growth Rule + cards/ — `disciplines/DISCIPLINES.md`
- authority/imports/ ledger surface — `authority/README.md:13`, `boundaries.md`, CAV2-C11

**Present-but-partial (P) — machinery under-inherited even where the principle is seeded:**
- Core promotion flow drops the import/inventory rung — `AUTHORITY-MODEL.md:31-46` vs `templates/authority-model.md:90-105`
- Default-deny closure seeded per-row but no catch-all/closed-table declaration — A4
- Authority Postures collapsed to a label list (no posture table, no posture≠confidence) — A5
- 7 canonical Non-Collapse Rules reduced to "structure + 1 rule" — A8
- Open-Questions-as-residue = one stub, not a rule — A11
- Required-Gates: cav2's named owner-gate set not carried as standard — A15
- Per-rule Examples/Non-examples pedagogy dropped from constitution rules — C2
- CAV2-C17 build-from-owned used inside Mint, not seeded as a minted-repo rule — C19
- Load-bearing-term rule seeded but drift-audit/index targets absent (fires into void) — C23
- Definition lifecycle named but not equipped (no index/drift/review artifacts) — D9
- Signed decision is an attributional PLACEHOLDER (attestation BLOCKED) — DEC1
- decision-gate machinery only present as the D49 propose→ratify gate — DEC3
- SOURCE-SURFACE-CROSSWALK witness-mapping pattern not seeded (only framework crosswalk is) — O22
- Authority-KINDS / POSTURES ontology *contracts* not seeded (only the model table) — O13/O14
- CAV2-D48 lifecycle abstraction not seeded per-kind (only the ladder default) — M1
- CAV2-D49 closed-with-default-deny not declared on the domain's own table — M2
- SOURCE-MAP cohort/role/posture ledger not seeded (source-spine covers families only) — M4

---

## (3) Top candidate under-inheritances (ranked by apparent importance)

Ranking heuristic (supply-side only, not a should-verdict): (a) is the element *machinery a domain
must have to author its own authority* (Mint's own stated design goal — SPEC "a base to grow on its
own"), and (b) does a *seeded* element already dangle-reference the missing one? Higher on both = higher rank.

1. **Candidate Record Shape + NODE/RELATION/LIFECYCLE ontology package (O1–O11).** The entire
   "make authority structure explicit & reviewable before building above" surface is absent. cav2's
   own `ontology/README.md:20-31` names this as *the* repository-objective role for downstream repos
   to build above the base. A minted repo has authority *outputs* (kinds, constitution) but none of
   the *candidate-staging machinery* (candidate-record YAML, challenge_contract, confidence axes,
   lifecycle state machine) it needs to move its OWN new candidates toward authority. This is the
   largest single block of reusable meta-machinery cav2 has, and it is 0% seeded.

2. **Definitions lifecycle machinery: INDEX + DRIFT-AUDIT + SCHEMAS + LOCALIZATION-ROUTE (D2–D6, D9).**
   The seeded constitution's Load-Bearing-Term rule (`templates/constitution.md:127-138`, C23) *requires*
   a drift audit to flag undefined terms and a tracked authority entry — but neither the drift-audit
   (D3), the index (D2), nor the schema registry (D4) is emitted. The domain inherits the *rule that
   fires into a void*. This is a self-inconsistency in the current seed, not merely a gap.

3. **authority/imports/ ledger + Import-Before-Promotion (C14) + Definition-Localization-Route (D6) + the import rung of the core flow (A2).**
   The minted repo has no way to *stage scattered source material before it governs* — the exact
   consolidation problem cav2 was built to solve. Notably, DEFINITION-LOCALIZATION-ROUTE is the
   mechanism cav2 used to localize Arcanum/DomainSpec terms; the minted domain is handed the *result
   pattern* (source-spine families) but not the *localization machine*.

4. **Navigable Work Surface + area READMEs + Validation-Surface + Validation-Adapters (A10, A17, C3, C10).**
   Every minted `authority/` folder ships with no entrypoint, no cross-linking of its own
   constitution/drift/promotion, and no rule→adapter map. cav2 treats navigability as a constitution
   rule (C7); the minted repo violates it by construction.

5. **DISCIPLINES catalog + Growth Rule (DIS1–DIS4).** Recurring domain practices have no card,
   steward, status, or hardening route. Disciplines are one of cav2's four authority owners
   (definitions/constitutions/disciplines/decisions); the minted repo inherits three of four owner
   routes' *machinery* (definitions=skeleton, constitutions=rules, decisions=placeholder record) but
   the discipline route is entirely absent.

6. **Full Non-Collapse baseline + Narrowest-Owner Rule + invariant→axiom derivation (A6, A7, A8).**
   The domain inherits the non-collapse *structure* and one Obs-B rule, but not cav2's 7-rule
   baseline nor the movement→owner routing table nor the derivation pattern — the "how to reason
   about which owner and why a rule exists" scaffolding is thin.

7. **Value-Cycle Edge Guard (C16/O7) + Governed-Artifact-Tree-Interface (C17) + Generated-Projection-Traceability (C9).**
   Forward-looking guards: any edge, artifact-tree, or generated projection the domain later builds
   is ungoverned. Lower rank only because they bite *later* (when the domain grows structure), not at
   mint time — but they are precisely the meta-machinery "a base to grow on its own" would want.

---

## Residue / unverifiable

- **WORK-PACK.md read partially** (listing + frontmatter via SKILL/EMIT cross-refs); its SWU
  acceptance criteria are cited second-hand via EMIT-PROCEDURE/L0-contract, not re-derived. Any SWU
  that *intends* to seed an omitted element but is deferred would appear there — treat "N" items as
  "not seeded *today*", not "never intended". Marked residue.
- **Deferral vs omission.** Two omissions are *explicitly deferred by design*: VAULT-CONCEPT-ADOPTION
  (C25, the L3 adopt-back) and L2 attestation (DEC1). These are disclosed deferrals, not silent gaps;
  still counted as not-seeded-today per the audit's supply-vs-seed mandate.
- **cav2-specific vs domain-reusable.** A few supply items (A13 free/paid engine moat; C18 UX
  interface-evidence) are plausibly cav2/UX-specific and may be domain-irrelevant. Listed for
  exhaustiveness per the "err toward listing more" instruction; the SHOULD-filter belongs to the
  boundary skeptics, not this supply map.
- **The SHOULD question is out of scope by mandate.** This map asserts only: element X exists in cav2
  at path P, and Mint does/doesn't seed it. Whether an omission is *correct* localization discipline
  (meta-inherited, object-localized) or genuine under-inheritance is the skeptics' verdict.
