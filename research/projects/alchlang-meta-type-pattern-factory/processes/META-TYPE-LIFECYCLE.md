# Process for creating a new DomainSpec meta-type

This is the upstream lifecycle. It is intentionally harder than adding a new
AlchLang spelling or pattern.

## Phase A — establish meaning

1. Define the domain distinction and show why no admitted meta-type already
   satisfies it.
2. Add canonical term, criterion, category, distinguisher, positive examples,
   counterexamples, and overlap analysis.
3. Define legal typed edge signatures and validation obligations.
4. Define behavior/observation semantics and the claim ceiling.

Exit: a reviewable semantic candidate, not implementation authority.

## Phase B — create the admission kit

5. Produce exactly one `MetaTypeAdmission/v2`, matching
   `MetaTypeDescriptor/v2`, exact referenced source bytes, and
   `authority_effect: none` inside a `FactoryKitPackage/v1`.
6. Run factory `inspect`; ambiguous, candidate-only, stale, or internally
   inconsistent packages stop.
7. Run factory `init` to create the six empty implementation/evidence files.
   Initialization must not synthesize business behavior.

Exit: scaffold only.

## Phase C — implement proof semantics

8. Implement the family descriptor decoder and evaluator.
9. Add positive observations, discriminating hostile mutations, expected
   finding codes, obligation coverage, and negative boundary cases.
10. Add one target realization provider per supported language. Each declares
    complete input roles, component paths, tool IDs, dependencies, timeout,
    semantic result, and authority ceiling.
11. Add providers explicitly to the registry; generic executor logic remains
    unchanged.

Exit: candidate proof providers with local evidence.

## Phase D — prove and admit an immutable baseline

12. Generate direct-proof requests and relationship/pattern join proofs.
13. Prove same-run dependency handles, deterministic replay, tamper rejection,
    collision rejection, clean-package closure, and atomic evidence publish.
14. Create a new immutable baseline version; never edit `@10` in place.
15. Obtain the owner admission decision bound to the exact baseline digest.

Exit: admitted meta-type baseline. Only now may an AlchLang profile opt in.

## Phase E — project into AlchLang

16. Add a meta-type projection to Carrier v3 and one or more source factories.
17. Add frontend parsing/AST hostile tests and deterministic lowering.
18. Add target realization selection, factory projection, conformance, and
    migration tests for profiles that adopt the new baseline.
19. Create a new construction-profile candidate and obtain its distinct owner
    decision.

## Required evidence matrix

| Surface | Required evidence |
|---|---|
| Meaning | criterion, counterexamples, overlap decision |
| Formation | exact schema, body decode, typed relations |
| Behavior | positive and hostile observations |
| Realization | target provider, compilation/execution where applicable |
| Factory | direct and join proof replay, tamper/collision tests |
| Baseline | immutable manifest and owner-bound digest |
| AlchLang | source decode, carrier projection, target selection, migration |

