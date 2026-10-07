# G01 multi-view source retrieval development r1

## Hypothesis and fixed source-only pilot

Rank the expanded query, original trace, exception line and each bounded caller
snippet separately. Equal reciprocal-rank fusion k60 over each production top50;
add up to four missing paths from fused top20 to the unchanged caller-reader
candidate union. Same-width control adds exactly that many missing paths using
only the original expanded-query ranking. Preserve the entire base union.

Apply the same policy to all62 exposed cases:32 r3 and30 r4. Seal source-only
outputs before repeated gold scoring. No new providers or fresh labels. Pilot
advancement, fixed before repeated scoring: net >=2 mapped-file reachable cases
above width control, positive improvement in each cohort and no base reach
losses. These are source-development criteria, not confirmation quality gates.
Retain the known r4 incomplete mapping explicitly; do not omit that case or
claim that mapped-file reach proves complete-label correctness. Passing can
motivate stronger comparator/reader development, never fresh superiority.

## Research grounding and distinction

[RepoCoder](https://arxiv.org/abs/2303.12570) studies iterative retrieval and
generation for repository-level code completion. [AutoCrashFL](https://arxiv.org/abs/2510.22530)
studies source-exploring crash localization. These motivate inspecting repository
evidence beyond a single blended query; neither evaluates this deterministic
multi-view algorithm or justifies transferring reported performance to ARE.
The source-only method here uses no generated queries or model calls.

## Completed result — 2026-10-06

The fixed source-pilot gate **failed**. Three pure generator tests passed;
Python compilation passed. All62 exposed cases were source-sealed before repeated
gold reads. Per-case treatment/control candidate counts match, maximum28; no
base candidates or cases were dropped. No provider calls followed.

| Cohort | Base reachable | Multi-view | Width control |
|---|---:|---:|---:|
| r3,32 cases | 30 | 30 | 30 |
| r4,30 cases | 28 | 29 | 28 |

Only JacksonCore-7 became reachable beyond the control. Net gain1 fails the
required2, and r3 has no positive gain. No base reach losses. The JxPath-7
incomplete gold mapping remains flagged; all numbers are mapped-file reach,
not complete-label accuracy or confirmation. Do not promote this exact method
or spend on a reader/fresh cohort for it.

[Source seal](/home/vlad_/are-benchmark-archive/defects4j-caller-r4/MULTIVIEW-SCREEN-DEV-R1.json):
`3aca0cef0edd4bf50ab5669aba70b2b2801bfa7585ce496d55cd11eee584fedd`.
[Reach score](/home/vlad_/are-benchmark-archive/defects4j-caller-r4/MULTIVIEW-REACH-DEV-R1.json):
`de0257e6d044424afa07255d1ac71744fe6d928c12e68c33245d73f182fe6201`.
The distinct [iterative source-feedback follow-up](G01-DEFECTS4J-ITERATIVE-SOURCE-DEV-R1.md)
also failed; it does not replace or repair this result.

Implementation: [generator](../research/arb-trace2code-r1/screen-defects4j-multiview-dev-r1.mjs),
[tests](../research/arb-trace2code-r1/screen-defects4j-multiview-dev-r1.test.mjs),
[post-seal scorer](../research/arb-trace2code-r1/score-defects4j-multiview-dev-r1.py).

## Open Questions

This decomposition recovered one target beyond widening, but did not advance
across both cohorts. Next question: can explicit source symbol/dependency
navigation resolve repository relations that keyword views miss? Do not spend
on a reader or fresh confirmation for this exact method. Other unresolved work:
representation of modified classes absent from buggy source, reader evidence
coverage, live ARE integration, G02 quality/cost and broader G03 transfer.
