# L0 candidate compilation contract

Status: candidate implementation selection; authority effect: none.
Scope: PCR-02, TypeScript Entity + Rule + Query. The existing compiler remains
the only DomainSpec parser and graph checker. No AlchLang or default CLI change.

## Context pack and controlling evidence

| Obligation | Selected evidence and interpretation |
| --- | --- |
| Meaning and reuse | [Source matrix](evidence/source-matrix.json): 39 baseline cells, current source/provider/binding bytes; historical observer drift recorded separately. |
| Factory, not class | [Entity decision](../../ontology-form-decisions/decisions/W1-ENTITY-001.json), selected validated extensible factory; [reference](../../../impl/architecture-conformance/targets/typescript/entity-v1.ts), validation before all construction routes. |
| Rule and Query | Existing typed-rule/v1 and typed-query/v1 schemas and checked graph closures. Rule Boolean; Query explicit read snapshot. |
| Physical paths | [TypeScript profile](../../implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json), rule-location and filename constraints; [accepted envelope](../../output-layout/acceptance-v1/README.md) remains unchanged. |
| Progression | [Plan](PLAN.md), PCR-01..04 and L0 exit evidence. Other metatypes/languages are deferred from this prototype, not deleted from the 39-cell product denominator. |

Context-builder mode: lean, selector-scoped, no delegation. Selected evidence
covers this slice; broader profile admission and fixture replay are not claimed.
The historical Rule observer digest has drifted. It is not used as an oracle;
the candidate has a new generated-target observer and fresh native tests.

## Resolved decisions

- PCR-D01: use exact current base and TypeScript profile bytes as candidate
  constraints, with the frozen catalog as realization-reference identity.
  Candidate document status never overwrites baseline admission or vice versa.
- PCR-D02: a selected module root contains `src/domain/entities`,
  `src/domain/rules`, `src/application/queries`. Rule source.path is measured
  relative to that module root. This is an opt-in L0 layout, not a modification
  of application-layout/v1. L0 rejects cross-feature graphs and path collisions.
- PCR-D04: an explicit `domainspec.profiled-project-selection/v1-candidate`
  carries language, source root, exact profile digests and factory bindings.
  Unknown keys/versions, stale profiles and unsupported overrides fail closed.
  Existing realizationProfile and outputLayout settings retain their meaning.
- PCR-D06: proof providers remain fixture-only references. Fresh emitters and
  observation are parameterized by checked declarations; no receipt repair.

## Factory binding and native behavior

A selection binds an Entity selector to a declared Rule selector and its named
parameter. This is an implementation binding, not a new DS-D8 graph edge.
The Rule parameter must name that Entity. Query source must have a checked reads
edge. Unbound factories, unrelated bindings and implicit fallback are rejected.

L0 input envelope: inert own-data records containing required String/Bool scalar
fields, exactly one identity field (the current graph parser's constraint), no
nested fields or identity coercion. Composite identity from the reference
protocol remains a DSR-009/PCR-05 obligation; this slice does not certify that
whole reference protocol.
The compiler rejects unsupported authored forms before emitting artifacts.
This does not reduce support of the existing generator or promise arbitrary
JavaScript getters/Proxy inputs. These broader fields remain PCR-05+ obligations.

Entity output is one exported arrow factory. It closes over its declared Rule,
returns frozen snapshots and provides create/reconstruct/transition through one
validation path. Failure returns `{ok:false,value:null,failure_codes}`. Transition
preserves identity. Snapshot equality/hash use typed identity only. Additional
validation can be appended immutably; extension cannot replace the bound Rule.
Inputs are copied before validation and contain no extra fields. There is no
public constructor or raw snapshot-building export.

Rule output is one Boolean arrow with direct pure expressions. Query output is
one read-only arrow, imports the Entity snapshot type, consumes explicit rows,
and returns frozen projections. Relative imports resolve to planned leaf modules.
No storage, clock, randomness, network, hidden calculation or effect provider.

## Verification and claim limits

Tests include the old class output as an expected-red control, bypass/path/import
and profile mutants, native TypeScript compile plus JavaScript execution, two
output roots, repeatability, identity non-collapse and layout orthogonality.
The generated-target observer combines bounded lexical/form checks, the pinned
TypeScript 7.0.2 native AST API, and native behavior checks. It is not a universal
arbitrary-program semantic verifier, does not replace the historical observers,
and does not certify their fixture protocols.

## Open questions

Remaining input forms, language adapters, whole-project integration, broader
observer coverage and packaging belong to [PLAN.md](PLAN.md#9-open-questions-and-proposed-decisions).
L0 evidence must state precisely which of those obligations remain unclosed.
