# Verifier Report — Willard Van Orman Quine

Date: 2026-07-13  
Dispatch: `2026-07-13-definitions-refactor-review`  
Role: skeptic / scope verifier  
Vector: ownership, localization, duplication, ontological burden, and proportional formalization  
Status: independent verification after attacker synthesis and verifier robot-talks  
Mutation posture: review artifact only; no target, `attacks.md`, or `findings.md` mutation

## Verification Rule

This verification does not treat presence in `DEFINITIONS.md` as proof that a
term belongs in the central definition spine. It also does not treat missing
enforcement, missing validators, or zero conforming instances as proof that a
referent does not exist.

For every proposed `RETIRE` or `LOCALIZE`, the verifier first constructs the
strongest available case for `KEEP` or `REWRITE`:

1. Does the term name a repository object, practice, distinction, or rule with
   concrete producers, consumers, decisions, or gates?
2. Do consumers depend on one stable meaning rather than incidental wording?
3. Is the current defect repairable without replacing the concept with a
   different concept?
4. Does another authority already own the generic meaning?
5. If the term is localized, which normative owner and surface receive it, and
   which consumers must migrate?
6. Does the formalism buy a reproducible classification, relation, transition,
   or conformance decision?

A `LOCALIZE` result is incomplete unless it names a real target authority. A
candidate narrative file cannot silently become a definition authority.

## Independent Objections

### Q-01 — `LOCALIZE` lacks an operational contract

- **Finding/rows:** D2, D4, D7–D11, D13–D15, D22, D24, D27, D30,
  D41–D43, and D45–D47.
- **Steelman for KEEP/REWRITE:** several of these terms have cross-surface
  consumers or are used by candidate constitutions, validators, disciplines,
  or reusable templates. The existence of a more specific explanatory document
  does not prove that document can own normative semantics.
- **Evidence:** `cyberAlchemy-v2/AGENTS.md` declares
  `authority/definitions/DEFINITIONS.md` the canonical local definition source
  and says narrative, research, observability, inventory, ontology, and ops
  artifacts may explain but not redefine it. `DEFINITION-LOCALIZATION-ROUTE.md`
  separates project-local representation, canonical local definitions, and
  external references. `DEFINITION-TOWERS.md`,
  `ARCHITECTURE-KNOWLEDGE-GOVERNANCE.md`, and
  `UX-UI-KNOWLEDGE-GOVERNANCE.md` are candidate surfaces.
- **Verdict:** **REFUTED** as a ready disposition.
- **Required correction:** define `LOCALIZE` as a transfer contract containing
  `target_surface`, `normative_owner`, `target_authority_status`,
  `consumers_to_migrate`, any central residue/reference, and a promotion
  condition. If the target remains candidate, use `DEFER` or retain a central
  `REWRITE`.

### Q-02 — D11 Tower Space cannot be retired on the current evidence

- **Finding/row:** D11.
- **Steelman for REWRITE:** the concept names participation of an area in a
  definition tower while preserving source and authority posture. It is
  consumed by `DEFINITION-TOWERS.md`, `CRAFT.md`, and the proposed reusable
  `development/mint/templates/baseline-primitives.md` space-typing rule.
- **Evidence:** `DEFINITIONS.md:435`; `DEFINITION-TOWERS.md:84,175,443`;
  `CRAFT.md:206`; `baseline-primitives.md:47`.
- **Defect conceded:** “own, supply, consume, or route” is so broad that nearly
  every area qualifies. The existing card is not fit for `KEEP`.
- **Verdict:** **REFUTED**.
- **Required correction:** change `RETIRE` to conditional `LOCALIZE` under the
  definition-tower method, or `DEFER` until that target has normative status. A
  rewrite should prefer a narrow tower-participation role over a new
  metaphysical category of space.

### Q-03 — D31 Primitive Type is repairable

- **Finding/row:** D31.
- **Steelman for REWRITE:** the term performs real work in deciding which
  semantic kinds a declared basis accepts without derivation from another type
  inside that same basis. It is explicitly maintained in the primordial source
  cluster, recorded as promoted in the tower map, and used in artifact-primitive
  review.
- **Evidence:** `source-clusters/primordial.md:40,66,125-141,472-473`;
  `DEFINITION-TOWERS.md:130,444`; `DEFINITIONS.md:1962`.
- **Defect conceded:** the current card makes primitiveness look absolute and
  confuses semantic primitiveness with owner/documentation metadata.
- **Verdict:** **REFUTED**.
- **Required correction:** change `RETIRE` to `REWRITE`. Define primitiveness
  relative to a declared scope or basis. Owner, consumer list, and documentation
  are admission evidence, not constituents of semantic identity. Remove the
  decorative tuple.

### Q-04 — D41 Authority Model is centrally owned

- **Finding/row:** D41.
- **Steelman for REWRITE:** a short central definition can name the model's
  semantic role while `AUTHORITY-MODEL.md` owns tables, routes, postures, and
  detailed structure.
- **Evidence:** `AUTHORITY-MODEL.md:3-5` is an active local authority model and
  explicitly names D41 as its canonical definition. D41 coordinates multiple
  authority surfaces rather than one local lens.
- **Verdict:** **REFUTED**.
- **Required correction:** change `LOCALIZE` to `REWRITE`; keep semantic essence
  in the definition spine and derive detail from `AUTHORITY-MODEL.md` without
  duplicating its record shape.

### Q-05 — D42 Governed Artifact Tree is not architecture-local

- **Finding/row:** D42.
- **Steelman for REWRITE:** the term distinguishes a merely organizational tree
  from a load-bearing tree that must expose owner, source, validation, challenge,
  and drift routes. Artifact admission, a discipline card, and constitution C18
  consume it outside the architecture lens.
- **Evidence:** `STABLE-REPOSITORY-CONSTITUTION.md:404-410`;
  `validation/artifact-admission/README.md:49`;
  `disciplines/cards/artifact-tree-admission.md:40,70,88,107`.
- **Verdict:** **REFUTED**.
- **Required correction:** change `LOCALIZE` to `REWRITE`. Keep the transversal
  distinction and consequence centrally; localize the detailed record schema to
  artifact admission.

### Q-06 — D22 and D24 have normative consumers

- **Finding/rows:** D22 and D24.
- **Steelman for REWRITE:** D22 supplies a non-collapse/non-redundancy admission
  test; D24 supplies a provenance-first navigation rule. Both are consumed by
  the vault adoption constitution and were promoted through definitions and
  constitution governance.
- **Evidence:** `VAULT-CONCEPT-ADOPTION-CONSTITUTION.md:35,95,115,208,210`;
  `CONSTITUTION-IMPORT-PACK.md:64`; `DEFINITION-TOWERS.md:450`.
- **Verdict:** **REFUTED** under the current unqualified localization.
- **Required correction:** D22 becomes `REWRITE`. D24 becomes `DEFER`, or
  `LOCALIZE` only after the navigation/constitution owner absorbs the complete
  rule and migrates its consumers.

### Q-07 — D43–D47 may be local, but their current targets are candidates

- **Finding/rows:** D43–D47.
- **Steelman for KEEP/REWRITE:** D43 and D46 are named specializations of D48,
  and D47 may contain a reusable evidence-honesty core. Their central cards
  currently provide the only normative definitions referenced by candidate lens
  documents.
- **Scope evidence:** D43/D44 are predominantly architecture-lens terms;
  D45–D47 are predominantly UX/UI-lens terms. This supports localization in
  principle.
- **Verdict:** **SURVIVES**, conditioned on a location contract.
- **Required correction:** promote or name an authoritative lens-local
  definition surface before moving semantics. D48 may reference local
  specializations but must not duplicate their stages. Test whether D47's shared
  claim-proof core belongs to D38 and only its UX taxonomy belongs locally.

### Q-08 — External Arcanum ownership survives

- **Finding:** F15; D12, D20, D32, D50, and D56.
- **Steelman for KEEP:** these terms are genuinely used by CAV2 and must remain
  discoverable in the refactor.
- **Evidence:** `DEFINITION-LOCALIZATION-ROUTE.md` and
  `source-clusters/arcanum.md` require local representation while preserving
  Arcanum's generic semantic ownership.
- **Verdict:** **SURVIVES**.
- **Required correction:** distinguish an external dependency/reference entry
  without a new CAV2 ID from a local normative specialization with its own term
  and ID. Non-normative examples do not constitute specialization.

### Q-09 — D56 Schema does not yet justify a CAV2 specialization

- **Finding/row:** D56; F11, F12, and F15.
- **Steelman for SPECIALIZE:** CAV2 may eventually need a local rule that schema
  conformance is shape evidence and does not imply truth, authority, or
  promotion.
- **Contrary ownership evidence:** Arcanum already owns `DEF-ARC-SCHEMA`, whose
  definition and boundary substantially provide that distinction.
  `source-clusters/arcanum.md` says `Local adaptation need: none yet`.
  DomainSpec meta-type and edge schemas prove the generic referent and a
  DomainSpec specialization, not a distinct CAV2 specialization.
- **Verdict:** **REFUTED** as a closed `SPECIALIZE` decision; F11/F12 survive.
- **Required correction:** change D56 to `REFERENCE`. Keep specialization
  owner-gated until a non-redundant CAV2 obligation is demonstrated. Any such
  specialization receives a new term and ID; the reserved D56 ID requires an
  independent owner decision.

### Q-10 — D51 must survive under a non-colliding concept

- **Finding:** F08; row D51.
- **Steelman for KEEP:** discovery, research, ledger, spec, and other artifact
  kinds form a real family, and artifact admission/C18 consume the distinction.
- **Collision evidence:** Arcanum `DEF-ARC-CANONICAL-ARTIFACT` defines canonical
  artifact as an authoritative source-of-truth artifact. CAV2-D51 deliberately
  uses the same term for a typed artifact that may be non-authoritative. D51's
  own boundary admits the opposed senses, and its producer-origin identity is
  unresolved.
- **Verdict:** **SURVIVES** as rename plus rewrite, not as retirement.
- **Required correction:** separate registered-kind membership, schema
  conformance, provenance/process attestation, durability, and authority
  posture. Add a migration list for C18, artifact admission, validator planning,
  canonical kinds, and all other consumers. Final name and membership remain
  owner-gated.

### Q-11 — Canonical-source contradiction blocks promotion, not drafting

- **Finding:** F01 and F02.
- **Evidence:** source, index, drift audit, and schema registry disagree about
  active cards and stable IDs.
- **Verdict:** **SURVIVES**.
- **Required correction:** declare the refactor file proposal/non-canonical.
  Resolve source/index/audit/registry before promotion or synchronization, not
  before drafting.

## Robot-Talks With Popper

Popper independently confirmed coverage of all 56 rows, accepted the factual
cores of F01–F15, refuted D11 and D31 retirement, preserved D38 with editorial
repair, preserved D51 as gated rewrite, and rejected an already-decided D56
specialization.

### Accepted Popper Objections

1. D11 has enough owner/use evidence to defeat `RETIRE`.
2. D31's recorded promotion and primordial use defeat `RETIRE`.
3. D38's prose norm survives while its inequality is non-normative unless an
   order is defined.
4. D51 has a real design referent but its name, identity, and admission rule
   remain owner-gated.
5. D56's generic referent is proved; a local specialization is not.
6. F01–F15 have surviving factual cores even where their proposed disposition
   needs scope repair.

### Qualified Popper Inferences

- Local use does not itself authorize `LOCALIZE`; the destination must have
  normative authority and receive consumer migrations.
- Historical promotion proves prior adoption, not that the current definition
  is semantically consistent or proportionally formalized.
- DomainSpec schemas prove Schema and DomainSpec's use of it, not a distinct
  CAV2 semantic specialization.

### Position Changes During Robot-Talks

- D11 moved from rejecting retirement in favor of broad rewrite to a more exact
  conditional `LOCALIZE` under the definition-tower method, with `DEFER` as the
  fallback while that target remains candidate.
- D31 remained `REWRITE`; Popper's independent promotion/use evidence increased
  confidence that retirement is not supportable.
- D56 hardened from `REFERENCE rather than proven SPECIALIZE` to an explicit
  requirement that the matrix say `REFERENCE`, preserving a later owner gate.
- D43–D47 retained localization as a possible scope result, but only after an
  authoritative local surface exists.

## Minimum Mandatory Changes to `findings.md`

1. Add the complete localization contract to classification semantics.
2. D11: `RETIRE` -> conditional `LOCALIZE`; `DEFER` while target is candidate.
3. D31: `RETIRE` -> `REWRITE` relative to a declared scope.
4. D41: `LOCALIZE` -> `REWRITE`.
5. D42: `LOCALIZE` -> `REWRITE`.
6. D22: `LOCALIZE` -> `REWRITE`.
7. D24: `LOCALIZE` -> `DEFER`, unless its owner absorbs and migrates the rule.
8. D30: `LOCALIZE` -> `REWRITE` because its consumers cross owner surfaces.
9. D56: `SPECIALIZE` -> `REFERENCE`; preserve specialization as an owner gate.
10. F15: define reference entry versus local specialization and ID policy.
11. F08: require a D51 rename migration list.
12. State that the refactor target is proposal/non-canonical until F01/F02 are
    resolved.

## Where `LOCALIZE` Can Still Survive

With a complete location contract, localization remains plausible for:

- D2 — discipline/import practice;
- D4 — source map;
- D7/D8 — import contract/schema;
- D9 — project identity/README;
- D10/D11 — definition-tower method;
- D13 — promotion policy/queue;
- D14 — source model;
- D15 — project-space contract;
- D24 — navigation/constitution after semantic absorption;
- D27 — formal/research owner after consumer repair;
- D43/D44 — architecture owner after authority promotion;
- D45–D47 — UX/UI owner after authority promotion.

D22 may localize only if every normative consumer absorbs its semantics. D41
and D42 must not localize under current ownership. D30 favors a central rewrite.

## Final Position

The synthesis correctly abandoned the former rule that a definition must
already be implemented in its exact model. It still needs a stricter ownership
test for retirement and localization.

Real referents block premature erasure, not critical rewriting. Local use blocks
central overreach, but does not create a local definition authority by itself.
External use proves dependency, not transfer of ownership. Formalism is allowed
before automation only when it states an honest, reproducible review decision.

No target, `attacks.md`, or `findings.md` was changed by this verifier.
