---
node_type: refresh-patch-proposal
is_session: true
status: proposed
created: 2026-07-02
spell: invoke
mode: refresh
mutation_mode: proposal-only
source_report: ./REFRESH-REPORT.md
---

# Refresh Patch Proposal - R3 One-Pass Implementation

This proposal supersedes the earlier option-shaped R3 refresh. The remaining implementation pass should
apply the resolved decisions directly.

## Apply Order

1. Patch R3 planning text so it names root authority and decision-led reconciliation.
2. Create root relationship authority files.
3. Convert `impl/spec/RELATIONSHIPS.md` into a projection/view.
4. Implement root-signature loading and endpoint-aware validation.
5. Add relationship fixtures and tests.
6. Add schema edge-participation consistency.
7. Wire aggregate validation after discriminating tests pass.
8. Record final canonical signature count and residue.

## P1 - Batch-1 Design

Target: `projects/domainspec-v2/development/reformulate-batch1/DESIGN.md`

Replace the R3 target-result with a root-authority statement:

```markdown
**R3 - RELATIONSHIPS** - *before:* 29 human-readable implementation-local edge labels. *after:* a
root-owned finite relationship signature authority in `definitions/relationships/relationships.yml` plus a
human companion in `definitions/relationships/relationships.md`; `impl/spec/RELATIONSHIPS.md` is a
projection/view only. The relationship law is a typed, closed-world relation over `(verb, source_type,
target_type)` with explicit direction, multiplicity/order when relevant, inverse/generated-view policy,
composition notes, examples, non-examples, and validation obligations.

R3 reconciles edge-law decisions before restating the canonical count: collapse `enforces-cross` into
`enforces` plus cross-feature metadata unless a distinct code path is proven; widen `applies` to
`Policy -> {Operation, Calculation}`; normalize `queries` as the accepted Behavioral-to-Entity source shape;
treat `Operation -> Value Object` returns as a signature property unless a distinct edge is witnessed;
promote first-class Entity-to-Entity relations `owns` and `belongs-to` with `owned-by` as generated inverse
navigation for `owns`; promote first-class `Saga --[orchestrates]--> Operation[]`; keep the `produces` /
`emits` endpoint split; record Event payload/publisher composite as R3 residue unless resolved without
weakening endpoint enforcement.

*Semantic acceptance:* `validate:rels` reads the root machine authority and rejects any declared edge whose
`(verb, source_type, target_type)` is absent, forbidden, reversed, or inconsistent with Concept Registry
types. At least one bad-endpoint fixture is rejected with an `unconstructible-edge` class. The final
canonical count is the post-reconciliation count, not a precommitted `>29`.
```

Patch D4 to say the form decision is resolved:

```markdown
**D4 - Edge-signature authority form.** Resolved for R3: root `definitions/relationships/relationships.yml`
is the machine authority; `definitions/relationships/relationships.md` is the human authority companion;
`impl/spec/RELATIONSHIPS.md` is an implementation projection/view. Validators consume the root machine file.
```

## P2 - Batch-1 Work-Pack

Target: `projects/domainspec-v2/development/reformulate-batch1/WORK-PACK.md`

Patch the SWU manifest R3 row:

- Write scope: root relationship authority plus implementation projection and validators.
- Acceptance: endpoint-aware validation over root signatures, not `>29` edge growth.
- Dependencies: R2 remains prior because Concept Registry types are needed.

Replace the R3 steps with:

```markdown
- Create `definitions/relationships/relationships.yml` and `definitions/relationships/relationships.md`.
- Re-author `impl/spec/RELATIONSHIPS.md` as an implementation projection/view of root authority.
- Encode the reconciled finite signatures and final canonical count.
- Include first-class Entity-to-Entity `owns` and `belongs-to`; generate `owned-by` for `owns`; defer
  `depends-on`.
- Include first-class `Saga --[orchestrates]--> Operation[]` with cross-feature, participant, and
  compensation/residue obligations.
- Keep `Operation --[produces]--> Event` and `Entity --[emits]--> Event`; reject `Operation --[emits]--> Event`.
- Treat Operation returns to Value Object as a signature property unless distinct edge evidence is added.
- Record Event payload/publisher composite as named residue unless resolved in this pass.
```

Add endpoint-law proof:

```markdown
**Endpoint-law proof:** include fixtures for valid allowed endpoints and invalid endpoints:
`Operation --[enforces]--> Value Object`, `State Machine --[enforces]--> Operation`, a reversed allowed edge,
wrong-target `queries`, `Operation --[emits]--> Event`, and a Saga orchestration positive case.
Invalid cases fail in strict mode with an `unconstructible-edge`-class violation.
```

Patch R7:

- Use root `definitions/DEFINITIONS.md`, `definitions/DEFINITIONS-INDEX.md`, and
  `definitions/meta-types/*`.
- State that `.schema.yml` files are machine criteria/evidence, not canonical definition cards.
- State that DS-D2 edge verbs and DS-D8 edge signatures are promoted only after R3A lands.

## P3 - Implementation Layering

Target: `projects/domainspec-v2/development/reformulate-batch1/implementation-layering.md`

Patch L1 promotion evidence:

```markdown
`validate-relationships` proves endpoint admissibility from root `definitions/relationships/relationships.yml`.
Every declared edge joins through Concept Registry types and is accepted iff `(verb, source_type, target_type)`
is in the authoritative relation and not forbidden.
```

Patch recomposition to name R3A as an authority/validator unit.

## P4 - Meta-Type Formalization

Targets:

- `projects/domainspec-v2/development/meta-type-formalization/DESIGN.md`
- `projects/domainspec-v2/development/meta-type-formalization/WORK-PACK.md`

Patch MT3b / DS-D8:

```markdown
MT3b consumes the post-R3A root relationship signatures. It must not assume 29 signatures. DS-D8 names the
domain edge-signature surface produced by R3A. The validator proves DS-D8 by rejecting absent, forbidden,
or reversed endpoint triples and by checking schema `edge_participation` slices against root signatures.
```

Patch MT4 acceptance:

```markdown
Aggregate validation must include one live whole-feature endpoint check path. A node-only pass with zero
Concept Registry rows is not R3 acceptance evidence.
```

## P5 - Meta-Type Definitions

Targets:

- `projects/domainspec-v2/development/meta-type-definitions/WORK-PACK.md`
- `projects/domainspec-v2/development/meta-type-definitions/CANDIDATES.md`

Patch DD2 to root definitions:

```markdown
Canonical DS-D1/DS-D2/DS-D8 read-model entries land in root `definitions/DEFINITIONS.md` and
`definitions/DEFINITIONS-INDEX.md`. Implementation schemas are machine evidence and validation criteria,
not the definition-card authority.
```

Patch DS-D8 / `domainspec-v2-D9`:

```markdown
`DS-D8` names the domain relationship signature surface produced by R3A. If `domainspec-v2-D9` remains, it
is a method/framework term for "edge-participation signature" and must cite DS-D8 instead of silently
aliasing it.
```

## P6 - Root Relationship Authority

Targets:

- `projects/domainspec-v2/definitions/relationships/relationships.yml`
- `projects/domainspec-v2/definitions/relationships/relationships.md`

Create the directory and both files.

Minimum machine shape:

```yaml
version: 1
authority: definitions/relationships
status: active
signature_count: <computed>
signatures:
  - id: enforces
    source_type: Rule
    target_type: Operation
    direction: canonical
    multiplicity: many_to_many
    feature_scope: [same-feature, cross-feature]
    inverse:
      kind: none
    validation:
      violation_class: unconstructible-edge
      obligations:
        - reject_non_rule_source
        - reject_non_operation_target
    projection:
      markdown: "Rule --[enforces]--> Operation"
```

Required fields per signature:

- `id`
- `source_type` or `source_types`
- `target_type` or `target_types`
- `direction`
- `multiplicity`
- `feature_scope`
- `inverse`
- `status`
- `semantics`
- `examples`
- `non_examples`
- `validation`
- `composition`
- `projection.markdown`

Required first-class additions:

- `Entity --[owns]--> Entity`
- `Entity --[belongs-to]--> Entity`
- generated inverse view `Entity --[owned-by]--> Entity` for `owns`
- `Saga --[orchestrates]--> Operation[]`

Required endpoint split:

- `Operation --[produces]--> Event`
- `Entity --[emits]--> Event`

Required deferrals/residue:

- `depends-on` deferred
- Event payload/publisher composite named as residue
- Operation returns to Value Object represented as property unless distinct edge evidence is introduced

## P7 - Implementation Projection

Target: `projects/domainspec-v2/impl/spec/RELATIONSHIPS.md`

Convert the document to a projection/view:

- Name root `definitions/relationships/relationships.yml` as machine authority.
- Name root `definitions/relationships/relationships.md` as human authority companion.
- Keep friendly `Source --[verb]--> Target` examples.
- Include the post-reconciliation count.
- State that validators do not trust this file as authority.
- Remove or revise the "29 typed edges" claim.

## P8 - Relationship Validator

Target: `projects/domainspec-v2/impl/tools/validate-relationships.ts`

Implement endpoint-aware strict mode:

1. Default `--relationships` to `../definitions/relationships/relationships.yml` from the implementation cwd,
   or otherwise resolve the root path predictably.
2. Parse root YAML without ad hoc markdown label extraction.
3. Build a Concept Registry type catalog for each feature spec.
4. Parse graph rows into source concept id, relationship id, and target concept id.
5. Check:
   - canonical relationship id exists,
   - source and target concepts exist,
   - source type is admissible,
   - target type is admissible,
   - forbidden override is absent,
   - generated inverse rows are not treated as canonical unless explicitly allowed.
6. Emit `unconstructible-edge` for endpoint failures.
7. Preserve `--mode warn|strict`.

## P9 - Content Validator And Tests

Targets:

- `projects/domainspec-v2/impl/tools/validate-content.ts`
- `projects/domainspec-v2/impl/tools/tests/*`
- `projects/domainspec-v2/impl/spec/__fixtures__/*` or dedicated relationship fixtures

Required tests:

- valid `Rule --[enforces]--> Operation` passes.
- `Operation --[enforces]--> Value Object` fails.
- `State Machine --[enforces]--> Operation` fails.
- reversed allowed edge fails.
- wrong-target `queries` fails.
- `Operation --[emits]--> Event` fails.
- `Entity --[emits]--> Event` passes.
- `Operation --[produces]--> Event` passes.
- `Saga --[orchestrates]--> Operation[]` passes.
- `operation.schema.yml` cannot claim Operation is source of `performs` or `emits` when root authority says otherwise.

The aggregate path can be either direct content validation or shared relationship signature validation, but
there must be one live whole-feature endpoint check.

## P10 - Package Scripts

Target: `projects/domainspec-v2/impl/package.json`

Only after endpoint tests are discriminating, update aggregate validation:

```json
"validate": "npm run validate:docs && npm run validate:rels && npm run validate:content && npm run tools:test && npm run engine:lint"
```

## Acceptance

The one-pass implementation is accepted when:

- R3 planning text no longer says implementation is authority or that count must grow `>29`.
- Root `definitions/relationships/relationships.yml` parses.
- Root human companion exists and mirrors the machine surface.
- `impl/spec/RELATIONSHIPS.md` is projection/view only.
- `validate:rels` reads root authority.
- Bad endpoint fixtures fail with `unconstructible-edge`.
- Entity `owns` / `belongs-to` and Saga positive fixtures pass.
- `depends-on` is absent or explicitly deferred.
- `produces` / `emits` split is enforced.
- schema `edge_participation` consistency is checked.
- `npm run validate:rels`, `npm run validate:content`, `npm run tools:test`, and aggregate `npm run validate`
  pass from `projects/domainspec-v2/impl`.
