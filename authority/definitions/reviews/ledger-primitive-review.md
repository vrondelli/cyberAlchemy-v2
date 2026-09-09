# Ledger Primitive Review

Status: review-only
Owner: definitions-governance
Method: robot-talks plus zig-zag review
Date: 2026-06-20
Canonical effect: none

## Authority Boundary

This review does not promote `ledger` as `CAV2-D20`.

CyberAlchemy v2 definitions remain canonical only in
[../DEFINITIONS.md](../DEFINITIONS.md). This artifact is evidence for a later
definitions-governance pass.

## Central Question

Should `ledger` become a CyberAlchemy v2 primitive: a recursive structure that
can be instantiated by definitions, disciplines, constitutions, Craft, Arcanum,
Saturn-source material, and future towers-with-towers?

## Assumptions Challenged

- A ledger can be shared across methods without becoming hidden global authority.
- Craft's recursive ledger model can generalize beyond Craft.
- Parent/child context structure can support tower nesting without becoming
  authority inheritance.
- Arcanum and Saturn-source material can have local definition, governance, and
  constitution ledgers while inheriting CyberAlchemy-level constraints.
- Zig-zag and robot-talks review loops can be represented as ledgered recursive
  work without unbounded cycles.

## Robot-Talks Roles

| Lens | Question | Result |
| --- | --- | --- |
| Semantic/formal | Can ledger be a primitive rather than only a Craft surface? | Yes as a scoped state/evidence register; no as semantic authority. |
| Governance/inheritance | Can local ledgers inherit higher governance without absorbing authority? | Only if inheritance is an explicit typed relation with owner routes. |
| Operational/mechanics | Can current Craft/v2 ledger mechanics support promotion? | Not yet; schema conformance and relation vocabulary block promotion. |

## Zig-Zag Result

The synthesis survived with reduced confidence and a harder boundary:

> Treat `ledger` as a candidate cross-method evidence/state-register pattern:
> a typed, scoped register whose rows preserve state, evidence, owner route,
> projection boundaries, gate status, residue, and validation posture for a
> bounded workflow. It is source-of-truth only for its own rows, never for term
> semantics, constitution rules, ontology meaning, decisions, or execution
> verdicts.

## Review Verdict

Defer canonical promotion.

The term is strong enough to keep as a candidate primitive, but not ready for
`CAV2-D20`. Promotion should wait until:

- `recursivity` is promoted or deliberately renamed;
- local Craft ledger conformance gaps are fixed or explicitly waived;
- parent/child containment is separated from authority inheritance;
- a v2 relation profile defines inheritance, override, promotion, coupling,
  recomposition, and residue relations;
- a fixture proves one parent ledger, one child ledger, inherited constraint,
  local override, promotion route, residue row, recomposition row, and generated
  index.

## Evidence Basis

| Evidence | What It Supports |
| --- | --- |
| [../DEFINITIONS.md](../DEFINITIONS.md) | Canonical definitions stop at `CAV2-D19`; `Craft execution surface` is the current promoted ledger-like term. |
| [../DEFINITIONS.md#cav2-d16-typed-coupling-invariant](../DEFINITIONS.md#cav2-d16-typed-coupling-invariant) | Non-orthogonal authority, owner, and validation dependencies must be explicit typed relations. |
| [../DEFINITIONS.md#cav2-d17-reflection-tower-method](../DEFINITIONS.md#cav2-d17-reflection-tower-method) | Recursive ascent must stop by closure, gate, or owner decision. |
| [../DEFINITIONS.md#cav2-d18-residue](../DEFINITIONS.md#cav2-d18-residue) | Ledger rows may record residue, but residue must be typed before it governs work. |
| [../DEFINITIONS.md#cav2-d19-ontology](../DEFINITIONS.md#cav2-d19-ontology) | Ontology already owns governed meaning; ledger must not become ontology in table form. |
| [../../constitutions/STABLE-REPOSITORY-CONSTITUTION.md](../../constitutions/STABLE-REPOSITORY-CONSTITUTION.md) | Authority layers must remain separate; inventory and ontology do not self-promote. |
| [../../promotion-policy.md](../../promotion-policy.md) | Evidence moves through owner gates before becoming local authority. |
| [../../README.md](../../README.md) | Authority lives in the narrowest responsible surface. |
| [../../../../arcanum/arcana/craft/SKILL.md](../../../../arcanum/arcana/craft/SKILL.md) | Craft already defines project-local recursive ledgers and source-of-truth rules. |
| [../../../../arcanum/arcana/craft/ARCHITECTURE.md](../../../../arcanum/arcana/craft/ARCHITECTURE.md) | Craft is not global definition authority or generic task executor. |
| [../../../../arcanum/arcana/craft/templates/ledger.schema.yml](../../../../arcanum/arcana/craft/templates/ledger.schema.yml) | Craft schema separates parent context, relations, decisions, gaps, and recomposition evidence. |
| [../../../../arcanum/arcana/craft/templates/schemas/index.schema.yml](../../../../arcanum/arcana/craft/templates/schemas/index.schema.yml) | Generated indexes need freshness metadata and must stay derived. |
| [../../../../projects/framework-unification/CONCEPT-MAP.md](../../../../projects/framework-unification/CONCEPT-MAP.md) | Append-only ledgers support communication/evidence but do not prove semantic authority. |
| [../../../../projects/framework-unification/layers/dispatch-composition-attack/ontology-view.md](../../../../projects/framework-unification/layers/dispatch-composition-attack/ontology-view.md) | Zig-zag/reopen cycles require loop guards and cannot be unbounded. |

## Candidate Term Boundary

If promoted later, `ledger` should not simply mean any list, log, index, or
folder. The candidate boundary is:

- typed and scoped;
- source-of-truth only for its own row family;
- explicit about owner route, source posture, and derived views;
- capable of nested contexts and recomposition;
- capable of typed cross-context relations;
- capable of carrying candidate definitions, rules, residue, gates, and
  validation evidence without promoting them;
- explicit about inherited constraints and override routes only after those
  relations are defined.

## What Ledger Must Not Do

- redefine canonical terms;
- promote constitution rules;
- replace ontology meaning;
- make inventory or source evidence authoritative by proximity;
- make `parent_id` mean inheritance;
- treat stable row IDs as semantic IDs;
- treat generated indexes or human views as source authority;
- close recursive work without recomposition evidence;
- run unbounded zig-zag or reopen loops.

## Candidate Relation Profile

These relation names are candidates, not canonical:

| Relation family | Candidate relations | Review note |
| --- | --- | --- |
| Containment and closure | `contains`, `recomposes_into` | Keep separate from inheritance. |
| Authority movement | `promotes_to`, `demotes_to`, `adapts_from`, `represents_external_authority` | Must go through owner gates. |
| Constraint flow | `inherits_constraint_from`, `overrides_constraint_from`, `waives_constraint_from` | Needs decision-gate or constitution-governance before use. |
| Provenance and validation | `derived_from`, `cites_source`, `validated_by` | Must cite concrete source or artifact IDs. |
| Residue and reflection | `emits_residue`, `treats_residue_as`, `climbs_to_reflection_layer` | Must respect `CAV2-D18` and `CAV2-D17`. |

## Promotion Blockers

| Blocker | Severity | Required action |
| --- | --- | --- |
| `recursivity` is not yet promoted. | block | Run definitions-governance on `recursivity` or choose a different canonical term. |
| Generic `ledger` may duplicate `authority import` and `Craft execution surface`. | block | Prove what remains after `CAV2-D7` and `CAV2-D12`. |
| Parent/child containment lacks inheritance semantics. | block | Define an authority inheritance relation separately. |
| Local Craft ledger has schema conformance gaps. | flag | Fix or explicitly waive before using v2 ledger as primitive evidence. |
| Generated index does not match the canonical Craft index schema. | flag | Rebuild or mark as compatibility index before promotion. |
| Saturn-source material is not yet reviewed as v2 authority. | flag | Treat Saturn as source-family evidence until import review. |

## Schema Conformance Notes

The review surfaced local Craft conformance gaps in
[../../../.craft/ledger.yml](../../../.craft/ledger.yml) and
[../../../.craft/index.json](../../../.craft/index.json):

- some gap rows use `context_id` and `owner_route`, while canonical Craft schema
  expects `scope_id` and `owner`;
- relation rows use `relation_type` and omit `reason`, while canonical Craft
  schema expects `type` and `reason`;
- one decision uses `decision_type: route`, which is not in the canonical
  decision enum;
- one enabler uses a blocker base type;
- the generated index lacks canonical generated-index metadata, row selectors,
  reverse links, references, evidence references, and stale status.

These do not invalidate the review. They block using the current v2 ledger as
proof that a generic ledger primitive is ready.

## Recommended Next Moves

1. Promote or revise `recursivity`.
2. Create a v2 relation profile for inheritance, override, promotion,
   recomposition, and residue relations.
3. Fix or explicitly waive the local Craft ledger conformance gaps.
4. Build a small fixture with a parent ledger, child ledger, inherited
   constraint, local override, promotion route, residue row, recomposition row,
   and generated index.
5. Re-run definitions-governance on `ledger` after the fixture and relation
   profile exist.
