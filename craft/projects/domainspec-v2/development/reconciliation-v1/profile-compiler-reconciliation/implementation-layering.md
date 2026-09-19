---
title: Profile and compiler reconciliation implementation layering
status: candidate-plan-not-executed
updatedAt: 2026-09-08
owner: DomainSpec product owner
scope: compiler and language profiles
authority_effect: none
---

# Implementation layering

Companion to [PLAN.md](PLAN.md), adapted from the implementation-layering
template. Target: reuse the 39 backend implementations through coherent,
profile-governed generation and independent target conformance. This is a
specialization of the parent roadmap, not a new execution authorization.

## Context and method

Brownfield system: profiles, reference implementations, proof providers, checked
graph compilation and accepted layout behavior already exist. The main unknown
is their generated-code agreement, not whether to invent new metatypes.
Users are direct DomainSpec authors and consumers of generated native code.
AlchLang is a later consumer and remains outside this slice.

Layer value = decision unlocked + user-visible outcome + risk reduced.
Layer cost = implementation time + verification time + coordination burden.
Stop each layer at the smallest end-to-end proof that supports its decision;
do not turn a layer into an inventory exercise or defer all testing to closeout.
Every later layer preserves earlier positive and hostile guarantees.

## Layer decision table

| Layer | Decision question | Minimum proof | User-visible outcome | Risk reduced | Main cost drivers | Advancement decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether one selected profile can govern real generated code end to end. | TypeScript Entity + declared Rule + Query through direct JSON, checked graph, placement/import plan, independent observation and native execution. | Inspectable factory-based example that preserves identity and validation. | Repeating the earlier behavior-only PASS with wrong code form. | Minimal resolver, parameterized observer and generator adaptation. | Continue only after the class/bypass/path/import mutants fail for the right reason. |
| L1 | After this layer, we know whether this mechanism covers every backend type coherently in one language. | All 13 TypeScript cells with exact source roles, symbols, imports and support modules across selected compiler entry points. | One usable generated TypeScript project. | Thirteen disconnected special cases or a layout-only rename. | Contract crosswalk, type-specific renderers, shared artifact planner. | Generalize only with complete per-cell evidence and no weakened L0 guarantees. |
| L2 | After this layer, we know whether the selected meaning survives three native implementations. | All 39 cells compiled and executed with shared semantic cases and separate native controls. | Equivalent domain outcomes in TypeScript, Python and Rust. | Token-translated code, hidden skipped lanes, unsupported parity claims. | Native adapters, toolchains, module wiring, error/numeric normalization. | Advance only when every promised cell is accounted for and independently observed. |
| L3 | After this layer, we know whether the profiles compose without collapsing domain concepts. | Multi-feature all-type model plus lawful relationship, nested-type and mutation corpus. | Generated code whose dependencies and workflow steps match the domain graph. | Hidden calculations, invented Operations, identity/occurrence confusion, field/reference collapse. | Parent semantic dependencies, graph/import topology, orthogonality and hostile fixtures. | Proceed to package qualification only after composition outcomes and negative controls close. |
| L4 | After this layer, we know whether users can install and reproduce the exact reconciled result. | Clean installed package plus versioned compatibility and accurate generated documentation. | Reviewable installable compiler candidate with explicit migration behavior. | Source/archive drift, workspace-only success, silent consumer breakage. | Packaging, reproducibility, installed tests and independent review. | Present exact tested product for review; admission/cutover/publication remain separate. |

## Layer definitions and scope progression

### L0 — Minimum working proof

- Units: PCR-01..04. Included: selected preimages, bounded configuration,
  generation, paths/imports, independent observation, native execution and
  two-run repeatability for the Entity/Rule/Query slice.
- Deferred: other ten metatypes, other two languages, advanced compound fields,
  application hosting, archive packaging and frontend changes.
- Exit evidence: immutable input/profile/output identities; actual factory
  validation before construction; structured no-Entity failure; stable identity
  across changed nonidentity snapshots; read-only Query; native compilation;
  expected-red then passing causal mutants for class, bypass, path and import.
- Value/cost: this is the smallest proof of both representation and behavior.
  It improves the existing DSR-007 result without reopening every semantic area.
- Pivot if the selected protocol is fixture-only: isolate the smallest
  parameterizable contract and prove it; never erase reference obligations.

### L1 — Complete TypeScript contract

- Units: PCR-05..07; builds on L0. Included: full 13-type matrix, native naming,
  source-role/path selection, exact symbol/import planning and supported build
  entry-point agreement. Layout changes are explicitly versioned.
- Deferred: cross-language equivalence, large compound corpus and release work.
- Exit evidence: 13/13 independently observed and natively executed cells;
  no source reread after checked snapshot; equivalent selections across build
  entry points; collisions and wrong imports reject before publication.
- Value/cost: close the generic mechanism in one language before multiplying
  its unresolved defects across three targets. Preserve every L0 guarantee.

### L2 — Three-language equivalence

- Units: PCR-08..10; builds on L1. Included: Python/Rust adapters, native modules
  and contracts, shared semantic corpus, separate language-native observations.
- Deferred: full product runtime, cross-host provisioning and native hash-byte
  equality. No new toolchain is installed implicitly.
- Exit evidence: 39/39 cells with present files, selected versions, independent
  structural observation and executed positives/negatives. Python dataclasses
  and Rust structs retain their native contracts; no universal no-class rule.
- Value/cost: target-specific work is justified after the shared contract is
  stable. Preserve all TypeScript behavior and report skipped/unavailable lanes.

### L3 — Composition and semantic resilience

- Units: PCR-11..12; builds on L2 and applicable parent meaning closures.
  Included: every type in a compound model, nested field forms and references,
  cross-feature name collisions, explicit mapper inputs, Policy selection,
  Workflow occurrences, triggers/effects and lawful backend relationships.
- Deferred: new canonical relationship meanings, live provider durability,
  database schemas, UI and Alch compilation parity.
- Exit evidence: explicit accounting of 17 backend signature obligations;
  non-collapse and orthogonality mutations; layout changes preserve semantics;
  language changes preserve outcomes within declared numeric/error bounds.
- Value/cost: isolated 39-cell success is insufficient for a composing language.
  This layer spends verification effort on interactions, not more registration.

### L4 — Installable and reviewable result

- Units: PCR-13..14; builds on L3. Included: explicit compatibility selection,
  versioned layout/profile contract, local archive, clean install, full selected
  corpus, user docs and exact review package.
- Deferred: remote release, default consumer cutover, canonical admission,
  production deployment and Alch consumer changes.
- Exit evidence: deterministic package reproduction; no hidden workspace
  imports; installed commands reproduce promised output; documentation matches
  tested support; independent review can trace every output back to its contract.
- Value/cost: distribution becomes worthwhile only after form, behavior and
  composition agree. Technical success permits product review, not deployment.

## Non-regression and two-lane scheduling

- Keep WP-RMT-001/002 implementations, baseline @10 and historical receipts
  unchanged unless an exact successor scope later selects changes.
- Preserve accepted application-layout/v1 and old archive behavior; no silent
  reinterpretation of existing configuration fields or paths.
- Never confuse a proof provider with a generic renderer or reuse one literal
  fixture checker as proof of arbitrary generated programs.
- Domain semantics, architecture constraints, native forms and physical package
  layout remain separate, digest-bound inputs to one resolved build.
- Independent preparation may proceed while another language is tool-blocked,
  but that language cannot disappear from the 39-cell denominator.
- Product work: PCR-01..14. Operational support and exact blocking rules are in
  PLAN.md section 8. Missing unrelated historical evidence or pending release
  decisions do not stop an independently verifiable prototype.

## Open questions and recommendation

Decision owners, proposed defaults and required stages are in PLAN.md section 9.
Recommended next layer: L0, beginning with PCR-01 and the bounded PCR-02 contract.
Advance only after PCR-04 supplies the independent end-to-end proof. Do not
claim full DomainSpec reconciliation from completion of this compiler subplan.

Mode: created. Layer count: 5. Boundary heuristic: applied. Product validation:
not run; planning-document consistency and preservation checks only.
