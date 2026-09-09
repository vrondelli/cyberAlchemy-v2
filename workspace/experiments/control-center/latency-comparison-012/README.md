# WLC-012: durable campaign state and population evaluation

Product-construction candidate. campaign.mjs provides createCampaign, appendEvent,
readCampaign and evaluate APIs; it does not launch desktops. The exported evaluator
validates normalized records, not their provenance. Native artifact import and
exact product-budget binding are still prerequisites to using it for a campaign.

## Persistent contract

Each campaign directory contains immutable-by-convention identity.json and an
append-only events.jsonl. Each event binds identity, sequence and previous-event
hash. Writers acquire an exclusive directory lock, validate the complete proposed
transition, append and fsync. A surviving lock, partial tail, changed event or
unsettled reservation fails closed; there is no automatic recovery or history repair.
The hash chain detects ordinary drift, not malicious rewriting of the whole store.

reserve assigns the next AB/BA order (A baseline, B uninstrumented); settle must
account for every reserved arm in order. Duplicate run IDs, mixed identities,
invalid metrics, semantic mismatch and false host rejection fail validation.
Host qualification is recomputed from raw observations using the owned policy.
Native failure stops future reservations and requires unrun successors to be
explicitly recorded. A complete arm is omitted from subsequent reservations.

Reservation counts are conservative: every reserved arm consumes one of its 60
slots, including rejected and unrun arms. Crashes cannot silently reclaim slots.
This does not increase the existing attempt ceiling; it may exhaust a campaign
earlier than counting actual process launches alone. Rejected attempts retain
reasons and never contribute timing samples. Timing never determines host rejection.

Exactly 40 qualifying sessions per arm are required. Each normalized session
currently carries exactly one cold-handshake aggregate. Only then are nearest-rank
p95 values (38th sorted value of 40) and baseline-minus-control delta emitted.
The research threshold stays <=1 ms. Completion blocks further reservations;
threshold PASS is arithmetic on supplied records, not product approval or a claim
of native empirical validity. Existing product budgets are not changed or replaced.

## Validation

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-012/campaign.test.mjs
```

Nine tests cover fixed population arithmetic, threshold failure, rejected slots,
60-slot exhaustion, order/identity/sample failures, native failure stop, asymmetric
completion, durable restart, writer exclusion, interrupted tails and hash drift.
Temporary synthetic stores are removed by the tests; no previous native evidence
or production data is deleted. No native campaign was run in this slice.

## Two-lane frontier

Construction completed here: persistent campaign API and normalized population
evaluator. Next runnable construction: an exact raw-artifact importer and runner
adapter that reserves before launch, binds host/receipt/semantic/closeout evidence,
and settles every attempted or skipped arm. Bind the exact fixture, product budgets,
runtime and protocol before enabling empirical evaluation. This is the current
causal blocker to native campaign use, not a blocker to further implementation.

Operational support: Workspace test operator owns a qualifying host window for
future collection. The prior host rejection does not block these deterministic
tests. Full product tests, owner approval, lab reconciliation, commit, publication
and release remain separate pending decisions. Selected D01/D03/D08 scaffolds are
inherited unchanged; no ontology admission occurs. Research-evidence-harness keeps
the fixture result separate from native performance evidence. authority_effect none.
