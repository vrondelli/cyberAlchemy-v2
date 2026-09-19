# Radical source acquisition protocol review R2

Verdict: the hints-only, pinned-base treatment is specific enough to select as a prospective candidate. The remaining deterministic rules below must be resolved in registration before claiming an exact ranking/index contract. No implementation or live admission; no model/evaluator calls. R1 remains unchanged.

## What is resolved

Optional acquisition is explicit; no enforced pre-edit phase is claimed. The index searches previously unread repository content, unlike archive retrieval. Hints carry only locations, revision/hash and scores, with no source bytes or read handles. Subsequent native base reads alone acquire receipt-confirmed evidence. Base-only indexing avoids edit invalidation: current edits do not mutate the pinned corpus. Same issue-resolution duties, output/model/phase budgets, shared workers and suspended controls remain intact.

Independently reran read-only `git ls-tree -rlz` on all four configured pinned commits. Every retained inventory SHA256, blob count, total bytes and largest-blob size reproduces. Largest tree:7,773 blobs/21,912,833 bytes; largest blob:4,601,979 bytes. These figures do not prove UTF-8 eligibility, postings capacity, memory or build time.

## Exact decisions needed in registration

1. **Window algorithm.** “Adjacent matched lines,” a40-line cap and5-line context margins do not uniquely specify splitting or context trimming. Define a deterministic sequence: identify match runs; split overlong runs with a fixed stride; add context under a stated priority; merge in source order under the40-line cap; then rank once. State whether counts refer to pre-merge or final windows, and prevent duplicate windows. Include long runs, nearby runs, file boundaries and overlapping context fixtures.
2. **Path-only matches.** Under the written formula, a query matching a filename scores every line in that file, even with zero text matches. This can legitimately generate many tied windows and crowd out text hits. Either retain this deliberately with exact bounded enumeration, or specify a distinct path-only fallback window rule. Do not silently implement only text-posting candidates, which would contradict the stated scoring.
3. **Normalization and arithmetic.** Pin camelCase/acronym splitting order and regex, Unicode/runtime version, query-byte bound before normalization, first-occurrence order for the128 distinct-token cap, natural-log choice, full-precision ranking and rounded score serialization. Define empty-file behavior and whether path tokens contribute df even with no text lines. Add a bound/handling rule for exceptionally long tokens and lines; posting count alone does not bound term-storage memory.
4. **Atomic corpus admission.** Define a posting as one distinct(file,line,term) entry or another exact unit; specify path-posting charging separately. If a file exceeds remaining total/posting budget, reject it atomically and stop subsequent admission, or explicitly record partial-file ranges. A hint's full-file hash must never hide incomplete indexing. Compute N/df from precisely admitted content. Excluded-mode/encoding entries and unprocessed remaining entries need separate counters. A bounded enumerator cannot promise exact remaining count unless it continues bounded counting; otherwise report an explicit unknown/lower bound.
5. **Resource enforcement.** Name the actual isolated-worker enforcement mechanisms. A60-second deadline can terminate the worker; RSS polling is monitored admission with possible overshoot, not a hard512MiB quota. Choose an enforceable memory controller or describe the honest monitored bound plus margin. The128MiB output limit must include manifest, temporary files, partial artifacts and failure receipts, with reserved final-report space. Define whether an empty or partial index aborts or continues without hints, and preserve indexing cost/failure evidence.
6. **Tool admission and hint integrity.** No new *source-delivery* binder is needed, but the episode's exact toolset check and successful-tool admission allowlist currently reject rank_sources. Add explicit schema/admission integration. The current reducer has no hint units and would leave an8KiB result indivisible; specify whole-hint reduction, updated omission counts and metadata-only fallback or honest denial. Validate index/query digest and each hint against pinned index records without promoting it to source evidence. Define the query digest's exact input representation. Guard against forged read_id/observation fields; bind the exact requested native read separately.

A simple valid first implementation need not optimize ranking or guarantee all corpus fits. It must implement one explicit bounded rule and disclose exclusions. These are decisions within the chosen mechanism, not a request for another design branch.

## Minimal prospective registration requirements

Register the distinct optional-hints candidate, exact receipt-budget R2 ancestor, selected H-R and null/interpretation counterhypotheses, resolved rules above, same four task/source hashes and budgets, all-task perfect native-quality criterion and failure/stop rules. Record inventory build resources separately from model tokens. Keep acquired hints, native reads, admitted views, successful delivery, base projection and final selection distinct in the evidence plan. Preserve raw mapping-loss qualifications and every failed assignment.

Required fixtures include never-read-file discovery, hint-only zero delivery credit, exact subsequent base read, edits leaving base hints unchanged, deterministic windows/path-only ties, global-cap partial manifests, every resource limit, whole-hint reduction and forged/stale metadata. Then full production reconstruction/storage and real tokenizer qualification precede separate exact launch review.

No fresh controls, extra worker pool, reference-guided filtering, implicit test execution or causal single-component claim. More hints/reads cannot establish useful acquisition or quality.

## Exact reviewed bindings

- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/RADICAL-SOURCE-ACQUISITION-PROTOCOL-R2.md` — `1ee8c8d269b87d98071d3045147e83329d08fa0c016d0d7dc57fa12c7803a8ab`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/RADICAL-SOURCE-CORPUS-SIZES-R1.json` — `ba3e00737ba401875c4fa1255136d8a10286860ec9cfc9fb9a18dce5d12113c7`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-admission-r1.mjs` — `c11ccad82f8631112cc0e98817065a6049f7deaf3abdf60868dcc60413d63375`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-delivery-r1.mjs` — `ac2aff4dee4348dec76562331267f20a3e5a137bd9da9e0a2d957fa5c8d48e20`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/receipt-budget-episode-r2.mjs` — `9a9401e411d8b114597023ac772c00206a7c0d0c0d002b6893ecfc29bd0716c1`
- `/home/vrondelli/projects/cyberAlchemy-v2/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/live-config.json` — `5d4e93fc24c652bfd4fcb865be2dcd98e4ef3f1bce86179be1fc145c265197b7`

## Open Questions

The six registration decisions above remain open. Corpus size is verified, not index capacity. Useful acquisition, semantic interpretation, perfect native quality,15% cumulative-token savings and untouched confirmation remain unproven. RADICAL-SOURCE-ACQUISITION-PROTOCOL-R2.md owns these questions.
