# Synthesis revision 1/1

## Replacement decisions

| Previous synthesis decision | Exact replacement |
|---|---|
| Standalone `ImplementationProfile` registry | Rename to `ImplementationConformanceProfile` and build it as an extension or companion to `definitions/minted-project/supported-profiles.yml:1-69`. The existing registry remains profile-admission owner; no second registry. |
| New binding manifest as implementation-symbol authority | After its recorded v2 reformulation, source-local DomainSpec code tags conforming to `impl/governance/tags/CODE-TAG-SCHEMA.md:1-7,27-51` are the sole canonical implementation-symbol mapping owner. |
| Code tags and derivation sidecars as peer sources | Code tags own `(implementation symbol, DomainSpec concept, canonical edge)`. Derivation sidecars retain obligation selection, emitter strategy, fixtures, and coverage gaps. Their duplicated `module`/`symbol` fields must be derived from, or fail-closed reconciled against, the tag mapping and extraction digest. Evidence: `impl/test-derivation-engine/src/bindings/index.ts:1-6,30-81`; `bindings/financial-settlement.json:1-43,98-128`. |
| New `EnforcementObligation` and `EnforcementRuleSet` | Reuse existing content-addressed `ObligationKey`/`Obligation` and versioned `RuleSet` at `impl/test-derivation-engine/src/ir/types.ts:68-100` and `src/rules/index.ts:1-56,692-729`. Any widening requires that owner. |
| New transition derivation | Reuse existing valid/invalid transition obligations at `src/rules/index.ts:132-208`. `StateMachineRuntimeContract` may configure runtime fixtures, but application code retains transition execution, effects, and scheduling. Existing emitters already classify runtime coverage as `derivable-needs-harness`: `src/emit/spec.ts:41-67`; `src/emit/tests.ts:330-347`. |
| New general migration record | Reuse the active `IMPORT-MANIFEST.md:1-46,95-97` for code-tag, sidecar, profile, and binding reconciliation. Do not create a second migration ledger. |
| New generalized receipt system | Extend or reference the minted receipt/provenance pattern at `impl/tools/minted-project/views.ts:46-77,130-280` and `impl/spec/minted-project/build-receipt.schema.json:3-40`. Preserve raw native artifacts and diagnostic identities; do not copy foreign tool state into a replacement receipt system. |
| No existing suppression owner | Correct to: scoped code-tag waivers already have an owner and validation at `CODE-TAG-WAIVERS.md:1-40`, `validate-code-tags.ts:513-660`, and `code-tag-waivers.yaml:1-29`. General cross-tool exception acceptance remains unowned and deferred. |
| Shared evaluator as broad enforcement engine | Restrict it to normalization and reconciliation among code tags, supported profiles, derivation projections, existing obligations, native diagnostics, and owner-held receipt digests. It may emit agreement, disagreement, and residue. It may not compile, run tools, schedule CI, derive replacement obligations, execute state transitions, or replace existing receipts, waivers, or migration owners. |
| `cargo metadata` as Rust source-module graph | Kill that claim. Cargo metadata owns package dependency topology only. The bounded fixture may inspect explicit, macro-free `mod`/`use` syntax; `#[path]`, `cfg`, macro-generated modules, re-export ambiguity, dynamic linking, and runtime loading return `unsupported`, which fails admission. |
| DomainSpec-owned exhaustiveness checker | Kill it. `tsc`/`never`, mypy/`assert_never`, and rustc exhaustive `match` own exhaustiveness. DomainSpec only binds and normalizes their evidence against the selected canonical State Machine and profile. |
| Initial accepted-with-exception verdict | Kill it. The evaluator may validate exception-record completeness, but the underlying finding remains and no acceptance verdict exists until an authority owner defines it. |

## Canonical mapping rule

The repaired mapping chain is:

```text
canonical DomainSpec identity and relationship
  -> admitted minted semantic profile
  -> ImplementationConformanceProfile
  -> source-local canonical code tag
  -> generated/reconciled mapping index
  -> derivation binding projection
  -> existing Obligation and RuleSet
  -> native evaluator evidence
  -> minted-pattern EvaluationReceipt
  -> separate authority decision
```

Constraints:

1. `supported-profiles.yml` owns admission policy, not project symbols.
2. Post-reformulation code tags own source-symbol mapping.
3. Extracted indexes and future manifests are generated/reconciled projections.
4. Sidecars own fixture/emitter strategy, not production-symbol identity.
5. The minted compiler owns profile, registry, mapping-agreement, and digest validation: `impl/tools/minted-project/compiler.ts:287-453,574-629`.
6. The Import Manifest owns the one-time reconciliation and retirement of duplicated sidecar mapping fields.
7. Generated views and receipts remain evidence, never canonical source or promotion authority.

The current code-tag surface is still marked reformulation-pending by `IMPORT-MANIFEST.md:34-46`; therefore this is the selected intended owner after that migration gate, not a claim that current tag bytes are release-admitted.

## Repaired owner/verdict matrix

| Concern | Owner | Repaired verdict |
|---|---|---|
| Rule, Operation, State Machine, `enforces`, `transitions` | Existing DS-D1/DS-D2 definitions and relationship registries | `already-deployed`; reference only |
| Semantic profile admission | `definitions/minted-project/supported-profiles.yml` | `already-deployed`; conformance profile is `build-from-owned` |
| Consumer profile selection | `impl/spec/minted-project/project.schema.json:3-35,45` | `already-deployed`; consumer source, not authority |
| Implementation-symbol mapping | Post-v2-reformulation code tags | `selected-owner`, migration incomplete |
| Mapping indexes/manifests | Tag extractor/compiler projections | `generated/reconciled`, noncanonical |
| Derivation sidecars | Existing bindings owner | `already-deployed projection`; reconcile symbol fields |
| Obligations and derivation rules | Existing `Obligation` IR and versioned `RuleSet` | `already-deployed`; extend only through owner |
| Module topology | Profile-derived native configuration and bounded source analysis | `build-from-owned`; never parallel architecture authority |
| State exhaustiveness | Native TypeScript, mypy, and rustc compilers | `consume-and-normalize`; no duplicate checker |
| State transition obligations | Existing derivation engine | `already-deployed derivation`; runtime remains application-owned |
| Runtime guard/transition/effect intent | Application use case plus fixture harness | `proposed execution evidence` |
| Rust package topology | Cargo metadata | `already-deployed native owner` |
| Rust intra-crate source topology | Bounded explicit `mod`/`use` evaluator | `proposed`; unsupported constructs fail closed |
| Code-tag exceptions | Existing code-tag waiver lane | `already-deployed but migration-residual` |
| General exception acceptance | No selected owner | `DEFER` |
| Migration | Active Import Manifest | `already-deployed`; reuse |
| Provenance and receipts | Minted compiler/views/build-receipt pattern | `build-from-owned`; evidence only |
| Shared evaluator | Reconciliation/normalization only | `precedent-clean within boundary` |
| Authority/promotion | Existing owner routes and CAV2 boundary | External gate; never receipt-driven |
| Public Arcanum | Stable references and bounded summaries only | No private manifests, diagnostics, fixtures, or derivation logic |

## Revised six-term vocabulary

1. `ImplementationConformanceProfile`  
   Authored configuration referencing the existing semantic profile. Contains source classes, language realizations, evaluator references, exclusions, obligations, and claim limits.

2. `ImplementationBinding`  
   One code-tag-owned binding shape for Rule, Operation/Query, State Machine, and other admitted concepts. Carries canonical concept reference, resolved kind/admission, source unit, entry point, language, relationship edge, and digest. It replaces separate Rule-, use-case-, and meta-type-binding nouns.

3. Existing `Obligation`  
   Content-addressed derivation request owned by the current IR. New check classes or claim-limit fields remain deferred until accepted by that owner.

4. `StateMachineRuntimeContract`  
   References a canonical State Machine and owns only executable state, transition selection, guard, effect-intent, and runtime-invariant semantics. `runtime_transition` is a nested record, not an ontology kind or DS-D2 edge.

5. Deferred `ExceptionRecord`  
   A possible governed cross-tool record. Native suppressions and code-tag waivers are representations or scoped precedent. No general acceptance semantics are asserted.

6. Generated `EvaluationReceipt`  
   Evaluator-family evidence following the minted digest/provenance pattern. Findings, native diagnostics, unsupported cases, skips, exceptions, and raw-artifact references are nested records. It never authorizes or promotes.

Language realizations, module-boundary constraints, evaluator bundles, findings, provenance, migration entries, and runtime transitions remain nested fields or existing governed artifacts—not additional candidate types or relationship vocabulary.

## Enforcement-model correction

The revised model has separate check classes:

- lexical/style;
- source-shape/AST;
- module topology;
- static type;
- DomainSpec formation;
- semantic-profile admission;
- DomainSpec graph;
- binding and provenance reconciliation;
- runtime/temporal.

Evidence is a cross-cutting channel emitted by each check, not a higher enforcement layer. Authority is an external owner gate, not the final rung of a proof ladder.

## Evidence closure

| Area | Closure |
|---|---|
| Profile, mapping, obligation, RuleSet, transition, migration, waiver, receipt, and public/private owners | **Closed for synthesis** with exact local selectors |
| Canonical implementation-symbol mapping | **Decision closed:** post-reformulation code tags; **migration open** |
| Six-term vocabulary and non-collapse | **Closed for writer** |
| Shared evaluator boundary | **Closed for writer:** reconciliation/normalization only |
| Rust module-graph claim | **Corrected and closed for paper fixture**; implementation remains open |
| Exhaustiveness ownership | **Corrected and closed:** native compiler evidence only |
| General exception acceptance | **Explicitly owner-blocked and deferred** |
| Cross-language fixture execution, performance, false positives, IDE latency, and project fit | **Open implementation evidence; must not be claimed** |
| Profile admission, implementation, promotion, release, or production readiness | **Out of scope and unchanged** |

Precedent and non-collapse defects are repaired at the evidence/model level. The synthesis is ready for the writer lane with explicit open residues; it is not evidence of implementation, executed parity, completed code-tag reformulation, authority transfer, or promotion.
