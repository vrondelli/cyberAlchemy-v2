# G01 BugSwarm Java class-stem cues — exposed r3 screen

Status, 2026-10-04: **source-only 24-case screen and separate evaluator-only
reach audit complete; insufficient alone to justify another GLM dispatch.**
This is a diagnostic on the already-exposed r1/r2 BugSwarm population, not
an independent quality result, fresh cohort, or product claim. The original
HTTP-served log/diff payloads remain transport-provisional.

The [source-only script](../research/arb-trace2code-r1/screen-bugswarm-java-class-stems-exposed-r3.py)
(SHA-256 `1d16ce416b1bbb4eb0522c1255726ed03201214faedeab579361216174bd1e20`)
read the pinned full failure logs and complete ARE-ranked source universe,
never gold. For each Java case it matched CamelCase log tokens to a uniquely
named non-test `.java` source file, excluded a fixed set of generic terms,
and selected at most ten paths by mention count, first offset, then path.
Python cases were retained with empty cue lists to preserve the 24-case
denominator. The 24 source rows and seal have SHA-256
`c594e02045ab104e656eb00b4d9c3bfc2a41bb0b81feb67169c288bf9d622dd2`
and `4d2218e7e4329fcb72cb8ff8198492b0673e4963fda75c1343165b73e97ecbfa`.
No model call or packet change occurred.

The separate [evaluator-only auditor](../research/arb-trace2code-r1/audit-bugswarm-java-class-stems-exposed-r3.py)
(SHA-256 `d214164435cab62c1d0d4df0f3f0c527f2002795340499d609dfb6605a49fea1`)
compared the sealed cues with the unchanged r2 packet and pinned r1 gold.
Its receipt SHA-256 is
`e7450d47c8a9ea3bcb465d4de62bcf8eed9e368bb13d8f536d1813ce964fff84`.
An independent `jq` join reproduced the counts. All private files are under
`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/exposed-java-class-stems-r3/`.

| Exposed candidate ceiling | Cases with any gold file |
| --- | ---: |
| Existing r2 packet | 20/24 |
| r2 packet plus all top-ten Java class-stem paths | **21/24** |

Only ordinal **17** was newly reached. Java ordinals **13, 16, and 20**
remain unreachable by this union. The screen created new non-r2 paths on
11/12 Java cases, so its low incremental gold yield is not explained by a
failure to produce candidates. Adding these paths would increase packet
size and false-positive opportunities; there is no tokenizer admission,
GLM score, delivered read, or measured gain for an r3 packet. The previous
[r2](G01-BUGSWARM-CUE-RERANK-EXPOSED-R2-RESULT-2026-10-04.md) gate remains
failed at 12/24 ARE wins versus 16 required. Do not weaken it or represent
the r3 reach ceiling as a new superiority result.

This narrows the next research question: another literal name-matching
variant is unlikely to resolve all four r2 misses. A source-only mechanism
must connect failure evidence to source files not named in the log—perhaps
through bounded code relations or retrieval—while also controlling packet
noise and improving the already-reachable cases. Any further exposed
development remains diagnostic; fresh confirmation needs a separately
frozen, disjoint, label-screened cohort and independently validated log/diff
provenance.

## Open Questions

- Can a source-grounded relation or retrieval rule recover Java 13, 16,
  and 20 within a small fixed candidate budget without gold-conditioned
  selection?
- Can the reranker improve four more repositories than r2 without losing
  its existing quality gains or exceeding the 8K/cost limits?
- Which untouched BugSwarm cases have independently verifiable original
  logs and diffs for a valid transfer claim?
