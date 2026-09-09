# Repeated memory-control experiment

ARE and an equal-information plain summary each passed 18/18 evaluation checks: 6/6 in every repetition. The result demonstrates correct use of the supplied controls on this corpus, with no observed ARE-specific answer-quality advantage.

| Case | Plain summary B | ARE scoped C |
|---|---:|---:|
| revision-apply | 3/3 | 3/3 |
| revision-scope | 3/3 | 3/3 |
| conflict-old | 3/3 | 3/3 |
| conflict-exact | 3/3 | 3/3 |
| stale-valid | 3/3 | 3/3 |
| stale-invalid | 3/3 | 3/3 |

Five real training turns created two retained conventions and replaced one with a revision. Evaluation then made 36 calls across three repetitions of six cases and two treatments. Every evaluation used a fresh ephemeral conversation; treatment order alternated. The stale-source pair used identical user text, differing only in supplied source validity.

Both treatments received the same relevant information: instructions, applicability conditions, revision/supersession status, invalidation and current-request overrides. The summary retained prior and current versions with explicit status; ARE projected applicable supported preferences through its existing API. No hidden disadvantage was introduced into the summary treatment.

The host supplied typed source attribution and control identifiers. These results do not test autonomous stale-source detection, correction extraction, model-weight learning, process-restart durability or broad semantic quality. The three repetitions share one trained state, so they are repeated response observations, not independent training replications. This small all-pass corpus is not a statistical proof of equivalence or general reliability.

Validation passed: a complete local 41-turn wrapper rehearsal; frozen protocol/schema binding; 562 exact input hashes, including the unchanged original 543-file candidate; 38 unique conversations comprising two training and 36 evaluation threads; revision predecessor integrity; exact scoped lesson counts; explicit unsupported and overridden dispositions; independent Python recomputation of the frozen literal scores. Prompts, rubric and runner were frozen before live execution, with no tuning or retry after observing evaluation output.

The run completed all 41 calls on gpt-5.6-sol in 388.4 seconds. Built-in memories, external memory import, shell tools and delegation were disabled. There were zero tool, optional-provider and model-judge calls. Usage from final cumulative totals for 38 threads: 662,681 input tokens, including 356,096 cached; 5,950 output tokens. Cached input is a subset. No monetary cost claim is made.

Product construction frontier: the existing prototype now has repeated bounded evidence for explicit memory controls. Together with the preceding transfer experiment, the supported claim is inspectable retention and control, not better answers than a well-maintained summary. Further construction should test measurable auditability/control value or context and latency cost before expanding the quality claim.

Operational residue belongs to product/runtime owners: product approval, production activation and publication remain separate decisions and do not block further bounded prototype work. No runtime, serving-profile, canonical ontology or earlier experiment bytes were changed. This experiment grants no operational authority.

Evidence: [frozen manifest](MANIFEST.json), [raw observations](RESULT.json), [assessment](ASSESSMENT.json), [validator](validate.py), [local tests](experiment.test.mjs), [plan](PLAN.md).
