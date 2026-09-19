---
task: SWU-FPR01003-SAMPLE-001
mode: standard
strict: true
status: pass
evidence_kind: task-session-context
created_at: 2026-07-17
---

# Context Pack — SWU-FPR01003-SAMPLE-001

## Objective

Normalize the technical sample fixture with the two table shapes required by the
engine, one explicit fixture concept, and no relationship rows. Do not relax the parser,
invent domain behavior, or promote a new canonical meta-type.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
|---|---|---|---|
| S1 | Add exact `Concept|Type` table headers. | task contract; normalized parser/tests | covered |
| S2 | Declare at least one concept so the structural engine run is non-vacuous. | parser fail-closed rule; isolated candidate parse | covered |
| S3 | Add exact `From|Edge|To|Source Evidence` headers without inventing an edge. | sample intent; parser behavior for empty table | covered |
| S4 | Keep the concept technical and avoid invented DS-D1 semantics. | sample role; active meta-type criteria; decision pack | covered |
| S5 | Keep `Fixture` local and non-authoritative. | definitions registry ownership; explicit sample note | covered |
| S6 | Preserve parser and engine code unchanged. | task write scope | covered |
| S7 | Prove deterministic lint, parser tests, docs, and content compatibility. | CLI/package scripts; validator behavior | covered |
| S8 | Write only the sample and this run directory. | task contract | covered |

Coverage: 8/8, 100 percent. Blockers: none. Fallback search: none.

## Selected Evidence

| Source | Selector | Obligations |
|---|---|---|
| `TASK-FPR01-003-REMEDIATION.md` | sample SWU scope, exclusions, criteria, validation | S1-S8 |
| guard SWU PASS receipt | predecessor proof and separate write scope | S8 |
| `impl/spec/features/sample/SPEC.md` | fixture purpose and no-relationship statement | S2-S4 |
| `grammar/index.ts#parseNormalizedSpec` | exact headers, non-empty concept rule, empty graph-table behavior | S1-S3, S6 |
| `grammar/normalized-spec.test.ts` | missing-table and undeclared-endpoint negatives | S1-S3, S7 |
| `definitions/meta-types/meta-types.yml` | canonical DS-D1 ownership and active criteria | S4-S5 |
| `tools/validate-content.ts` | unknown/local types are not treated as formalized DS-D1 criteria | S5, S7 |
| `test-derivation-engine/src/cli.ts#runLint` | lint target and violation exit behavior | S7 |
| `impl/package.json` | `engine:lint`, `validate:docs`, `validate:content`, `validate`, `typecheck` commands | S7 |

## Isolated Candidate Proof

Candidate:

```markdown
## Concept Registry

| Concept | Type |
| --- | --- |
| SampleValidationFixture | Fixture |

## Feature Concept Graph

| From | Edge | To | Source Evidence |
| --- | --- | --- | --- |
```

Observed in a temporary directory:

- parser violations: 0;
- structural nodes: 1 `SpecConcept`;
- structural edges: 0;
- derived obligations: 1 `spec-concept`; and
- workspace files changed: 0.

## Decision Pack

| Option | Short-term | Long-term/risk | Decision |
|---|---|---|---|
| Declare the fixture as `Entity` | Uses an active canonical label. | Invents identity semantics and would require an artificial identity table. | rejected |
| Declare a local `Fixture` technical type with an explicit non-authority note | Precisely describes the sample role and produces one structural obligation. | Content validator does not promote or formally validate this local type; the boundary must remain explicit. | selected |
| Add a dummy relationship row | Makes the graph non-empty. | Invents semantics and contradicts the fixture contract. | rejected |
| Relax parser requirements | Avoids fixture edit. | Weakens the normalized dialect globally. | blocked by write scope |

No blocker-level human decision remains.

## Write Scope

Allowed:

- `projects/domainspec-v2/impl/spec/features/sample/SPEC.md`
- `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01003-SAMPLE-001/`

Everything else is read-only, including parser, rules, tests, canonical definitions,
guard files, FPR01-003 receipt, Craft, roadmap, and production state.

## Validation Surface

1. Actual parse: zero violations, one concept, zero edges, one obligation.
2. `npm --prefix projects/domainspec-v2/impl run engine:lint` twice with equal output.
3. focused `normalized-spec.test.ts`.
4. `npm --prefix projects/domainspec-v2/impl run validate:docs`.
5. `npm --prefix projects/domainspec-v2/impl run validate:content`.
6. retired-reference guard remains green.
7. scoped diff hygiene.
