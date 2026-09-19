# Design Context — BTE graph-to-proof architecture

Status: strict context accepted for Invoke `design` on 2026-07-22
Mode: deep; strict
Authority: none; evidence selection only
Runtime handoff: not requested

## Context Boundary

The selected surface is the DomainSpec v2 BTE package and the exact current
machine/code paths it must replace or extend. Audit, research, Inventory,
X-Ray, EVF, and Markdown planning are evidence only. Machine semantic sources
and accepted owner decisions retain their existing authority.

The existing audit-002 context pack was used as the discovery floor. This
Design context replaces its proposal-only output restriction with the user's
explicit authorization to author Design-stage artifacts at the BTE package
root. It does not authorize Plan/work-pack regeneration or implementation.

## Design Obligations

| ID | Obligation | Selected evidence | Coverage |
| --- | --- | --- | --- |
| `CTX-DES-001` | provide all six architecture views and a bounded claim | Define, Requirements, architecture template | covered |
| `CTX-DES-002` | preserve Option 2, current v1, successor identity, and explicit JSON retirement/migration | formation decision, FPR-02 decision, current profile/compiler/schemas | covered |
| `CTX-DES-003` | make exact 13-kind, 16-criterion, and required-structure proof non-collapsible | kind/YAML registries, Requirements, audit 002 | covered |
| `CTX-DES-004` | design independent edge sources and exact 16-family causal relationship proof without silent expansion | FPR-02 decision, relationship registry, resolver/compiler | covered |
| `CTX-DES-005` | keep one canonical minted graph and exact provenance as BTE input | graph/manifest schemas, compiler, ontology findings | covered |
| `CTX-DES-006` | freeze independent O_spec, exact projection, TestCase/Result separation, binding, and evaluator boundaries | Requirements, EVF design, legacy-engine audit | covered |
| `CTX-DES-007` | freeze clean mutation, receipt/replay, failure precedence, and fail-closed aggregates | Requirements, current receipt/replay patterns, engine evidence | covered |
| `CTX-DES-008` | keep IOLM and Body War independent consumers and UI a separate lane | FPR-02 decision, Define/Requirements | covered |
| `CTX-DES-009` | produce glossary consistency, risks/interfaces, layering seed, and Plan-only handoff | Invoke Design contract and selected template | covered |
| `CTX-DES-010` | separate reuse/extension/replacement from speculative module proliferation | kernel, adapter, compiler, legacy rules/bindings/emitter | covered |

Coverage is `10/10`; no outcome-changing clarification was required.

## Selected Sources

| # | Source | Selected use | Authority posture |
| ---: | --- | --- | --- |
| 1 | `backend-type-test-engine-completeness/DEFINE.md` | bounded claim, objects, invariants | approved Design input; Markdown non-authority |
| 2 | `backend-type-test-engine-completeness/REQUIREMENTS.md` | stable acceptance contract | approved Design input; Markdown non-authority |
| 3 | `backend-type-test-engine-completeness/GLOSSARY.md` | existing human meanings | explanatory only |
| 4 | `backend-type-test-engine-completeness/decisions/DEC-BTE-FORMATION-AUTHORITY-001.md` | accepted Option 2 | accepted decision evidence |
| 5 | `first-production-release/decisions/2026-07-17-fpr02-supported-profile-decision.md` | accepted profile, topology, node/relationship causal standards, consumers | accepted decision evidence |
| 6 | `backend-type-test-engine-completeness/work-pack/shared/GAPS.md` | surviving implementation residue | gap ledger, not design authority |
| 7 | `refreshes/2026-07-21-contract-completeness-audit-002/REFRESH-REPORT.md` | false-green and completeness audit | accepted review evidence only |
| 8 | `development/evolvable-validation-framework/DESIGN.md` | narrow object-role precedent | design evidence, not BTE authority |
| 9 | `definitions/meta-types/meta-types.yml` | exact backend kind and declared value domains | semantic registry owner |
| 10 | `definitions/relationships/relationships.yml` | relationship signatures/order/scope | semantic registry owner |
| 11 | `definitions/minted-project/supported-profiles.yml` | current profile declarations/serialization | profile registry owner |
| 12 | `impl/spec/minted-project/node.schema.json` | current-v1 node/connections envelope | current-v1 machine contract |
| 13 | `impl/spec/minted-project/graph.schema.json` | current graph shape and derived posture | current-v1 machine contract |
| 14 | `impl/spec/minted-project/source-manifest.schema.json` | current provenance shape | current-v1 machine contract |
| 15 | `impl/spec/meta-types/structural/entity.schema.yml` | Entity structure/criteria and false-green target | semantic formation source |
| 16 | `impl/spec/meta-types/structural/value-object.schema.yml` | equality gap | semantic formation source |
| 17 | `impl/spec/meta-types/connective/interface.schema.yml` | closed-domain gap | semantic formation source |
| 18 | `impl/spec/meta-types/connective/mapping.schema.yml` | closed-domain gap | semantic formation source |
| 19 | `impl/tools/lib/meta-type-criteria.ts` | proven kernel behavior/limits | implementation under test |
| 20 | `impl/tools/minted-project/meta-type-body-adapter.ts` | YAML adapter behavior/limits | implementation under test |
| 21 | `impl/tools/minted-project/resolver.ts` | current source-discovery limits | implementation under test |
| 22 | `impl/tools/minted-project/compiler.ts` | formation bypass, graph/provenance path | implementation under test |
| 23 | `impl/test-derivation-engine/src/bindings/index.ts` and `src/roundtrip/index.ts` | first-match and superset behavior to replace | compatibility implementation evidence |
| 24 | `impl/test-derivation-engine/src/emit/tests.ts` and `src/minted-project/conformance-receipt.ts` | skip/todo and receipt/replay limits | compatibility implementation evidence |

## Selection Conclusions

- Keep the deterministic minted compiler, graph/manifest provenance pattern,
  criterion kernel, and body adapter as narrow reusable implementation seams.
- Version the successor source/compiler contracts instead of mutating v1.
- Extend the existing test-derivation engine with a minted BTE path; do not
  declare the Markdown parser, legacy IR, first-match bindings, tolerant
  comparator, or todo/skip emitter to be BTE contracts.
- Use EVF only for object-role guidance. The BTE Design owns its exact
  denominators, independence rules, and evidence chain.

## Excluded Sources And Reasons

- Existing `PLAN.md`, `IMPLEMENTATION-LAYERING.md`, `WORK-PACK.md`, and execution
  dispatches are stale after audit 002 and are excluded as design authority.
  They remain historical inputs for later regeneration only.
- X-Ray is explanatory inference, not a machine or Design source.
- Research findings support the one-graph boundary but cannot define language
  semantics, profile membership, or test outcomes.
- Consumer Markdown cannot substitute for IOLM or Body War machine contracts.
- UI artifacts are outside the backend lane.

## Blocker Check

No unanswered choice prevents architecture authoring. Profile and relationship
admission, machine catalogue freezes, consumer execution, and lifecycle
promotion remain named owner gates, not hidden Design questions. Invoke Plan
must preserve those gates and cannot report a passing terminal core before they
are resolved.
