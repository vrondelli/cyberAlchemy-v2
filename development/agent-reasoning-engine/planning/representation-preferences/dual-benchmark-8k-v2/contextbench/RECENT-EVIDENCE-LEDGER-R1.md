# Recent confirmed evidence ledger candidate R1

Status: implemented and locally tested; not registered for live dispatch.
Hypothesis: [H-L and trace evidence](LEDGER-VISIBILITY-AUDIT-R1.md).
Objective: reusable evidence retention that improves native quality and total
model-token efficiency. Perfect quality, ≥15% token reduction and untouched
confirmation remain unproven. No fresh control runs.

## Implementation boundary

`recent-evidence-ledger-r1.mjs` calls the existing receipt/source-verified builder
and delivery binder. For each source version it finds the latest first-confirmed
receipt among that entry's observations, then orders entries newest first.
Replayed history cannot refresh an observation. Same-receipt ties use a stable
lexical source identity (path, hash, revision and base commit). Source versions
remain separate; all original coverage, integrity checks and observation IDs
remain unchanged. Private recency metadata is not added to the model prompt.

The existing renderer still enforces the 384-token/four-entry limit with complete
entry omission. An oversized leading entry can still leave the ledger empty;
this candidate does not change the fitting policy. Full-request admission remains
mandatory. The extra deterministic binding pass adds computation but no model
calls or model tokens by itself. Rendered content can change token size.

`recent-evidence-episode-r1.mjs` differs from schema-agreement episode R2 only in
its ledger import and saved candidate arm identity (success and failure).
Historical source, schema, retrieval, final selection, budgets and frozen results
are preserved. No production launcher has been switched to this episode.

## Validation

Eight focused tests passed: ordering, replay immunity, new-observation refresh,
version identity, unconfirmed requests, deterministic ties, source integrity,
and bounded rendering/failure behavior. Five episode tests passed using real
local repository tools and scripted model receipts: native export, hint-only
rejection, source/persistence failure accounting, and actual prompt ordering.
These tests use deterministic token counters, not the provider tokenizer.

[Offline replay](RECENT-EVIDENCE-LEDGER-REPLAY-R1.json) verifies hashes against the
approved result review, rebuilds every exploration ledger, and asserts that the
candidate only reorders identical entries. No reference answers or model calls.

| Task | Requests with latest path confirmed | Historical omissions | Candidate same-entry-count omissions |
| --- | ---: | ---: | ---: |
| 1 | 15 | 15 | 3 |
| 2 | 16 | 16 | 4 |
| 3 | 22 | 22 | 0 |
| 4 | 16 | 9 | 3 |

Total omissions: 62/69 -> 10/69 under identical entry counts. The earlier trace
audit used all latest returned paths (66/73); this replay excludes four requests
where the latest returned path was not confirmed in the reconstructed ledger.
Those denominators must not be mixed.

Same-entry-count output can have different byte and token lengths. This replay
is not a tokenizer qualification, behavioral improvement, or score improvement.
The stored byte counts identify cases requiring actual tokenizer checks.

## Construction DAG and next gates

Observed trace defect -> H-L candidate implementation/tests (done) -> native
retrospective schema-result registration -> H-L prospective hypothesis,
measurement contract and schedule -> independent candidate review -> exact
source freeze and real tokenizer qualification -> supervised candidate run ->
native score and mechanism audit -> result/decision -> next hypothesis or
untouched confirmation. Radical exploration policy stays a separate experiment.

Product frontier: native research registration and independent candidate review.
Runnable product work: verify candidate identity and prospective measurement
bindings; qualify the episode for the existing runner without changing budgets.
Research operator owns future provider/process/WSL-D preflights at launch.
No live provider action, publication, release, or new authority was performed.

## Open Questions

Will recent-first presentation reduce repeated reads and improve acquired recall
per model token? Will older useful evidence become harder to see? Will actual
384-token fitting retain the same-entry-count benefit? How should equal-recency
entries compete if only one fits? Oversized-entry policy remains an explicit
limitation, not an implicit completion claim.
