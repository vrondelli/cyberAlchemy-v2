# G01 BugSwarm r1 full-log filename cues — exposed acquisition screen

Status, 2026-10-04: **source-only candidate seal and separate evaluator-only
reach audit complete on the 24 already-exposed BugSwarm r1 cases.** This is
development evidence, not an independent benchmark, a rerank-quality result,
or a product superiority claim. The original logs and diffs remain
transport-provisional because their payloads came over unauthenticated HTTP.

The [source-only extractor](../research/arb-trace2code-r1/screen-bugswarm-full-log-cues-r1.py)
(SHA-256 `1852f6f2394e04d96e06241e649ac4f77ca8d3508e7823eb96d2f15e604cfbdd`)
used the pinned failure logs and complete ARE source-file ranking for each
case. It resolved explicit `.py`/`.java` filename tokens to a unique tracked
source path by basename or suffix, excluded test files, then selected at most
ten paths by mention frequency, first offset, and path. It read no evaluator
gold, made no model call, and did not change the original 1 KiB query or r1
packets. Its 24-case private `SOURCE-CUES.jsonl` SHA-256 is
`6b2a645fd525fe96b07acde1baa4b52a588a9af84e0718dcc8eeb8a230b93734`;
the source seal is
`ee0fb3eec38a0278a14c985b9beb6f2bbe4b94e0c4e2fd2dc2d6e1f8d3175447`.

The separate [evaluator-only auditor](../research/arb-trace2code-r1/audit-bugswarm-full-log-cues-r1.py)
(SHA-256 `bde0f18325f952e13e842d1bb2b6271b6c63d93c931f17679714a3a2ce2cfd69`)
required the exact original evaluation SHA-256, source seal, 24 matching case
IDs, per-case ranking hashes, unique valid cue paths, and parity between the
original top-ten ARE reach and the original candidate-union reach. Its private
receipt SHA-256 is
`fe9c20efb2b3b4f212919417999cd6e003cb3dd908b592d6ff2e7efe5b6969af`.
All private files are under
`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/exposed-full-log-cues-r1/`.

| Candidate reach on the exposed 24 cases | Cases with any gold file |
| --- | ---: |
| Original ARE+chunk top-ten packet | 13/24 |
| Original packet plus up to ten full-log cue paths | **20/24** |

The seven newly reachable cases were ordinals 1, 4, 6, 9, 11 (Python) and
18, 19 (Java). The four remaining misses were Java ordinals 13, 16, 17,
and 20. The cue rule selected at least one path on 23/24 cases. This is an
**upper bound on possible rerank rescue**, not a measured MRR@8 gain: extra
paths may displace useful candidates, exceed the 8K prompt budget, create
false positives, or incur unacceptable full-log parsing/index cost. No
new GLM selection, native delivery, provider spend, or matched end-to-end
cost measurement occurred. The 24 cases remain exposed and cannot be reused
as fresh confirmation.

The result changes the development target from simply increasing BM25 rank
depth to a source-grounded full-log cue policy. Any next policy should be
frozen and costed on exposed data, including deterministic packet composition
and tokenizer admission, then tested on a prospectively selected, repository-
disjoint, label-screened BugSwarm cohort. Independently validating or
reproducing the original HTTP log/diff payloads remains a claim prerequisite.

## Open Questions

- Can the additional cues fit a fixed 8K packet and improve actual MRR@8
  against the stronger ARE ranker, rather than only candidate reach?
- What source-only mechanism can reach the four remaining Java cases without
  gold-conditioned tuning or an unbounded candidate budget?
- Can the source logs and diffs be authenticated independently of the HTTP API
  before any external claim?
