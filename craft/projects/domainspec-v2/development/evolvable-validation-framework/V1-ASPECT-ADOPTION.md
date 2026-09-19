---
artifact: invoke-v1-aspect-adoption
status: decision-recorded
updatedAt: 2026-07-18
docType: source-adaptation-decision
---

# DomainSpec v1 Aspect Adoption Decision

## Decision

Use selected v1 aspect files as source patterns and evidence adapters. Do not
copy the v1 feature folder wholesale into the v2 minted-node contract.

The v1 files are valuable because they already express formal rules,
calculations, postconditions, and interface responses in a shape the derivation
engine understands. They are not, by themselves, the v2 graph authority.

## Aspect Matrix

| v1 aspect | Decision | v2 use | Why |
| --- | --- | --- | --- |
| `implementation/domainspec/docs/features/test-derivation-engine/SPEC.md` | adapt selectively | self-derivation/fixpoint rationale; `ConceptGraph`, `Obligation`, `RuleSet`, `FormalExpr`, and `RoundTripReport` vocabulary | establishes why the engine can specify itself, but its frontmatter and paths are v1-specific |
| `implementation/domainspec/docs/features/test-derivation-engine/operations.md` | **adopt as formal source pattern** | map `Input`, `Rules`, `Calculations`, and `Postconditions` into obligations and test expectations | strongest direct source for deterministic derivation; it already has closed formulas and typed postconditions |
| `implementation/domainspec/docs/features/test-derivation-engine/interfaces.md` | **adopt as binding/evaluator source pattern** | map requests/responses and exit statuses into `Binding`, `Evaluator`, and receipt verdicts | gives an observable boundary around a pure engine without importing an app runtime |
| v1 engine `states.md` (not present) | defer | future temporal evaluator only | the v1 engine explicitly omits states because it is a stateless pure pipeline |
| v1 engine `events.md` (not present) | defer | future event/consumer edges | event semantics are useful for later `produces` proofs, not required for `enforces` L0 |
| feature `domain.md` files | selective reference | node `kind`/body constraints when a concrete backend feature is chosen | domain files vary by feature and are not the engine's universal contract |
| `queries.md` | defer | future read-model/query obligations | no query edge is required by the first example |
| `mappings.md` | defer | future projection/binding adapters | no mapping is required to prove the first graph-to-receipt path |

## Mapping Into The Current v2 Contracts

| v1 source row | v2 artifact | Adaptation rule |
| --- | --- | --- |
| operation input | `TestCase` fixture input | preserve field names and source anchor; add graph/source digest |
| formal rule | `Obligation.canonical_params` and expected predicate | parse when closed; otherwise emit `needs_formal` |
| calculation | derived obligation class | keep formula text/AST as evidence, never implementation output |
| postcondition | `TestCase.expected_predicate` and evaluator claim | retain guarantee class and traceability anchor |
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

This is a source-adaptation decision, not a canonical-definition promotion. The
first SWU remains `SWU-GCP-001`; S0 must review the adapted operations and
interfaces mapping before implementation begins.
