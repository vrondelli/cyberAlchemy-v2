# G01 BugSwarm Java import neighborhood — exposed r4/r5 screen

Status, 2026-10-04: **source-only pool and two separately sealed source-only
rankings audited against evaluator-only gold; no model call or delivered
read.** This remains development on the 24 already-exposed BugSwarm r1/r2
cases, not independent confirmation, ContextBench, official RepoMap, live
ARE, or product superiority. HTTP-served original log/diff payloads remain
transport-provisional.

The [r4 source-only pool builder](../research/arb-trace2code-r1/screen-bugswarm-java-import-neighborhood-exposed-r4.py)
(SHA-256 `600c0034198472c985ec35e08329686b9a745e3e820cdd5072ec2fe5e31ba43c`)
used the sealed r2 packet and r3 class-stem paths as seeds. On each of the
12 Java cases it verified the exact projected source-tree digest, parsed
bounded package/import headers, then collected direct imports from seeds
and reverse imports into seeds. Python cases remained in the denominator
with empty pools. No evaluator data entered candidate generation. Its
private `SOURCE-POOL.jsonl` and `SOURCE-SEAL.json` SHA-256 values are
`119922f2e00ac099cf87c582f39f44a8f50886ab8839850003a7cd4a89a70234`
and `98f5d024decff20a19359b3618751740f85fbb1a3e8a3a0815fe00d8b9c781c9`.

The [separate evaluator-only pool audit](../research/arb-trace2code-r1/audit-bugswarm-java-import-neighborhood-exposed-r4.py)
(receipt SHA-256 `863f36c55293f66a0390990bcb08fecb62b566c501edb7cc7fa80c6d2e4d19eb`)
found two new gold-reachable cases, Java ordinals **16 and 20**, both
through direct imports; 20 was also in the reverse pool. Together with
the earlier literal class-stem cue for ordinal 17, the exposed ceiling
rose from **20/24 to 23/24**. Only Java ordinal **13** remained unreachable
by this union. These were unranked pools of **30–1,464 files** per Java case
(median 233), far too large to send directly to GLM.

A first [source-only ordering](../research/arb-trace2code-r1/rank-bugswarm-java-import-neighborhood-exposed-r4.py)
put direct-import paths before reverse-only paths, then used the unchanged
ARE full-file rank. Its evaluator-only audit found the two newly reachable
gold files at pool ranks **14** and **2**, so top ten recovered only one.
The ranking seal SHA-256 is
`c9fe27dc49387470cf71863791ca11effd6b30bc70ff49a16b981ae3be00056b`;
the private rank audit is
`8173ec35912f3217dd88a1a16a3149b1ee92540e9945c6acaed97f8058774282`.

The separately versioned [r5 source-only degree ordering](../research/arb-trace2code-r1/rank-bugswarm-java-import-degree-exposed-r5.py)
counted how many distinct seed files imported each direct neighbor (and
how many seed classes each reverse neighbor imported), then broke ties by
ARE rank and path. Its ranking and seal SHA-256 values are
`112629fa2351330d9a79dc81826c082740e9a2f94f05a12026928d8d789f6c89`
and `44c2edb17e8278e0601b5e0e39b07b06305f943afc467ed8280af75c2d37fd0a`.
The [evaluator-only r5 audit](../research/arb-trace2code-r1/audit-bugswarm-java-import-degree-exposed-r5.py)
(receipt SHA-256 `bbfcaa86297728b3f680640607403fb21ee1ca518ce15a7401065ec298764089`)
found ordinals **16 at rank 6** and **20 at rank 4**: both are within a
fixed top-ten import-neighbor budget. All private source and audit files
are under
`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/exposed-java-import-neighborhood-r4/`.

This is a candidate-acquisition and ordering signal only. Appending ten
import neighbors to the r2 packets reaches **22/24**; including the r3
class-stem cue as well reaches **23/24**. At the r5 boundary neither
combination was a sealed compact model packet. The later r6 packet and
[terminal exposed result](G01-BUGSWARM-HYBRID-R6-EXPOSED-RESULT-2026-10-04.md)
are recorded separately. The r2 improvement
gate remains failed at 12/24 ARE
wins versus 16 required. Do not relax it, send the entire import pool, or
call these exposed top-k findings fresh superiority evidence.

The r5 next boundary was source-only, bounded packet composition preserving
r2 cues and including r3/r5 Java additions. R6 below addresses local packet
composition; its subsequent tokenizer/generation result is linked below.
A fresh claim still needs a
separately frozen, repository-disjoint, label-screened cohort plus
independent validation of the HTTP log/diff payloads.

## r6 hybrid rank and compact packet — exposed development

The separately versioned [source-only r6 ranker](../research/arb-trace2code-r1/rank-bugswarm-hybrid-exposed-r6.py)
used equal-weight reciprocal-rank fusion with `k=60` over the r2 packet order,
full-log cues, class-stem cues, and r5's first ten import neighbors for Java;
Python kept its r2 order. It opened no evaluator data and capped each Java
ranking at 30 candidates. The private source ranking and seal SHA-256 values
are `a6d456a8d998df85164412a1b344ddf79f0716853cb93d22b46a8f54ee66c764`
and `a9c1be13e45394b7c77453b56e013bbcfdef820bef4ec040f9539e96502c67a9`.

The [separate evaluator-only r6 audit](../research/arb-trace2code-r1/audit-bugswarm-hybrid-exposed-r6.py)
found **23/24** gold-reachable packets versus **20/24** in r2, with **zero
lost r2-reachable cases**. The three newly reachable cases are Java ordinals
16, 17, and 20, at r6 candidate ranks 21, 23, and 9. Java ordinal 13
remains unreachable. The private audit receipt SHA-256 is
`f59293fa6b52e09814a0e1b2c5bbd91fde3eaca48e9b4fcbffdc727a28368ca8`.
This is exposed candidate reach, not GLM ranking quality.

The [r6 source-only packet builder](../research/arb-trace2code-r1/build-bugswarm-hybrid-packets-exposed-r6.py)
retained Python r2 prompts and rebuilt Java prompts from the r6 order with
bounded excerpts. All 24 packet candidate IDs, ordered paths, and prompt-line
counts matched; maximum candidate count was **30** and maximum prompt size
**15,212 bytes**. The private packet and seal SHA-256 values are
`5dd0f9f92348211dff92d401e3018f0f88cf5c278dc120d8692776cc24d99b9e`
and `fd1ab5a039a5345b61e9d556a5ddd79723ff66ed2d88ef795e1b75a1ad680cdc`.
All twelve Java packets fit with the first fixed 260-character excerpt cap;
the smaller fallback caps were unused. These are local byte/candidate checks,
**not same-account tokenizer admission** at the packet-construction boundary.
The later [r6 exposed result](G01-BUGSWARM-HYBRID-R6-EXPOSED-RESULT-2026-10-04.md)
records 24/24 valid GLM calls and a failed advancement gate; it is not a
superiority claim. The private artifacts are under
`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/exposed-hybrid-r6/`.

## Open Questions

- Can a compact packet include the r3 class-stem cue and r5 top-ten import
  neighbors without displacing r2's wins or exceeding the 8K/cost ceiling?
  R6 preserved r2's exposed candidate reach and passed the 8K/cost admission,
  but did not increase ARE wins or newly reachable Java MRR as required.
- What source-only relationship could reach Java ordinal 13 without a
  gold-conditioned rule or unbounded pool?
- Can a new matched cohort verify a substantial advantage under official
  RepoMap and live ARE delivery/cost comparisons?
