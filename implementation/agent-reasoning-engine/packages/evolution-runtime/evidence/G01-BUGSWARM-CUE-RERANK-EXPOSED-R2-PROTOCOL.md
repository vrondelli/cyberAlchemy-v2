# G01 BugSwarm full-log cue rerank — exposed r2 development protocol

Status, 2026-10-04: **fixed before any expanded-packet generation call.**
This reuses all 24 scored r1 BugSwarm cases and is therefore exposed
development, not a fresh replication, original ContextBench, official
RepoMap, live ARE, or an external superiority claim.

## Fixed source and packet

Use the exact [r1 source and label lineage](G01-BUGSWARM-TRANSFER-R1-PROTOCOL.md),
24 cases in 24 distinct repositories (12 Python, 12 Java). No case may be
removed, replaced, or reselected. The original r1 packets are SHA-256
`ee0d6ff047426241b6533e5938f7da97219a6f64336b13e354b739c68e6baa76`.
The separately sealed [full-log cue screen](G01-BUGSWARM-FULL-LOG-CUES-EXPOSED-R1-2026-10-04.md)
is SHA-256 `6b2a645fd525fe96b07acde1baa4b52a588a9af84e0718dcc8eeb8a230b93734`.
The [source-only expanded builder](../research/arb-trace2code-r1/build-bugswarm-cue-packets-exposed-r1.py)
preserved every original candidate, prompt instruction, failure excerpt and
source excerpt. It appended up to ten distinct cue paths in fixed source-only
order, using the original 120-line/420-character source excerpt rule. It
opened no gold and made no model call. The 24-packet SHA-256 is
`ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7`;
the packet seal is
`1fc2f018504531db7392af47cb6eafc7a2975c51508e978b80e10de4d5b4a87c`.
The largest packet has 29 candidates and 17,605 bytes, below the fixed
18,000-byte cap. No evaluator path or gold content was transferred to the VPS.

Same-account GLM tokenizer admission completed **24/24**, maximum 4,197
prompt tokens plus the fixed 512-token output reserve, under the 8,192-token
limit. Total prompt tokens are 71,784 versus 56,410 in r1 (1.273×).
The VPS `TOKENIZER-RESULT.json` SHA-256 is
`ed64632718e02ec37881e5bc2fc13c3fdb2ec942b3c41a41c1054c371d4bbe9c`;
the freeze is
`c358f68a631d324284c10c3b77c89c5130da76f7d3df3b0eeb50aafbf4f70061`.
All 26 tokenizer files are checksum-matched to private WSL cold storage under
`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/exposed-cue-packets-r1/tokenizer-vps-r1/`.

## Generation and evaluation rule

Use GLM-5.3-flash through the pinned VPS transport, low reasoning effort,
`max_tokens: 512`, one generation call per case in ordinal order, no
automatic retry or case replacement. Stop on transport failure. A response
is valid only if HTTP 200, stop finish, and exact JSON object
`{"candidate_ids":[...]}` with up to eight unique, in-range integer IDs.
Preserve raw provider response hashes, request hashes, usage and elapsed time
privately. The runner must verify exact packet and tokenizer hashes before
dispatch; it cannot open evaluator files.

Only after all generation responses are sealed may a separate evaluator
join the unchanged r1 gold labels. Score selected candidate paths first,
then complete the ranking from the unchanged ARE full-file order without
duplicates. Per case, MRR@8 is the reciprocal rank of the first gold source
file in the first eight, or zero. Retain all 24 cases and compare with both
the original ARE ranker and r1 GLM rerank. Use the r1 deterministic 20,000-
draw paired repository-unit bootstrap seed and percentile definition.
Report Hit@3, Recall@20, newly reachable-case outcomes, validity, known
tokens and summed call time; these are not all-in workflow costs.

The exposed-development advancement gate for spending a *fresh* cohort is:

1. All 24 one-shot generations and unchanged labels are valid.
2. Expanded GLM minus ARE MRR@8 is at least **+0.10**, with paired 95%
   lower bound above zero and at least **16/24** repository wins (the r1
   quality bar, unchanged).
3. Expanded GLM minus original r1 GLM MRR@8 is at least **+0.10**. This is
   a development screen, not an independent causal estimate because both
   runs reuse cases and provider sampling varies.
4. At least **four of the seven** previously unreachable cases newly
   reached by the cue packet have positive MRR@8.
5. Known prompt tokens are at most **1.5×** r1 and there are at most 24
   generation calls. Tokenizer admission already established the prompt
   condition; the run must still verify its bound and report completion usage.

A failed gate rejects this particular packet policy for fresh dispatch. A
pass licenses only a separately selected, repository-disjoint, label-screened
confirmation design. The existing unauthenticated HTTP log/diff payloads
must also be independently validated before any external claim. Publication,
release, and product-page wording remain separate decisions.

## Open Questions

- Can GLM actually rank the newly reachable gold files within eight, rather
  than being distracted by additional false-positive candidates?
- If this exposed screen passes, which untouched BugSwarm repositories have
  independently verifiable logs/diffs and a complete 24-case denominator?
- How do official RepoMap and live ARE episode comparisons behave under
  matched query, source, delivery and cost accounting?
