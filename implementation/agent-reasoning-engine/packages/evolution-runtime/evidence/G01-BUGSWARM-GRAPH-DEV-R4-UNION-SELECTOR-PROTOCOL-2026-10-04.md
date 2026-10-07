# G01 BugSwarm graph development r4 — candidate-union selector protocol

Status: fixed before r4 packet generation, tokenizer calls, GLM calls, or
evaluator read. This is the same exposed 24-case development cohort, not fresh
confirmation, ContextBench, live ARE, or product superiority. The reserved
24-repository confirmation partition remains unopened.

## Hypothesis and frozen construction

The r2 graph order is the prior. For each case, append to its first 30 files
the previously unseen files in r3's first 30, preserving each source order.
The resulting source-only union is at most 60 paths. Candidate IDs are assigned
in that order. A path's evidence is its r2 and r3 ranks (or `-` if absent)
and one source-grounded excerpt: among nonblank, non-import, non-comment
source lines, choose the earliest line with the most query-token overlap,
then include that line and its following two eligible lines, capped at 120
characters. If no eligible line exists, use an empty excerpt. The prompt
contains the unchanged <=1 KiB r2 query, all union candidates, and asks GLM
to return only `{"candidate_ids":[...]}` with at most eight distinct IDs.
No gold, patch, evaluator receipt, or earlier model output enters the packet.

After a valid response, output selected paths in model order, followed by all
remaining r2 paths in r2 order, then remaining r3 paths in r3 order. Complete
coverage is required. Invalid response counts invalid; no repair/retry. The
builder must seal exactly 24 packets before evaluator access or any model call.

Packet admission requires all 24 prompts <=20,000 UTF-8 bytes, all candidate
paths source-resolved, <=60 distinct candidates per case, and same-account
`glm-5.3-flash` tokenizer proof of prompt + 512 output reserve <=8,192 tokens
for every case. Tokenizer attempts are capped at 24, generation at 24, no
automatic retries, and provider failure stops dispatch. Summed prompt tokens
must be <=130,000; all 24 generation responses must be valid. Generation uses
low reasoning effort and at most 512 output tokens. Archive request/response
hashes, token counts, elapsed time, and private raw receipts.

## Advancement gate

On 24/24 valid predictions, require MRR@8 >=0.43234 (r2 no-regression),
>=16/24 case wins against unchanged ARE, positive lower bound of the paired
repository-unit 20,000-draw bootstrap 95% interval versus ARE, and top-30
gold reach >=20/24. Report r4-minus-r2 and its losses separately. All cost
and validity bounds above must also pass. A pass is only exposed-development
qualification; independent confirmation and authenticated/reproduced source
evidence remain required before any superiority claim. A failed component is
reported as failed, not relaxed post hoc.

## Open Questions

- Does the 8K window admit the full union with useful source evidence?
- Can GLM retain r2's early wins while ranking r3's newly reachable files?
- Can source provenance be strengthened beyond the HTTP-provisional logs and diffs?
