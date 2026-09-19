---
node_type: context-pack
is_session: true
status: complete
created: 2026-07-02
task: SWU-R3A
mode: lean
strict_coverage: pass
---

# Context Pack - SWU-R3A

## Task

Implement R3 as one bounded authority-plus-validator pass:

```text
root relationship authority -> implementation projection -> endpoint validator -> fixtures -> aggregate gate
```

## Obligations

| id | obligation | controlling evidence | status |
| --- | --- | --- | --- |
| O1 | Use root relationship authority, not implementation-local authority. | `governance/edge-signature-authority-decisions.md` AUTH-1..4 | covered |
| O2 | Promote Entity-to-Entity semantic relations and first-class Saga signatures. | `edge-signature-authority-decisions.md` EDGE-1/EDGE-2 | covered |
| O3 | Apply first-class category promotion constraints and inverse policy. | `research/2026-07-02-first-class-category-boundary/findings.md` | covered |
| O4 | Replace count-led `>29` R3 acceptance with decision-led reconciliation. | R3 review findings F2; one-pass refresh proposal | covered |
| O5 | Make endpoint validation closed-world over `(verb, source_type, target_type)`. | R3 review findings F1/F3; manifest endpoint-law proof | covered |
| O6 | Keep DS-D2/DS-D8 promotion after R3A; route definitions to root. | R3 review F4; meta-type definitions work-pack drift | covered |
| O7 | Preserve moat and v1 boundaries. | repository AGENTS instructions; task manifest not-allowed list | covered |
| O8 | Validate via relationship/content/tools/aggregate/engine gates. | `ONE-PASS-TASK-MANIFEST.md` verification commands | covered |

## Selected Evidence

- `refreshes/2026-07-02-r3-one-pass-implementation-refresh/ONE-PASS-TASK-MANIFEST.md`
  - Controls objective, write scope, locked decisions, steps, validation commands.
- `refreshes/2026-07-02-r3-one-pass-implementation-refresh/REFRESH-PATCH-PROPOSAL.md`
  - Controls patch shape and acceptance criteria.
- `governance/edge-signature-authority-decisions.md`
  - Resolves root authority, direct root read, Entity family, and Saga first-class decisions.
- `research/2026-07-02-first-class-category-boundary/findings.md`
  - Controls promotion rubric, `owns` / `belongs-to` inverse policy, `depends-on` deferral, `produces` / `emits` split.
- `reviews/2026-07-02-r3-edge-law-formalization/findings.md`
  - Controls endpoint validation, count-led drift, fixture requirements, and definition routing.
- `research/2026-07-01-composability-edges-taxonomy-synthesis.md`
  - Controls R3-P1/P2/P3 handling: `queries` source widening, Operation-return as property, Event composite residue.
- `impl/spec/RELATIONSHIPS.md`
  - Current projection target and stale 29-label table to replace.
- `impl/tools/validate-relationships.ts`
  - Current label-only validator to replace with root signature checking.
- `impl/tools/validate-content.ts`
  - Current node validator to extend with relationship validation.
- `impl/tools/tests/validate-content.test.ts`
  - Existing black-box CLI testing idiom to mirror.
- `impl/spec/meta-types/**/*.schema.yml`
  - Edge participation evidence to synchronize against root signatures.
- `impl/spec/features/financial-settlement/SPEC.md`
  - Existing real feature pack to make endpoint validation non-vacuous.

## Constraints

- Do not edit `implementation/domainspec/` v1.
- Do not touch engine private `src/rules` internals.
- Do not promote DS-D2 or DS-D8 rows before R3A authority lands.
- Do not formalize full category laws in R3A.
- Keep edits inside the SWU write scope.
- Existing unrelated dirty worktree entries are not reverted.

## Decisions

No human blocker remains. Implementation decisions inside the pass:

- Use JSON-compatible YAML for `relationships.yml` so the validator can parse it dependency-free.
- Represent multi-source / multi-target signatures as one canonical signature row with `source_types` or `target_types`.
- Treat `owned-by` as a generated inverse view, not a canonical input edge.
- Keep Event payload/publisher composite as named residue.

## Validation Surface

Run from `projects/domainspec-v2/impl`:

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
