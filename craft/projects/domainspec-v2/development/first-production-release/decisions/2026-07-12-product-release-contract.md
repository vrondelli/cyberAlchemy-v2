# DomainSpec-v2 first production release contract

Status: accepted product-scope decision; production release not authorized<br>
Decision date: 2026-07-12 (America/Sao_Paulo)<br>
Decision authority: external `DomainSpec-v2 Owners` role<br>
Decision-gate result: PASS<br>

## Decision

The first DomainSpec-v2 production product is a private, repository-local, evidence-producing system builder and conformance engine, operated through a CLI by authorized internal engineering teams. Body War is its first end-to-end production pilot and acceptance witness.

This decision retains the roadmap's private repository-local delivery surface but supersedes the capability limits of its Option-A candidate. Code-tag conformance, generated verification code, formal-model validation, architecture and pattern enforcement, and cross-graph conformance are now first-release capabilities. The baseline roadmap must therefore be recomposed before execution; its earlier exclusions cannot silently remain release assumptions.

The production capability must form a traceable chain:

1. Business concepts and rules are represented as a governed business-ontology knowledge graph.
2. DomainSpec expresses a typed semantic specification graph over that ontology.
3. Architecture laws and composable-pattern constraints determine admissible implementation structures and dependencies.
4. TLA+/Alloy-like formal validation checks the supported profile's declared structures, states, transitions, invariants, and satisfiability obligations.
5. DomainSpec deterministically generates the executable test engine, obligation suite, and other explicitly enumerated verification artifacts.
6. Code tags and structural analysis derive an implementation graph from the Body War codebase.
7. The validation pipeline compares the business-ontology, specification, architecture, obligation, test, and implementation graphs and emits fail-closed, machine-readable evidence.

DomainSpec semantic authority defines meaning and derives obligations. It does not self-authorize implementation conformance, production satisfaction, or release. Those claims require passing witnesses and an external owner decision under the [Authority Model](../../../authority/AUTHORITY-MODEL.md).

## Binding claim meanings

### Full coverage

`Full coverage` means 100% traceable coverage of every obligation derivable from the exact supported DomainSpec profile. Each applicable obligation must have an executable witness and, where meaningful, a discriminating negative witness. The release must reject missing, skipped, placeholder, orphaned, or unexecutable obligations rather than count them as covered.

This is not a claim to cover every possible runtime path, every undiscovered business requirement, or arbitrary behavior outside the declared profile.

### Equivalence

`Equivalence` means complete traceability and preservation of the supported profile's declared types, identities, relationships, constraints, invariants, architecture laws, pattern obligations, and behavioral obligations across the mapped graphs. A release verdict must fail on missing mappings, orphan nodes or obligations, incompatible relations, violated invariants, forbidden architecture edges, unsupported code claims, or non-discriminating evidence.

This is not universal mathematical or semantic equivalence between arbitrary source code and human business meaning. The precise graph mapping, preservation relations, decidable checks, and limits must be enumerated and tested in the R2/R3 capability contracts.

## Product and operating boundary

| Field | Binding decision |
| --- | --- |
| Lineage | `DomainSpec-v2` |
| First production target | SemVer `0.1.0`; production status comes from evidence gates and owner authorization, not the version number |
| Release form | Private repository-local CLI from an immutable tagged checkout |
| Eligible actors | Authorized internal engineering teams, including but not limited to maintainers and specification authors |
| Initial environment | One pinned Linux environment; exact Node.js, npm, solver, and toolchain versions are bound by the product contract and release manifest |
| Compatibility | Patch releases remain compatible within a minor line; minor releases may break only with migration notes, migration checks, and a rollback route |
| Support | Named best-effort support with a private channel, acknowledgement owner, severity escalation, supported-version list, diagnostic bundle, hotfix route, and end-of-support authority; no SLA claim |
| Pilot | Body War is the first end-to-end production witness |
| Distribution | Private only; no public package or hosted-service claim |

## First-release inclusions

The release claim includes, for the exact supported profile:

- profile, schema, content, relationship, direction, signature, and graph validation;
- architecture-layer and edge-law enforcement;
- composable-pattern admissibility and obligation derivation;
- formal-model extraction and TLA+/Alloy-like validation code for declared structures and behaviors;
- deterministic test-engine and obligation-suite generation;
- code-tag and structural implementation-graph derivation;
- bounded cross-graph traceability and equivalence validation;
- discriminating positive, negative, mutation, and self-check evidence;
- stable machine-readable verdicts and recoverable emitted artifacts; and
- an end-to-end Body War pilot receipt tied to the exact release candidate.

The exact supported concepts, relationships, commands, inputs, outputs, writes, solvers, code-tag semantics, graph mappings, generated artifacts, and rejection behavior are product-contract work. They may not be inferred from this high-level decision.

## Binding exclusions

The first release does not include:

- a DomainSpec graphical UI;
- a hosted DomainSpec service;
- public distribution or a public SDK ecosystem;
- multi-language implementation support;
- automatic Saturn actuation or a runtime-convergence claim;
- arbitrary full-application generation;
- universal formal proof of arbitrary programs;
- proof of requirements that the supported business ontology and specification do not declare; or
- automatic promotion or release authorization.

Body War's own application UI remains part of the pilot application, not part of the DomainSpec product surface.

## Release authority and separation

`DomainSpec-v2 Owners` is the durable external release authority. Its membership is intentionally late-bound; creating a roster before a real release candidate would not improve present decisions. The exact release manifest must bind the applicable people or governed owner references before release authorization.

Each release manifest must bind at least:

- semantic owner;
- claim owner;
- release authority, proposer, approver, and operator;
- runtime, validation, generation, state, security, support, and Craft owners;
- independent verifier; and
- Body War pilot operator.

Execution roles may overlap. The release proposer and approving owner must be different people, and an independent verifier may not verify evidence they authored. One owner proposes; a different owner approves only after independent verification. Unanimous approval by every owner is not required.

Absent present-day membership is not a planning blocker. An unbound or ambiguous release manifest is a hard release blocker.

## Evidence and release rule

This decision resolves the human product/release branch. It does not assert that the roadmap's P-G0 validator exists or passes, and it does not make any current implementation production-ready.

Production authorization requires, at minimum:

- a reconciled authority baseline;
- a machine-validatable supported-profile and product contract;
- completed implementation for every included capability;
- fail-closed validators and discriminating generated tests;
- clean, immutable, reproducible release-candidate evidence in the pinned environment;
- security, state-safety, rollback, documentation, compatibility, and support evidence applicable to the private CLI;
- a successful controlled Body War pilot; and
- the separated owner authorization defined above.

The existing [production roadmap findings](../../../../../implementation/domainspec/research/2026-07-12-first-production-release/findings.md) remain evidence, but their Option-A route is no longer executable unchanged. The next planning move must recompose its dependency graph around the expanded first-release contract without weakening its authority, safety, operational, or clean-candidate gates.

## Decision log

All decisions below were supplied or confirmed by the external owner during the 2026-07-12 Decision Gate.

| ID | Decision question and alternatives considered | Selected decision | Rationale/source |
| --- | --- | --- | --- |
| G0-01 | Release form: private repository-local CLI; extracted private package; public derivative; hosted service; full expanded system; request more context | Private repository-local CLI delivery surface | Selected directly by owner; minimizes distribution and service operations while retaining the intended private product boundary |
| G0-02 | Lineage identity: bounded toolkit name; `DomainSpec-v2`; request more context | `DomainSpec-v2` | Selected directly by owner; the contract carries the narrower product boundary that the broad lineage name does not communicate |
| G0-03 | Version policy: SemVer `0.y.z`; `1.0.0`; non-SemVer; request more context | SemVer with `0.1.0` as first production target | Selected directly by owner; version communicates compatibility, not production status |
| G0-04 | Eligible actors: maintainers only; maintainers and spec authors; internal engineering teams; request more context | Authorized internal engineering teams | Selected directly by owner; requires broader documentation, onboarding, support, compatibility, and pilot validation |
| G0-05 | Delivery environment: one pinned Linux environment and immutable tag; broader environment matrix; request more context | One pinned Linux environment and immutable private tagged checkout | Selected directly by owner; exact tool versions remain evidence-bound product-contract work |
| G0-06 | Compatibility: stable within a minor line; only immutable individual releases; stable across all `0.y`; request more context | Patch-compatible within each minor line; controlled minor breaks | Selected directly by owner; migration evidence and rollback are required for minor breaks |
| G0-07 | Support: named best effort; formal service levels; maintainer-only/no support; request more context | Named best-effort support without SLA | Selected directly by owner |
| G0-08 | Capability claim: validation only; build-time validation and derivation; include code tags; include the full expanded system; request more context | Architecture and graph validation, pattern enforcement, formal validation, generated test engine, code validation, and cross-graph conformance | Owner corrected the candidate from a bounded validation toolkit to the existing intended model |
| G0-09 | Code generation: arbitrary full application; bounded application scaffolding; generated verification/test engine; request more context | Generated executable test engine and explicitly enumerated verification artifacts, used to build and validate Body War | Owner clarified that the intended generator is the test/conformance engine, not an unrestricted whole-app generator |
| G0-10 | Meaning of full coverage and equivalence: universal behavior/proof; profile-bounded obligation coverage and preservation; request more context | Profile-bounded 100% obligation coverage and declared-property preservation across mapped graphs | Confirmed by owner; keeps the claim strong, decidable, and no larger than its evidence |
| G0-11 | Scope exclusions: retain UI/hosted/public/SDK/multi-language/Saturn/full-app/universal-proof work; exclude them from first release; request more context | Binding exclusions listed above | Confirmed by owner; these are separate capability programs, not required hardening for this product |
| G0-12 | Release authority: named individuals; durable owners group; one combined authority; request more context | `DomainSpec-v2 Owners`, with two-person proposal/approval and independent verification | Confirmed by owner; protects the external authority boundary without requiring unanimous approval |
| G0-13 | Owner membership timing: create roster now; bind at release-candidate time; request more context | Bind actual people or governed references in the release manifest | Owner rejected a premature roster as non-load-bearing ceremony; ambiguity remains fail-closed at release time |

## Deferred, not forgotten

The following are deliberately deferred to the product/profile contract, capability design, or exact release manifest:

- the enumerated supported DomainSpec profile;
- exact CLI commands and stable machine interfaces;
- formal-model language, solver, soundness boundary, and failure semantics;
- graph schemas, correspondence relations, preservation algorithms, and equivalence verdict taxonomy;
- obligation-coverage calculation and negative-witness requirements by obligation kind;
- supported code languages, tag grammar, structural-analysis boundary, and dynamic-semantics evidence;
- generated test-engine artifacts and their runtime harness;
- Body War scenarios, acceptance thresholds, and pilot rollback route;
- pinned operating-system and toolchain versions; and
- actual owner membership and per-release role assignments.

These details may be researched and decided incrementally, but every item that affects a release claim must be closed before the corresponding capability or release gate can pass.

## Reopen conditions

Reopen this decision when a proposal changes the lineage, eligible actors, private delivery form, supported environment class, compatibility policy, support posture, Body War pilot role, coverage/equivalence meaning, included capability set, exclusions, or authority-separation rule. New implementation discoveries become governed frontier items; they do not silently mutate this contract.

## Assumptions and validation

- Body War can serve as a private internal pilot and evidence source.
- `TLA+/Alloy-like` names the required class of formal validation; it does not claim that TLA+ or Alloy is already integrated.
- Code generation means the generated test/conformance engine and enumerated verification artifacts unless a later owner decision explicitly expands it.
- This record was checked against the approved roadmap findings and the active DomainSpec-v2 Authority Model.
- No implementation, semantic authority artifact, Craft ledger, or release state was changed by this Decision Gate.
