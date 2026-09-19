---
node_type: task-session-handoff
is_session: true
status: ready
created: 2026-07-02
owner_route: task-session
source_refresh: ./REFRESH-REPORT.md
target_swu: SWU-R3A
---

# One-Pass Task Manifest - SWU-R3A

## Objective

Implement R3 relationship authority as one bounded pass:

```text
root relationship authority -> implementation projection -> endpoint validator -> fixtures -> aggregate gate
```

## Write Scope

Allowed:

- `projects/domainspec-v2/development/reformulate-batch1/DESIGN.md`
- `projects/domainspec-v2/development/reformulate-batch1/WORK-PACK.md`
- `projects/domainspec-v2/development/reformulate-batch1/implementation-layering.md`
- `projects/domainspec-v2/development/meta-type-formalization/DESIGN.md`
- `projects/domainspec-v2/development/meta-type-formalization/WORK-PACK.md`
- `projects/domainspec-v2/development/meta-type-definitions/WORK-PACK.md`
- `projects/domainspec-v2/development/meta-type-definitions/CANDIDATES.md`
- `projects/domainspec-v2/definitions/relationships/`
- `projects/domainspec-v2/impl/spec/RELATIONSHIPS.md`
- `projects/domainspec-v2/impl/spec/meta-types/**/*.schema.yml`
- `projects/domainspec-v2/impl/tools/`
- `projects/domainspec-v2/impl/spec/__fixtures__/` or equivalent test fixtures
- `projects/domainspec-v2/impl/package.json`

Not allowed in this pass:

- Promoting DS-D2 or DS-D8 rows before root signatures exist.
- Formalizing full category laws.
- Editing v1 `implementation/domainspec/`.
- Touching engine private `src/rules` internals.

## Locked Decisions

- Root owns DomainSpec language authority.
- Relationship authority path is `definitions/relationships/`.
- Validators read root `relationships.yml` directly.
- Implementation `RELATIONSHIPS.md` is projection/view.
- Entity-to-Entity semantic relation family is first-class.
- `owns` and `belongs-to` are refined now.
- `owned-by` is generated inverse navigation for `owns`.
- `belongs-to` is not automatically `owns^-1`.
- `depends-on` is deferred.
- Saga is first-class: `Saga --[orchestrates]--> Operation[]`.
- `Operation --[produces]--> Event` and `Entity --[emits]--> Event` are distinct.
- `Operation --[emits]--> Event` is invalid.
- Human notation is display only.
- R3 is a typed composable graph fragment, not full category law.

## Implementation Steps

1. Patch planning artifacts:
   - Remove stale `>29` acceptance.
   - Replace implementation-local relationship authority with root authority.
   - Route R7 definition cards to root `definitions/`.
   - Record DS-D2/DS-D8 promotion as post-R3A.

2. Create root relationship authority:
   - `definitions/relationships/relationships.yml`
   - `definitions/relationships/relationships.md`
   - include post-reconciliation count.

3. Normalize signatures:
   - collapse `enforces-cross` into `enforces` plus cross-feature metadata unless distinct code is proven.
   - widen `applies` to `Policy -> {Operation, Calculation}`.
   - normalize `queries` to the accepted Behavioral-to-Entity source shape.
   - represent Operation returns to Value Object as a property unless distinct edge evidence is introduced.
   - add `owns`, `belongs-to`, generated `owned-by`, and Saga orchestration.
   - enforce `produces` / `emits` split.
   - record Event payload/publisher composite residue.

4. Rewrite implementation projection:
   - `impl/spec/RELATIONSHIPS.md` names root authority.
   - It mirrors signature count and human notation.
   - It is not validator authority.

5. Implement validator:
   - root YAML loader.
   - Concept Registry type catalog.
   - graph edge parser.
   - endpoint admissibility check.
   - generated inverse policy check.
   - stable `unconstructible-edge` violation class.
   - warn/strict modes preserved.

6. Add tests and fixtures:
   - valid `Rule --[enforces]--> Operation`.
   - invalid `Operation --[enforces]--> Value Object`.
   - invalid `State Machine --[enforces]--> Operation`.
   - reversed allowed edge.
   - wrong-target `queries`.
   - invalid `Operation --[emits]--> Event`.
   - valid `Entity --[emits]--> Event`.
   - valid `Operation --[produces]--> Event`.
   - valid `Saga --[orchestrates]--> Operation[]`.
   - schema edge-participation consistency for Operation.

7. Wire validation:
   - add content/delegated whole-feature endpoint path.
   - update `impl/package.json` aggregate validation only after tests are discriminating.

## Verification Commands

Run from `projects/domainspec-v2/impl` unless noted:

```bash
npm run validate:rels
npm run validate:content
npm run tools:test
npm run validate
npm run engine:test
```

Run from repo root:

```bash
git diff --check -- projects/domainspec-v2
```

## Acceptance

- New root relationship authority exists and parses.
- The human companion and implementation projection agree on the count and signature names.
- Invalid endpoints fail in strict mode.
- Valid Entity/Saga/Event examples pass.
- `depends-on` is visibly deferred.
- Event composite residue is named.
- DS-D2/DS-D8 promotion is not claimed prematurely.
- All verification commands pass or any failure is recorded with a concrete blocker.
