# Recovery profile and observer prototypes — B01/B02

The recovery runtime retains execution, fencing, replay and retry behavior. ORODI owns the proposed recovery evidence profile and evaluator. This package completes the definition/scaffold and observer/fixture-design stages; it does not implement the adapter or prove integrated behavior.

## Product and business views

The product gives a developer one inspectable receipt for an exact recovery test candidate. The business view separates recovery execution, Operation effects, test production, observation, ORODI evaluation and the product owner's decision. `ontology-scaffolds.json` makes these relationships navigable; its compiled-system and implementation nodes describe future targets only.

`definitions.json`, `product-profile.json` and `domainspec-profile.json` define local prototypes. They are not registered ontologies, compiler input, canonical definitions or admitted profiles. `compatibility-contract.json` keeps existing ORODI C01–C16 and seven-family entrypoints unchanged while proposing a separate recovery discriminator.

## Observation and fixtures

`observer-contract.json` specifies producer identity, read-only capture, barrier ordering, per-store snapshots and protection against observer lock interference. It does not imply a cross-store atomic snapshot. The observer cannot invoke recovery actions. `evaluation-policy.json` separates historical integrity from fresh test claims and retains causal evidence states. The one-day receipt/freshness limit is an explicit prototype policy choice.

`fixtures.json` contains 30 historical golden cases with exact source digests and 60 JSON Pointers, 30 hostile missing-repetition recipes, and 17 cross-cutting cases. Each scenario also retains its authored tests and expected behavior for later instrumentation. Golden import preserves recorded PASS labels; it does not turn them into fresh product-test evidence. These are fixture specifications; adapter execution awaits B03/B04. F26 remains formation-only, and F27/F30 require both formation and runtime evidence.

## Construction frontier

B01 and B02 are complete as local prototypes. B03, the additive ORODI schema and evaluator, is ready. B04 implements the adapter and observer; B05 tests the new composite; B06 reviews it; B07 obtains the exact product decision. Existing runtime and historical packets remain untouched.

Operational-support residue retains its owner and affected stage in `plan.json` and `progress.json`; none is a current prerequisite for B03. No product approval, registration, admission, publication or deployment is granted here.

`CHECKS.json` records static source, pointer, denominator and graph checks separately from the not-yet-evaluable integrated tests.
