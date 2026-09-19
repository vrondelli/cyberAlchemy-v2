---
title: DomainSpec v2 implementation structure and enforcement research strategy
status: confirmed
dispatch_id: 2026-07-30-domainspec-v2-implementation-structure-enforcement
dispatch_type: research
schema_version: 0.8.0
authority: proposal-only
---

# DomainSpec v2 implementation structure and enforcement research strategy

## P1 trigger decision

This is a governed research dispatch. It satisfies all four P1 triggers:

- synthesis: local DomainSpec v2, historical/current `implementation/domainspec`,
  cyberAlchemy v2 authority and ontology, and three language ecosystems must be
  reconciled;
- context protection: live source, official tooling documentation, and negative
  controls would be much larger than the parent chat should carry;
- isolation: ontology candidates and language-tool recommendations must remain
  discardable until they survive precedent, non-vacuity, and non-collapse;
- parallelism: repository, ontology, and language-tool research can run
  independently before synthesis.

The result is research, not an implementation plan or authorization to install
linters, change code, edit authority, or promote ontology.

## The core distinction

“Only arrow functions” and “one rule per file” are useful examples, but they
cannot be assumed to be universal DomainSpec laws:

- arrow-function-only is TypeScript/JavaScript-specific and may be style,
  binding-semantics, or API-shape policy depending on the case;
- one-rule-per-file can improve addressability and ownership, but a bare
  function-only export may lose metadata, version, diagnostic identity,
  dependency declaration, and test binding;
- a clean folder tree does not prove dependency direction, domain
  composability, state-transition validity, or runtime behavior.

The research therefore starts with a candidate DomainSpec obligation and asks
how each language projects it idiomatically. It does not start with one linter
configuration and generalize backward into ontology.

## Lanes and subagents

### Group 1: explorers, parallel

Anti-bias axis: repository archaeology versus formal ontology/authority
modeling versus current ecosystem tooling.

1. **van Lamsweerde, Axel — local precedent explorer**
   - Classifies what `projects/domainspec-v2/` and
     `implementation/domainspec/` already own.
   - Traces rule files/imports, meta-types, architecture-pattern material,
     parsers, state machines, tags, validators, generators, and receipts.
   - Returns exact selectors, actual enforcement, bypasses/false-greens, and
     build-from-owned classifications.
2. **Spivak, David — ontology and authority explorer**
   - Derives candidate types and relationships from DomainSpec evidence.
   - Preserves cyberAlchemy v2 source, ontology, projection, and promotion
     boundaries.
   - Separates universal obligations from language-profile policy and local
     guidelines.
3. **Turing, Alan — TypeScript/Python/Rust explorer**
   - Uses current official primary documentation.
   - Compares formatter, AST/linter, import boundary, compiler/type system,
     graph validator, build/test, state-machine/typestate, IDE, autofix, and
     receipt capabilities.
   - Produces an idiomatic minimum profile per language without installing
     packages.

### Group 2: synthesizer, depends on explorers

**Wiener, Norbert** reconciles the three evidence sets into:

- an enforcement-layer model;
- a candidate ontology and authority map;
- a universal obligation model with TypeScript, Python, and Rust projections;
- explicit folder/module/import/rule/meta-type/state-machine contracts;
- one cross-language non-vacuity fixture;
- migration, exception, versioning, ergonomics, performance, and adoption
  constraints;
- a blind-spot register and evidence-closure matrix.

### Group 3: reviewers, parallel after synthesis

Anti-bias axis: precedent, non-vacuity/counterexample, and
definitional/scope non-collapse.

1. **Rittel, Horst — precedent skeptic**
   - Finds the actual local or ecosystem owner for every proposed mechanism.
   - Classifies `already-deployed`, `build-from-owned`, or
     `precedent-clean`; precedent itself never kills a candidate.
2. **Popper, Karl — non-vacuity skeptic**
   - Forces one feature through a TypeScript/Python/Rust paper-executable
     fixture with an imported rule, valid and invalid state transitions,
     module failure, semantic failure, suppression, and comparable receipt.
   - Kills policies that cannot change an observable verdict.
3. **Quine, Willard Van Orman — definitional skeptic**
   - Attacks collapse among ontology kind, language profile, source file,
     linter rule, domain rule, state machine, generated projection, runtime
     behavior, receipt, and authority.

The synthesizer and reviewers have one zig-zag repair loop. Missing source or
selector evidence may traverse one declared feedback edge to the explorers.

### Group 4: writer, depends on evidence closure

**Shannon, Claude** writes only `findings.md`. The parent mechanically appends
verbatim explorer returns to `research.md`.

### Group 5: auditor, depends on writer

**Bourbaki, Nicolas** audits `findings.md` against the frozen goal and
exact-binding contract. One writer revision is allowed. The parent remains the
final approver.

## Dependency flow

```text
explorers
    |
    v
synthesizer <---- feedback for missing source evidence (cap 1)
    |
    | zig-zag (cap 1)
    v
reviewers
    |
    v
exact-binding evidence closure
    |
    v
writer <---- auditor revision (cap 1)
    |
    v
auditor
    |
    v
parent final approval
```

## Expected findings shape

The research should answer, not merely inventory:

1. What enforcement and architecture-pattern machinery already exists?
2. Which current sources are canonical, generated, staged, historical, or
   non-authority?
3. What candidate ontology types and relationships are needed before language
   profiles?
4. Which obligations belong to style, syntax/AST, module topology, compiler
   types, DomainSpec graph validation, runtime/temporal behavior, tests, and
   evidence?
5. How does a use case import or bind a rule without hiding identity,
   dependencies, diagnostics, or version?
6. How are state, transitions, guards, effects, persistence, concurrency, and
   receipts represented without confusing a state-machine description with a
   runtime proof?
7. What is the smallest idiomatic initial profile for TypeScript, Python, and
   Rust?
8. Which policies should be killed, deferred, or kept as opt-in guidelines?
9. What migration and developer-experience costs would adoption create?
10. What should the first separately governed implementation experiment be?

## Blind spots that must be tested

- authored versus generated code and who may edit each;
- repository package roots, barrels/re-exports, dynamic imports, reflection,
  macros, decorators, proc macros, and plugin boundaries;
- tests, fixtures, examples, scripts, migrations, vendored files, generated
  clients, and one-off operational tools;
- cyclic imports and dependencies that are legal to the language but illegal
  to the DomainSpec architecture;
- rule identity, metadata, versions, dependencies, diagnostics, severities,
  suppressions, deprecations, and ownership;
- whether tests live beside rules or in a separate governed projection;
- aggregate registries and index generation without a second source of truth;
- formatter/linter/compiler overlap and contradictory diagnostics;
- custom-rule API stability, plugin maintenance, supply-chain risk, and CI/IDE
  parity;
- autofix safety and whether a fix can change behavior;
- incremental-build latency, cache invalidation, monorepo boundaries, and
  developer attention budgets;
- state-machine persistence, effect isolation, event ordering, concurrency,
  idempotency, retries, time, cancellation, and unreachable states;
- static conformance versus runtime behavior versus semantic satisfaction;
- escape hatches that are typed residue rather than silent disable comments;
- language-version and tool-version drift;
- legacy migration, mixed-profile repositories, and profile negotiation;
- false-green cases: empty rule sets, skipped/todo tests, missing files,
  unbound rules, orphan use cases, unreachable validators, and successful
  commands that checked nothing;
- public/private boundary and whether a proposed generic Arcanum mechanism
  would leak private DomainSpec or cyberAlchemy v2 authority.

## Inventory preflight

The owner `.arcanum/inventory/index.json` passed projection-conformance with
`lookup_readiness=ready` and 121 historical-tag warnings. No consumer machine
Inventory exists at the `projects/domainspec-v2/` root, recorded as
`consumer_machine_index_gap`.

Selected evidence:

- accepted DomainSpec language type-enforcement research;
- verified evolvable validation framework result;
- medium-confidence composability/edges/taxonomy synthesis, which must be
  re-verified;
- closed backend architecture-card triage proving relevant
  `implementation/domainspec` precedent but no automatic authority transfer.

The plain-language composability guide was excluded as secondary to the
evolvable validation result. UI compound-structure research was excluded as a
different scope. Inventory remains a discovery read model; explorers must read
and cite live sources.

## Gate and ledger state

- Candidate schema: `0.8.0`.
- Confirmation-readiness: PASS under the live schema `0.8.0` form owner.
- Frozen sheet digest:
  `f6e4c78fb46eddfd7809e8465bfaab93dbb47ad6a56bc06a7695640a87ae77d2`.
- Dispatch Spec route validation: PASS.
- Check-tension: PASS/PASS with handles
  `tension-checker-f6e4c78f` and `tension-reviewer-f6e4c78f`.
- Human confirmation: recorded for the exact frozen digest in
  `CONFIRMATION.md`.
- Registration: not registered; ledger mutation forbidden before
  confirmation.
- Runtime: not started.
- Closeout expectation: exactly one dispatch row and one close row, all agents
  joined/closed, result validation inspected by the parent, then Inventory and
  observability read models refreshed.

## Next human action

Registration and execution are authorized for the exact frozen sheet. Any
sheet edit requires new validation, two new tension verdicts, and
reconfirmation.
