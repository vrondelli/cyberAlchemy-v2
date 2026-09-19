---
artifact: invoke-v1-aspect-adoption
status: superseded-for-s1-source-authority
updatedAt: 2026-08-20
docType: source-adaptation-decision
---

# DomainSpec v1 Aspect Adoption Decision

## Decision

Use selected v1 aspect files as explanatory and structural source-pattern
evidence only. Do not use them to author the S1 predicate, expected values, or
runtime behavior, and do not copy the v1 feature folder wholesale into the v2
minted-node contract.

The v1 files remain valuable examples of formal rules, calculations,
postconditions, and interface responses. `DEC-GCP-001-R1:option-a` supersedes
their former S1 source role with an owner-admitted EVF-local machine predicate
and a separately admitted harness-runtime contract.

## Aspect Matrix

| v1 aspect | Decision | v2 use | Why |
| --- | --- | --- | --- |
| `implementation/domainspec/docs/features/test-derivation-engine/SPEC.md` | adapt selectively | self-derivation/fixpoint rationale; `ConceptGraph`, `Obligation`, `RuleSet`, `FormalExpr`, and `RoundTripReport` vocabulary | establishes why the engine can specify itself, but its frontmatter and paths are v1-specific |
| `implementation/domainspec/docs/features/test-derivation-engine/operations.md` | explanatory pattern only | inform contract vocabulary and review; never supply the S1 predicate or expected result | Markdown cannot author the selected machine semantics |
| `implementation/domainspec/docs/features/test-derivation-engine/interfaces.md` | explanatory pattern only | inform binding/evaluator vocabulary; never define the selected runtime behavior | examples cannot substitute for the exact runtime contract or Task Session admission |
| v1 engine `states.md` (not present) | defer | future temporal evaluator only | the v1 engine explicitly omits states because it is a stateless pure pipeline |
| v1 engine `events.md` (not present) | defer | future event/consumer edges | event semantics are useful for later `produces` proofs, not required for `enforces` L0 |
| feature `domain.md` files | selective reference | node `kind`/body constraints when a concrete backend feature is chosen | domain files vary by feature and are not the engine's universal contract |
| `queries.md` | defer | future read-model/query obligations | no query edge is required by the first example |
| `mappings.md` | defer | future projection/binding adapters | no mapping is required to prove the first graph-to-receipt path |

## Mapping Into The Current v2 Contracts

| v1 source row | v2 artifact | Adaptation rule |
| --- | --- | --- |
| operation input | `TestCase` fixture input | preserve field names and source anchor; add graph/source digest |
| formal rule | explanatory comparison only | never parse v1 Markdown as the S1 predicate; use the exact selected machine source or fail typed |
| calculation | derived obligation class | keep formula text/AST as evidence, never implementation output |
| postcondition | explanatory comparison only | the independent typed evaluator reads the selected predicate and expected-free fixture, not Markdown |
| interface request | `Binding` input contract | bind to a harness adapter, not a production API by assumption |
| interface response/exit code | `Evaluator` verdict vocabulary | normalize to scoped verdict plus raw response |
| round-trip report | `Receipt` structural/evidence section | compare independent expected and generated obligation identities |

## What Must Not Be Imported

- v1 frontmatter, ownership names, or relative implementation paths;
- v1 app-runtime assumptions (HTTP, repositories, auth, persistence) into the
  pure graph proof;
- v1 states/events as mandatory files for the first proof;
- the v1 LLM generator or the superseded full pipeline orchestrator;
- any v1 claim that the engine is complete merely because a fixture parses.

## Gate

This is a source-boundary correction, not a canonical-definition promotion.
The first SWU remains `SWU-GCP-001`. Exact-byte apply, independent applied-byte
review, Implementation Readiness, and Task Session runtime admission must all
pass before implementation begins.
