# Descriptor-bound Query generation

Date: 2026-09-09. PCR-06 product construction. Authority effect: none.
This candidate advances the full working-CLI goal; it is not public entry-point
integration, profile admission or a completed 13-type/39-realization matrix.

## Implemented behavior

`planConfiguredQueries` joins a registered composition boundary to a registered
exact field compilation from the same checked graph. Selection binds both
digests, exact Query roots, TypeScript, the existing exact UInt64 realization
and a portable module root. Missing, stale, cross-graph, fabricated or accessor-
backed selections reject. Sources are not reread and planning writes nothing.

The pinned configuration's DSR-009/011 prerequisites are satisfied for this
planner by those explicit checked inputs. The old configuration blockers and
profile status fields are not edited. Each selected Query emits:

```text
commerce/features/alpha/src/application/queries/
  read-amount.provider.ts   typed read-only arrow and static value normalization
  read-amount.ts            frozen callable with immutable descriptor binding
```

The descriptor binds the authored Query/source contract, the exact source Entity
and its complete field perimeter, output projection and types, parameters,
filter/order/limit, field-model digest, numeric profile, provider bytes and
descriptor digest. The provider and binding artifacts are separate to avoid a
self-referential content hash. Native compilation also emits usable declarations.

The callable consumes **explicitly supplied Entity data rows**, not a storage
connection. It normalizes parameters and complete rows, filters them, applies
declared stable ordering and a limit, and returns exactly the declared projection.
No database connection, implicit reference resolution, Calculation, Rule or
Operation is executed. A Query result is a read model, not a newly constructed
Entity, ownership assertion or invariant-validation receipt.

## Structured values and semantic distinctions

The Query renderer reuses the existing structured-value normalizers and equality
rules. The static type specializer was extracted into `configured-value-types.ts`;
the Rule renderer now calls that shared implementation. Before and after the
extraction, a complex Entity/VO/Enum/optional/list/set Rule fixture emitted the
same **7,931 bytes**, SHA-256:
`f3b6c9a9a4394b95705644458819c05dbb6bdc4557d477ad75eb03809c3cffb9`.
That byte-level check is retained as a regression test.

Named values retain their declared roles: Entity equality uses identity; Value
Object equality uses all fields; Enum/sum tags and payloads remain distinct.
Lists preserve order and repeated occurrences. Sets reject duplicate elements
under the declared equality and normalize to canonical order. Optional omitted
data fields normalize to null. Full-width UInt64 values remain bigint throughout
filtering and projection, including nested records and sum payloads.

Query row occurrences are **not deduplicated by Entity identity**. Two supplied
rows with the same ID and different data both remain eligible. Stable ordering
preserves their input occurrence order when sort keys tie. Output lists, objects,
and all nested values are frozen copies; caller objects are neither mutated nor
frozen. Optional, collection, Entity and Value Object roles are not flattened
into a database schema or a generic record metatype.

Filter operands must have exactly matching checked types. Equality uses their
declared value equality. Ordered comparisons accept required scalar values:
UInt64 numeric order, String UTF-16 code-unit order and Bool false-before-true.
There is no string/number coercion, implicit optional unwrapping or invented
ordering for optional/structured values. Those ambiguous inputs reject during
planning, rather than inheriting accidental JavaScript comparison behavior.
`all`, `any`, `not`, `eq`, `lt`, `lte`, `gt` and `gte` lower to direct expressions;
no Query AST or schema interpreter is emitted.

Every declared parameter and full source row is checked, including unused fields
and rows later filtered out. The descriptor therefore declares the full Entity
field read perimeter, not only projected fields. Plain/null-prototype data and
dense plain arrays are supported. Missing required fields, coercible values,
accessors, extra/hidden/symbol fields, sparse arrays, invalid tags, duplicate set
members and out-of-range values reject with `QUERY_INPUT`. These checks do not
execute referenced Value Object invariants; a false invariant fixture confirms
the distinction.

## Validation and evidence limits

- Final focused Query suite: **7/7 PASS**, zero failures/skips, **24.45 seconds**.
- Source typecheck and frozen catalog/relationship/integration-profile checks:
  **PASS**.
- Final sixteen-suite shared regression: **237/237 PASS**, zero failures or
  skips, **396.60 seconds**. It covers Query, Calculation, composition boundary,
  factories, Enums, checked fields/reference model, configuration, Rules and
  structured Rules, profiled projects, project model, exact UInt64 and typed
  contract/hardening/Rust suites. The final hashes below identify the tested bytes.

Native tests compile emitted TypeScript and declarations with the pinned
TypeScript 7.0.2 image, then execute its JavaScript. Coverage includes all filter
operators, no-match/empty input, ascending/descending sorting, stable ties,
limits, maximum-width values, distinct Unicode representations, Entity versus
VO equality, optional absence, list occurrences and order, Enum/sum payloads,
fully frozen nested results, caller nonmutation, source relocation and root/layout
orthogonality. Two fresh processes fully serialize the same nested result.

The independent native AST observer receives expected inputs, predicates,
ordering and projection from authored test contracts, not from generator claims.
It checks the pinned common normalization support, the declared Query body and
output shape, planned top-level forms and the allowed call/write perimeter of
specialized normalizers. It rejects ambient/dynamic dependencies and deferred
work. Ten changed providers still compile but fail observation: changed filter,
limit, projected field, ordering, clock read, global write, queued work,
prototype mutation, alias freezing and a nested field-normalizer write.

Caller preservation and one instrumented input independently observe no source
write attempts, and every returned data descriptor is consumed recursively.
This is bounded inert-data/native-source evidence, **not** purity for arbitrary
Proxies, modified JavaScript realms, arbitrary generated TypeScript or OS-wide
interception. The static-source candidate does not turn historical fixed Query
proofs or metadata-only claims into broader conformance.

## Exact source identities

| Source | SHA-256 |
| --- | --- |
| `impl/cli/src/generation/configured-queries.ts` | `e955dd414b7312b52b97ecc07aef40416756a4ee5732363517cd3fab6567e1c3` |
| `impl/cli/src/generation/configured-query-source.ts` | `f87f13a6775c6eb055fc5ee3245aa986538132d32f8631ea83efda93c6781e01` |
| `impl/cli/src/generation/configured-value-types.ts` | `de272326b742bc53a67ce5cf14230aea439d995bfe10c7fa63ffa4637ab41133` |
| `impl/cli/src/generation/configured-rule-values.ts` | `1c917cb304c194a154dcbd9e71eabd0e0b8ddde607d22441931e90e0fc479c3f` |
| `impl/cli/test/generation/configured-queries.test.ts` | `7e9d9385a335c2ece14dd88d9cad908b826556e07b2fa1061ac1609dc15e5126` |
| `impl/cli/tools/observe-configured-queries.mjs` | `a483cf309e98d6f621ea0c42626c289b87ab7e02d3b5a5b235fbbd11520fcdbc` |
| `query-generation-contract.json` | `c37a4381968da074391f78fc0abdb60c0edfe8fcb0bec0c3efc55a55f85c51f6` |
| `../ontology/query-generation-candidate.json` | `ab25b45e5d4a5a0bdbde0490e2c91a64127774751920de30b99175e52052c085` |

## Task-session record and remaining work

Context-builder selected the full CLI completion ledger, PCR configuration and
profiles, DSR-009/011 checked field/boundary contracts, Query decoder and graph
validation, the shared value renderer, and existing Rule/factory/native observer
tests. The current TypeScript Query overlay and its W2 decision selectors fix
the descriptor-bound, read-only, eagerly consumed output obligation. The lean
context was expanded for the exact shared-renderer compatibility dependency.

Local execution, no subagents or runtime handoff. Existing user construction
authorization applies. ARE selected IMPLEMENT and direct context; its exact
eleven-file effect assessment was admissible with no additional owner gate.
No blocker-level decision was needed. The native shared renderer was chosen
over an independent duplicate to keep the already tested field equality intact.
No operational effect, admission, old-profile reinterpretation or public default
was selected. Experiment harness is not applicable. Initial test-only fixture
errors (an existing node name and a missing Rule formal parameter) were repaired
without changing source acceptance.

The historical source/report hashes remain historical; this report records the
new shared-renderer bytes and fresh evidence. The current report and two ledgers
are synchronized, not historical work-item/admission records. Remaining work is
Mapping/Policy and orchestration generation, source-contract reconciliation,
Python/Rust parity, shared public entry points, compound commerce, compatibility
and clean-package verification. Dirty-byte preservation belongs to the
implementing agent; publication/admission/default cutover remain separately
owned and deferred operational work, not a blocker to the next prototype.
