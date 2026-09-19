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

# Refresh Patch Proposal - R3 Edge-Law Artifact Set

This is an executable patch plan, not an applied patch. Apply through `task-session` after the R3 owner
accepts the signature-surface decision.

## Patch Order

1. Decide the authoritative edge-signature surface.
2. Fold the novice-use handoff into the R3 decision set.
3. Patch batch-1 R3 acceptance wording and R7 definition routing.
4. Patch meta-type formalization and definitions routing around MT3b/DS-D8.
5. Patch `RELATIONSHIPS.md` into a strict signature surface or add its chosen companion machine file.
6. Patch validators and fixtures.
7. Wire aggregate validation only after discriminating endpoint tests pass.

## P1 - Batch-1 Design

Target: `development/reformulate-batch1/DESIGN.md`

Replace the R3 target wording that says R3-P1/P2 add edges and that canonical count must be `>29` with:

```markdown
**R3 - RELATIONSHIPS** - *before:* 29 human-readable allowed edge labels. *after:* a formal edge-law:
an authoritative finite signature relation `(verb, source_type, target_type)` plus any explicit forbidden
or property overrides needed to make C6 unconstructible behavior checkable. R3 reconciles the accepted
edge-law rulings before restating the canonical count: collapse or deprecate `enforces-cross` as a separate
verb and encode cross-feature as metadata on `enforces`; widen `applies` to `Policy -> {Operation,
Calculation}`; reconcile `queries` as the accepted `Behavioral -> Entity` source widening or revise the
decision; decide whether `Operation -> ValueObject` returns is a new verb or a signature/property; and
decide the Event payload/publisher composite. Fold in the novice-use handoff decisions: either add an
Entity-to-Entity association/reference signature or explicitly keep associations field-table-only, and
either connect Saga or fold Saga into Workflow plus cross-feature metadata.

*Semantic acceptance:* `validate:rels` rejects any declared edge whose `(verb, source_type, target_type)`
is absent from the allowed relation or present in forbidden overrides; at least one bad-endpoint fixture is
rejected as `unconstructible-edge`; C11 is named as the check side; the final canonical edge count is the
post-reconciliation count, not a precommitted `>29`.
```

Also update D4 to say:

```markdown
**D4 - Edge-signature authority form.** Choose whether `RELATIONSHIPS.md` itself is a strictly parsed
signature table or whether a companion machine file is authoritative. Either way, `RELATIONSHIPS.md`
must expose the human-readable law and the validator must consume the same finite relation.
```

## P2 - Batch-1 Work-Pack

Target: `development/reformulate-batch1/WORK-PACK.md`

Patch R3 acceptance:

- Replace "R3-P1/P2/P3 catalog-coverage additions" as mandatory additive edges with "decision-led
  reconciliation of R3-P1/P2/P3 plus the novice-use R3-F5/R3-F6 handoff."
- Replace "`canonicalEdges` total (>29 after R3-P1/P2)" with "post-reconciliation `canonicalEdges` total,
  explicitly recorded in `RELATIONSHIPS.md` and the validator output."
- Add two decision rows: Entity-to-Entity association/reference and Saga connectability/folding.
- Add the negative endpoint fixture requirement:

```markdown
**Endpoint-law proof:** include bad-endpoint fixtures for at least
`Operation --enforces--> Value Object`, `State Machine --enforces--> Operation`, a reversed edge, and a
wrong-target `queries` case. Each must fail in strict mode with an `unconstructible-edge`-class violation.
```

Patch R7:

- Replace `impl/spec/DEFINITIONS.md` and `impl/spec/DEFINITIONS-INDEX.md` as R7 write scope with
  `definitions/DEFINITIONS.md`, `definitions/DEFINITIONS-INDEX.md`, and `definitions/meta-types/*`.
- State that `impl/spec/meta-types/**/*.schema.yml` are machine criteria/evidence, not canonical
  definition cards.
- State that DS-D2 edge verbs and DS-D8 edge signatures remain R3-gated and must not be promoted before
  R3 reconciliation.

## P3 - Batch-1 Implementation Layering

Target: `development/reformulate-batch1/implementation-layering.md`

Patch L1 promotion evidence:

```markdown
`validate-relationships` must prove endpoint admissibility, not label membership only: every declared edge
joins through Concept Registry types and is accepted iff `(verb, source_type, target_type)` is in the
authoritative relation.
```

Patch L2 R7:

```markdown
R7 creates or updates root `definitions/` read models for DS-D1/DS-D2/DS-D8, while `impl/spec/meta-types/`
schemas remain validator-loaded machine evidence.
```

## P4 - Meta-Type Formalization

Targets:

- `development/meta-type-formalization/DESIGN.md`
- `development/meta-type-formalization/WORK-PACK.md`

Patch MT3 / DS-D8 wording:

```markdown
MT3b is not "29 signatures" by default. It consumes the post-R3 signature relation, including any collapse,
widening, rejected edge, or property decision. The validator proves DS-D8 by rejecting absent or forbidden
endpoint triples. It also checks that each meta-type schema's `edge_participation.source_of` and
`edge_participation.target_of` slices agree with the reconciled signature table.
```

Patch MT4 acceptance:

```markdown
`validate-content` may delegate edge-law checks to `validate:rels`, but the aggregate validation must have
one live path that checks endpoint signatures over whole aspect files. A node-only pass with `0 concept(s)`
checked is not R3 acceptance evidence.
```

## P5 - Meta-Type Definitions

Targets:

- `development/meta-type-definitions/WORK-PACK.md`
- `development/meta-type-definitions/CANDIDATES.md`

Patch DD2:

```markdown
14 backend meta-types -> `DS-D1.<n>` cards citing their `.schema.yml`; canonical cards land in root
`definitions/DEFINITIONS.md` and `definitions/DEFINITIONS-INDEX.md`, not `impl/spec/DEFINITIONS.md`.
```

Patch the DS-D8 / `domainspec-v2-D9` wording:

```markdown
`DS-D8` names the domain edge-signature surface produced by R3. `domainspec-v2-D9` is a method/framework
definition for "edge-participation signature" only if retained; it must cite `DS-D8` rather than alias it
silently in schemas. If both terms stay, add an explicit "method term -> domain artifact" relation.
```

## P6 - Root Definitions

Targets:

- `definitions/DEFINITIONS.md`
- `definitions/DEFINITIONS-INDEX.md`

No immediate canonical promotion. Optional cross-link only:

```markdown
R3 review source: development/reformulate-batch1/reviews/2026-07-02-r3-edge-law-formalization/findings.md
```

Do not add DS-D2 or DS-D8 rows until R3 has chosen the signature surface and final canonical count.

## P7 - Relationships Spec

Target: `impl/spec/RELATIONSHIPS.md`

Choose one authority form.

Option A: make `RELATIONSHIPS.md` strictly parsed:

```markdown
## Authoritative Edge Signatures

| Edge | Source type(s) | Target type(s) | Feature scope | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| `enforces` | Rule | Operation | same-feature or cross-feature | active | Cross-feature is represented by feature metadata, not a separate verb. |
| `applies` | Policy | Operation, Calculation | same-feature | active | Widened target set per edge-law admissibility. |
| `queries` | Query, Calculation, Operation | Entity | same-feature | pending-owner | Use only if R3 confirms Behavioral -> Entity source widening. |
```

Option B: add a companion machine file, for example:

```text
impl/spec/relationships.signatures.yml
```

If Option B is chosen, `RELATIONSHIPS.md` must name that file as authoritative for validation and mirror its
status/count summary.

Required behavior either way:

- No unqualified "29 typed edges" claim after reconciliation unless 29 is still true.
- `enforces-cross` is collapsed/deprecated or explicitly justified as code-distinct.
- `applies`, `queries`, `Operation -> ValueObject`, Entity-to-Entity association, Saga, and Event
  payload/publisher are resolved.
- Forbidden/unconstructible behavior is described as validator-enforced endpoint closure.

## P8 - Relationship Validator

Target: `impl/tools/validate-relationships.ts`

Implement endpoint-aware strict mode:

1. Parse allowed edge signatures from the chosen authority surface.
2. Build a Concept Registry type catalog for every feature spec.
3. Parse declared graph rows into source, edge, and target concept ids.
4. For each declared edge:
   - reject non-canonical label,
   - reject unknown source/target concept id,
   - reject missing endpoint signature,
   - reject forbidden endpoint override,
   - emit `unconstructible-edge` or a similarly stable violation class.
5. Preserve `--mode warn|strict`.

Reuse precedent from `impl/governance/tags/tools/lib/code-tag-rules.ts` where it already parses
`From -> To` into endpoint rule sets.

## P9 - Content Validator And Tests

Targets:

- `impl/tools/validate-content.ts`
- `impl/tools/tests/validate-content.test.ts`
- new or existing relationship test fixture(s)
- `impl/spec/features/sample/SPEC.md` or a dedicated fixture under `impl/spec/__fixtures__/`

Required tests:

- valid allowed endpoint passes,
- `Operation --enforces--> Value Object` fails,
- `State Machine --enforces--> Operation` fails,
- reversed endpoint fails,
- wrong-target `queries` case fails.
- `operation.schema.yml` cannot claim Operation is source of `performs` or `emits` when the reconciled
  relationship table says those are Entity-sourced.

The aggregate validation may be either:

- `validate-content` directly performs edge checks, or
- `validate-content` delegates to a shared signature checker also used by `validate-relationships`.

## P10 - Package Scripts

Target: `impl/package.json`

After endpoint tests are green, update:

```json
"validate": "npm run validate:docs && npm run validate:rels && npm run validate:content && npm run tools:test && npm run engine:lint"
```

Do not wire this before discriminating bad-endpoint tests pass, or `validate` will appear stronger than it is.

## Acceptance For Applying This Proposal

The apply run passes when:

- R3 design/work-pack/layering no longer contain stale count-led `>29` acceptance.
- Entity-to-Entity association/reference and Saga connectability/folding decisions are recorded.
- R7 routing consistently names root `definitions/`.
- DS-D8 and `domainspec-v2-D9` are role-clean.
- `RELATIONSHIPS.md` or its companion machine file exposes a finite signature relation.
- `validate:rels` rejects bad endpoint triples.
- schema `edge_participation` slices match the finite signature relation.
- `validate:content` or aggregate validation has a live whole-feature endpoint check path.
- `npm run tools:test`, `npm run validate:rels`, and the final aggregate gate pass.
