# H-R2: ranked source hints with native evidence reads

Candidate construction specification. Supersedes the R1 design for the next
radical candidate, preserving R1 and its review. Native registration and
implementation remain pending. No live admission or new workers.

## Objective, treatment and falsifiers

Keep perfect native span/file quality on all four fixed tasks, known cumulative
model-token accounting, and untouched confirmation as requirements. The original
15% reduction target remains unproven; fresh controls stay suspended.

Ancestor: receipt-budget R2 controller, episode and production path. The treatment
adds a pinned-base source index, deterministic ranked hints and a separately named
rank_sources tool. It does not index the read archive. Acquisition is optional:
the model may ignore hints. Do not claim an enforced pre-edit acquisition phase.

H-R: ranked hints about previously unread sources improve useful acquisition and
allow all four tasks to reach perfect quality inside the existing budget.
Counterhypotheses: lexical matches distract or repeat known files; acquired source
is misinterpreted or omitted during final selection. Any nonperfect fixed outcome
falsifies the strong quality claim; provider failure fails completion without
isolating the search mechanism. Report union coverage, final F1, completion and
total model tokens separately; read counts alone are not success.

## Corpus and snapshot contract

Enumerate the assigned pinned Git base tree in bytewise path order, from public
task/repository inputs only. No evaluator labels, answer patches, historical
gold-derived paths or hidden tasks enter construction or ranking. Index base only.
Existing current-source reads and edits remain available; hints always identify
the base commit and base content SHA256. Never relabel a base hint as current.

Accept regular Git blobs (100644/100755) with valid UTF-8 text and no NUL bytes.
Reject symlinks, submodules, invalid UTF-8 paths/content and unsafe paths explicitly.
Do not use extension or generated-code heuristics in this first version: tracked
text is eligible regardless of language. Index artifacts live outside the tree.

Bounds per task: 10,000 tree entries, 8 MiB per blob, 64 MiB total admitted bytes,
2,000,000 line-term postings, 60 seconds build time, 512 MiB worker RSS,
128 MiB index output. Size evidence from all four pinned trees is recorded in
RADICAL-SOURCE-CORPUS-SIZES-R1.json: the largest tree has 7,773 blobs/21,912,833
bytes; the largest blob is 4,601,979 bytes. Encoding and postings capacity are
not yet proven.

Enumerate all entries up to the entry cap; record every considered path and its
admission/exclusion reason and counts. Exclusion precedence: mode, path, size,
encoding, then total/posting budget. Reaching a global cap stops index admission
in sorted order and marks the manifest partial with remaining-entry count.
Hard time/RSS/output exhaustion fails the build with persisted bounded failure
evidence; it must not silently produce an apparently complete index.

## Deterministic ranking and response

Normalization: NFKC, split ASCII camelCase boundaries, lowercase, tokenize maximal
Unicode letter/number runs and underscore-separated identifiers. Retain tokens
of length >=2, no stop-word list. Cap normalized query to first 128 distinct
tokens, with explicit omitted-token count. Empty query yields no hits.

For each source line, score the sum over matching distinct query terms:
(1 + log((1 + N)/(1 + df(term)))) multiplied by 3 for a path match and 1 for a
line-text match; N is admitted file count, df is files containing the term in
path or text. A term may contribute both weights. Scores <=0 do not produce hits.
Group adjacent matched lines into windows of at most 40 lines, beginning at the
first match, with at most 5 preceding and 5 following context lines where possible.
Rank windows by their maximum line score, then UTF-8 path bytes, then start line.
Merge overlapping windows in the same file if the merged range stays <=40 lines.
Return at most 5 hints; no pagination in R2. Pin numeric serialization in tests.

Each hint contains path, base commit, content SHA256, start/end line and score.
Return no source text, read_id, retrieval handle or observation object. Include
index digest, query digest, partial-index flag, total matching-window count and
omitted count. Limit response JSON to 8 KiB by dropping whole trailing hints;
reject a request if even metadata cannot fit. Ordinary prompt admission may
further omit tool output and must preserve honest omission information.

## Native integration and evidence

Add rank_sources as a distinct tool; never disguise it as literal search.
The initial prompt describes the tool and index completeness in a summary capped
at 256 measured tokens. No automatic tool calls or model decisions are fabricated.
The additional schema and summary are included in full 8K request admission.

A model must use existing read_file with revision=base and the hinted range to
acquire the bytes. Those actual tool outputs enter the unchanged confirmed
observation, archive, projection and export chain. Ranking/indexing alone earns
zero source coverage or export credit. Unknown/forged hint fields fail validation.
There is no new source-text delivery adapter in this version; add explicit tests
that rank_sources cannot masquerade as a read. Native read/edit/get-patch duties
are unchanged. No test-execution tool is added.

Preserve receipt-budget R2's 192 request-tokenizer/32 final reserve and separate
512 index-tokenizer/32 reserve, pending accounting and no-retry behavior. Index
construction uses no model calls. Keep GLM profile, 2048 output cap, 8K requests,
96K/96 calls per task, 88K/95 exploration + 8K/one final, 384K campaign and shared
two-worker ceiling. No budget transfers or new control arm.

## DAG and construction gates

Design review → prospective native hypotheses/experiment/schedule → bounded index
and ranking tests → tool/episode integration → production evidence reconstruction
and storage tests → exact freeze/review/real qualification → four-task run →
all-cost native score/census/decision → untouched confirmation when ready.

Discriminating tests: empty read archive plus query hit in never-read file;
ranked-but-unread hint gives no evidence credit; subsequent native base read
receives exact source identity and bytes; current edit cannot change base hints;
omissions, invalid encodings, forged hint/read identities, every resource bound,
deterministic ties, output reductions and no-hit behavior are covered. Register
a distinct candidate identity before construction reaches model execution.

Product owner: research coordinator. Current frontier: review and registration,
then bounded index implementation. Research operator owns live storage, source
identity, exact launch review and process settlement. Receipt-budget generation
continues independently; a radical run must wait for the shared worker capacity.
No release work is on this critical path.

## Open Questions

Will measured postings/memory/build time fit the pinned corpora? Can the existing
toolset equality checks be extended additively without letting hints acquire read
credit? Does the model use hints effectively, and does gained acquisition survive
interpretation and final selection? Perfect quality, transfer beyond code and the
original matched efficiency target remain unproven.
