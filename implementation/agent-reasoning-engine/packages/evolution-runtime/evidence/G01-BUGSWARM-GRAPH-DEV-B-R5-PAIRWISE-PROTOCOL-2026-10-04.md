# G01 BugSwarm cohort B — source-grounded pairwise selector protocol

Status: fixed before cohort-B GLM calls. Cohort B is a separate 24-repository
private **development** population. Its evaluator aggregate has already been
viewed; it is not an untouched holdout. The reserved confirmation partition
remains unopened. This protocol does not authorize ContextBench, live ARE,
publication, or a superiority claim.

## Inputs and source-only packet

Use the sealed B-r2 code roots and queries, unchanged graph-r2 rankings, and
unchanged test-edge-r3 rankings. Reuse the original r4 packet construction
rule: ordered union of each ranking's top 30, complete candidate IDs, source
path, both ranks, and one deterministic query-overlap source excerpt per
candidate. The listwise prompt is at most 20,000 UTF-8 bytes, with no gold or
evaluator input. Record the exact packet and builder hashes. Candidate reach
is the union's top-30 gold reach, evaluated only after the packet is sealed.

## GLM calls and selector

Run on the VPS against `glm-5.3-flash` through the already-pinned HTTPS
transport. First admit each listwise packet with the same-account tokenizer:
prompt tokens plus a 512-token output reserve must be at most 8,192. Make
one listwise call per case, no retries, with a 512-token output cap and low
reasoning effort. Parse the entire response as exactly
`{"candidate_ids":[...]}` with at most eight distinct IDs. Accept integer
IDs, canonical decimal-string IDs, or exact listed paths only. Invalid
responses count invalid and are not repaired. The raw listwise complete
ranking is selected paths in returned order followed by unselected graph-r2
paths in graph-r2 order.

If the listwise first path differs from graph-r2's first path, make exactly
two additional pairwise calls, one in each A/B order. Each prompt contains
the same failure query, the two exact candidate paths, their r2/r3 ranks,
and their source excerpts from the sealed packet. The prompt asks which
implementation file is better supported by the supplied evidence and
requires exactly `{"choice":"A"}` or `{"choice":"B"}`. A pairwise
response is valid only if HTTP 200, finish reason `stop`, and that exact
JSON shape. Promote the listwise alternative above graph-r2's first path
only when **both** swapped calls select the alternative. Otherwise retain
graph-r2's first path and then append the listwise ranking without duplicates.
If the listwise first path already equals graph-r2's first path, use the
listwise complete ranking and make no pairwise calls. The pairwise rule is
source-grounded comparison, not an oracle or post-hoc gate.

Maximum calls: 24 listwise plus 48 pairwise; maximum output tokens: 512 per
call; no automatic retries. Sum all provider prompt/completion tokens and
model-call time. Stop on transport failure; parse-invalid responses remain
invalid and dispatch continues. Freeze raw responses and complete rankings
before evaluator access. Do not expose gold paths, ranks, or score feedback
to either prompt.

## Development evaluation and next gate

Score all 24 cases, counting invalid listwise selections as graph-r2 fallback
and reporting that fallback separately. Report MRR@8, Hit@3, top-30 reach,
paired wins/ties/losses, repository-unit 20,000-draw paired-bootstrap 95%
intervals versus ARE and graph-r2, rank-1 preservation/new wins, total known
tokens, and summed model-call time. Compare the raw listwise and pairwise-
guarded outputs, including the cost of the guard. A candidate for a separately
frozen confirmation run must have 24/24 terminal cases, no integrity defect,
positive MRR@8 lower bound versus ARE, at least 16/24 wins versus ARE,
no negative MRR@8 lower bound versus graph-r2, and at least 20/24 top-30
gold reach. These are development-advancement criteria, not product claim
criteria; a failed component rejects advancement. Do not retune this rule on
cohort-B scores and call the same cases independent confirmation.

Original BugSwarm logs/diffs are HTTP-transport-provisional. A later claim
requires independently admitted provenance, untouched confirmation,
end-to-end ARE/comparator parity, and full token/time accounting under a
separate frozen protocol.

## Open Questions

- Will the r2/r3 top-30 union reach 20/24 on cohort B?
- Can swapped source-grounded pairwise calls preserve correct graph-r2 rank-1
  files without suppressing genuine listwise gains?
- Can provisional HTTP logs/diffs be authenticated or independently
  reproduced before any public superiority claim?
