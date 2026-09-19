# Coverage ledger visibility: observed mechanism and next hypothesis

This audit uses actual captured prompts and tool outputs from the reviewed
schema-agreement campaign. It does not consult reference answers. Reproduce with
`python3 audit-ledger-visibility-r1.py`. [Machine evidence](LEDGER-VISIBILITY-AUDIT-R1.json)
pins all four traces and the ledger implementation. Two executions were byte
identical. A synthetic check verified overlap accounting, failed-read exclusion,
source-version separation, and prompt omission counts.

| Task | Successful direct reads | Fully repeated reads | Latest read path absent from ledger |
| --- | ---: | ---: | ---: |
| 1 | 8 | 3 | 15/15 |
| 2 | 24 | 14 | 17/17 |
| 3 | 28 | 23 | 23/23 |
| 4 | 12 | 3 | 11/18 |

The latest successfully returned direct-read path is absent from 66/73 subsequent
exploration ledgers. 43/72 successful direct reads contain only lines already
returned by earlier direct reads of the same source version. Task 3 repeats
2,078 of 2,328 returned lines; 23 of 28 direct reads add no new lines.
These are tool-output counts, not confirmed model-delivery or wasted-token claims.

## Observed implementation mechanism

`ranked-read-ledger-r1.mjs` sorts entries alphabetically, then renders a prefix
until the 384-token or four-entry bound is reached. It stops at the first entry
that does not fit. In task 3, requests 2, 10 and 20 show docs/README.md and
internal/config/config_file.go, while omitting the actively read view.go/http.go.
The runtime already records source coverage, but its bounded presentation hides
recent activity. Other prompt messages can still carry those files. Causality
between ledger omission and repeated reads is unproven.

## Incremental hypothesis candidate H-L

Prioritizing the latest confirmed source activity in the bounded ledger will
reduce repeated retrieval and improve acquired coverage per model token. Preserve
source/revision identity, confirmed-delivery requirements, read handles and all
source verification. Never prioritize unconfirmed tool output as observed state.
Keep 384 ledger tokens, four entries, actual 8K request admission, task set,
model, task budgets and two-worker campaign limits unchanged.

Define recency from the latest confirmed delivery of each source version, with a
deterministic tie break. Replayed history must not masquerade as a new read:
prefer the original observation's first confirmed delivery order for recency.
Do not remove recovery or suppress reads. Do not add path-specific benchmark
hints. Preserve the old renderer and campaign as frozen evidence.

Before a live run: test recency ordering, version separation, ties, replay,
unconfirmed observations, token limits and an oversized leading entry. Replay
all four historical ledgers to verify presentation change without provider calls.
Use candidate replay to qualify mechanics, never to claim behavioral improvement.

Pre-register the experiment in the native research ontology and prospective DAG.
Suggested support gates: four valid tasks with complete accounting; native mean
span-F1 at least .3917843227829315; mean acquired recall per 10,000 model tokens
above .049285014729090575; direct-read repetition below 43/72 when evaluable;
latest-path ledger omission below 66/73 when evaluable. Zero qualifying reads or
missing traces make the corresponding mechanism test inconclusive. Compare to
the historical candidate descriptively; no new control runs. Perfect quality and
untouched confirmation remain separate, unmet gates. These proposed thresholds
must be frozen in the prospective registration before execution.

## Radical branch remains separate

A task-derived exploration frontier with a deterministic visited-evidence ledger
can test a distinct exploration policy. Do not bundle it with H-L. First isolate
whether the existing coverage state is merely presented badly. The trace evidence
makes H-L the next incremental candidate; radical design can proceed independently.

## DAG and ownership

Reviewed result -> native retrospective registration -> H-L prospective record
-> candidate ledger implementation and replay -> independent candidate review
-> exact-source freeze and storage/window qualification -> live candidate run
-> native score and mechanism audit -> result/decision -> next hypothesis or
untouched confirmation. Research operator owns live process/storage guards.
Publication/release remain deferred; this evidence grants no runtime admission.

## Open Questions

Is missing ledger context causing repetition, or is the model independently
choosing verification? Does recent-first ordering hide older evidence needed for
exploration? Will reduced repetition translate into broader useful acquisition,
not merely earlier termination? Does the mechanism generalize outside these tasks?
