# H-R4: ranked source hints with native evidence reads

Candidate construction specification. Supersedes the R3 design for the next
radical candidate, preserving R1/R2/R3 and their reviews. Native registration and
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
Additional native eligibility: exclude blobs above 2,000,000 bytes with explicit
reason native-file-size, before loading content. The 8MiB construction ceiling
remains an outer bound, not permission to emit unreadable source hints.
Reject symlinks, submodules, invalid UTF-8 paths/content and unsafe paths explicitly.
Do not use extension or generated-code heuristics in this first version: tracked
text is eligible regardless of language. Index artifacts live outside the tree.

Bounds per task: 10,000 tree entries, 8 MiB per blob, 64 MiB total admitted bytes,
2,000,000 line-term postings, 60 seconds build time, 512 MiB worker virtual address space,
128 MiB index output. Size evidence from all four pinned trees is recorded in
RADICAL-SOURCE-CORPUS-SIZES-R1.json: the largest tree has 7,773 blobs/21,912,833
bytes; the largest blob is 4,601,979 bytes. Encoding and postings capacity are
not yet proven.

Enumerate the complete tree within the inventory/entry caps; record every considered path and its
admission/exclusion reason and counts. Exclusion precedence: mode, path, size,
native file-size eligibility, encoding, then total/posting budget. Reaching an admitted-byte/posting cap stops file admission
in sorted order and marks the manifest partial with remaining-entry count.
Hard time/address-space/output exhaustion fails the build with persisted bounded failure
evidence; it must not silently produce an apparently complete index.

A dedicated Python worker verifies Linux RLIMIT_AS=512 MiB before loading source
blobs; the parent enforces a 60-second wall deadline and kills/settles the worker
process group on timeout. This is an address-space limit, not an RSS guarantee.
No silent restart or unbounded in-process fallback is permitted. Pin Python
executable/version in the candidate freeze and test actual limit failure.

Bound the Git inventory stream to 8 MiB, manifest to 8 MiB and total worker output
to 128 MiB including a 64 KiB failure/finalization reserve. Count all enumerated
entries before admission; exceeding inventory bytes or entry count fails the
build rather than claiming a remaining-entry count that was never observed.
Bounded failure evidence must remain writable when ordinary output is exhausted.
The parent owns final failure persistence if the worker cannot allocate memory.

## Deterministic ranking and response

Normalization order: reject raw UTF-8 query longer than 4096 bytes; NFKC; split
ASCII lowercase/digit-to-uppercase and acronym-to-capitalized-word boundaries;
lowercase; tokenize maximal Unicode letter/number runs with underscore as a
separator. Retain tokens of length >=2, no stop-word list. Keep first 128 distinct
query tokens in occurrence order and report omitted-token count. Empty normalized
query yields no hits. Query digest is SHA256 of UTF-8 canonical JSON containing
the exact raw query; index identity binds the pinned normalizer version.

Posting unit: one distinct (term, file, line) triple, with line zero reserved for
path terms. df(term) counts each admitted file once whether term occurs in path,
text or both. N is admitted file count. The temporary postings of each file are
bounded; admit all its bytes/postings or exclude the whole file atomically.
A global budget exclusion marks the index partial. No partially indexed file may
look complete.

For each text-matching line, score the sum over distinct query terms:
(1 + log((1 + N)/(1 + df(term)))) multiplied by 3 for path presence and 1 for
presence on that line; a term may contribute both weights. Quantize to integer
score_units=round(score*1e9) before ranking/serialization, using the pinned Python
runtime's round and natural log. Order ties by UTF-8 path bytes then start line.

Within each file, anchor at the earliest uncovered line containing a query token.
Set start=max(1,previous_window_end+1,anchor-5), end=min(line_count,start+39).
Apply the native byte-fit rule below, then consume all matching lines through
the fitted end and repeat. Windows are disjoint and no merge step follows. Window score is the maximum score of matching lines it covers.
If a file has no text matches but has a path match, emit exactly one path-only
hint covering lines 1..min(40,line_count), with the path-weighted score.
Do not create a path-only hint for an empty file. Path matches never generate a
hint for every line. Rank all windows and return at most 5; no pagination in R4.

Native byte-fit rule: split source lines exactly like native read_file (LF only,
remove the last empty element when text ends with LF). A matched line whose
UTF-8 bytes exceed 32,768 is not a readable anchor; count it separately as
unreadable_matching_lines. For a candidate window, advance start toward its
anchor while its joined UTF-8 size exceeds 32,768, then reduce end until the
window fits. Never remove the anchor. Context is expendable, matching source is
not. Compute joined size as the sum of line bytes plus one LF between lines.
Native TextDecoder strips an initial UTF-8 BOM; the index may conservatively
count its three bytes, which cannot produce an oversized native read.

If a path-only file's first line exceeds the native byte limit, emit no fallback
and increment unreadable_path_fallbacks. Otherwise shorten its end to fit.
Count matching_windows only after native eligibility; unreadable line/fallback
counters remain separate from omitted ranked hints. Query-response reduction
preserves those counters. Source hints still contain no source bytes and grant
no delivery credit. These eligibility changes are prospective R2 research
amendments; they do not change any scored predecessor.

Each hint contains path, base commit, content SHA256, start/end line and integer score_units.
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

Additive episode integration must extend exact toolset equality and unknown-tool
validation for rank_sources explicitly. A separate admission adapter validates
the closed hint schema and query/index binding, counts whole hints as reduction
units, drops trailing hints only and updates omission counts. Failed tool results
stay failed. Hint metadata must never be accepted by observationItems, the
delivery binder, coverage ledger or terminal exporter as source observations.
Test this through saved native prediction reconstruction, not just unit schemas.

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
