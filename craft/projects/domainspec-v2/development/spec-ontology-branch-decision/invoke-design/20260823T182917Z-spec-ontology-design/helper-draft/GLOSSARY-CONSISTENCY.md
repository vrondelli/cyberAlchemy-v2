# Glossary Consistency — Candidate Report

## Result

`pass-with-owner-gated-candidate-terms`

The design reuses existing authority terms where they apply and introduces no
silent canonical definitions. Every new node, relation, or lifecycle label
below remains candidate-local until its named definitions or relationship
owner accepts exact wording and bytes.

## Reused terms

| Term | Existing source/owner | Design use | Consistency finding |
| --- | --- | --- | --- |
| Primary source | DomainSpec v2 authority model and constitution | home authority for business meaning and the per-claim formal-owner role | consistent; does not grant a new authority kind |
| Validation governance | DomainSpec v2 authority model | owns deterministic obligation derivation and build-time fidelity | consistent only if it never claims runtime correctness or discharge |
| Meta-Type System (`DS-D1`) | DomainSpec definitions owner | authority route for any future node-type admission | consistent; this design does not add active meta-types |
| Relationship Verb Set (`DS-D2`) | DomainSpec definitions/relationship owner | authority route for `formalizes` and `derived_from` | consistent; both verbs remain candidates pending admission |
| Relationship Signature Authority (`DS-D8`) | DomainSpec definitions/relationship owner | authority route for exact endpoints, scope, direction, and multiplicity | consistent; a display arrow is not treated as active authority |
| Canonical Single Responsibility Principle (`domainspec-v2-D27`) | DomainSpec definitions owner | each proposition authored once under its narrowest owner; views generated | consistent; four catalogs do not duplicate propositions |
| `authority_effect` | CAV2 ontology protocol within its scope | explicit non-authority label on candidate and projection records | no authority import; CAV2 remains precedent/protocol owner only within scope |

## Candidate-local terms and owner routes

| Candidate term | Intended meaning in this design | Required owner route before canonical use | Collision/non-collapse rule |
| --- | --- | --- | --- |
| `BusinessMeaning` | exact owner-authored business/domain meaning node | business source plus DomainSpec meta-type/definitions admission | not `FormalClaim`, evidence, or projection text |
| `FormalClaim` | exact versioned formal statement owned per claim | primary-source authority role plus DomainSpec meta-type/definitions admission | not business meaning and not a proof result |
| `formal-claims-owner` | per-claim role governing exact formal statement and assertion | authority-model and primary-source owner | role, not a new authority kind or composition owner |
| `Specification` | ontology node that composes exact claim refs | specification-composition plus definitions/meta-type owner | composition does not own member meaning |
| `SpecificationMembership` | ordered exact reference from a specification version to a claim version | specification-composition plus relationship owner | reference, not copied or editable claim content |
| `formalizes` | forward assertion from `FormalClaim` to `BusinessMeaning` | `DS-D2`/`DS-D8` relationship owner plus formal/business receipt owners | correspondence, not equivalence, truth, or authority transfer |
| formal assertion acceptance | formal owner's acceptance of exact relation bytes | formal-claims owner route | not business fidelity acceptance |
| business fidelity acceptance | business owner's fidelity-only acceptance of exact relation bytes | business source owner route | not formal statement authorship or proof |
| `ProofObligation` | separately owned derived condition requiring evidence/lifecycle handling | validation-governance plus definitions/meta-type owner | not claim meaning and not proof of success |
| `derived_from` | forward provenance assertion from obligation to formal claim | `DS-D2`/`DS-D8` relationship owner plus validation-governance | derivation, not discharge; inverse is generated only |
| `DerivationContextManifest` | immutable content-addressed derivation detail | validation-governance/protocol/schema owner | context, not a mutable cache or semantic registry |
| branch catalog | owner-local canonical record manifest | each branch owner plus ontology-protocol owner | not integrated shared authority |
| integrated graph projection | deterministic read model over exact admitted catalogs | projection owner | never canonical input, acceptance, discharge, or promotion |
| aggregate validator | ordered composer of typed owner and integration results | aggregate command owner | never central semantic interpreter |

## Important near-collisions

### `business.FormalClause`

The current financial-settlement prototype uses `business.FormalClause`. It is
migration evidence only. The target candidate places formal claims and
specification composition in their own branch. The old label MUST NOT be
silently aliased, reinterpreted, or treated as target authority. Any migration
requires exact pre/postimages and fresh owner acceptance.

### `formalizes` versus equivalence

`formalizes` asserts a scoped, potentially lossy correspondence. It does not
say that the formal claim and business meaning are identical. The declared-loss
and claim-ceiling fields, plus the two distinct receipts, prevent collapse.

### `derived_from` versus proof

`derived_from` records provenance of a deterministically derived obligation. It
does not say the obligation is satisfied, the claim is true, or evidence is
valid. A passing evaluator receipt remains evidence input to a separate
lifecycle decision.

### inverse display labels

“is formalized by” and any reverse reading of `derived_from` are generated
navigation. They MUST NOT be admitted as separate canonical verbs or edges.

### structural address versus shared semantics

The exact CAV2 syntax acceptance covers structure only and CAV2-local use.
DomainSpec must independently adopt exact syntax bytes. Even after adoption,
the syntax cannot define DomainSpec record kinds, relations, lifecycle, or
authority.

## Definition promotion boundary

Canonical use of any candidate term requires:

1. exact proposed definition and machine representation;
2. existing owner route and version/digest;
3. collision and relationship non-collapse review;
4. endpoint/signature evidence for relations;
5. owner acceptance of exact bytes and claim ceiling;
6. synchronized human/machine definition surfaces through the authorized route.

This report performs none of those promotions. Its own `authority_effect` is
`none`.
