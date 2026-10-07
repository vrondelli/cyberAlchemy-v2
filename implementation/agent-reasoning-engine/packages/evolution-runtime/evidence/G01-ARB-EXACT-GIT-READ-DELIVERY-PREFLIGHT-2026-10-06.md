# G01 ARB exposed exact-Git read delivery preflight

Status: **one-case deterministic tool-path and 8K admission pass; no accuracy
or superiority claim.** This checks an implementation boundary left open by
the [matched official RepoMap development comparison](G01-ARB-OFFICIAL-REPOMAP-MATCHED-EXPOSED-2026-10-06.md).

The [replay](../research/arb-trace2code-r1/replay-exposed-gin-exact-read-r1.mjs)
(SHA-256 `8ba72bab5b9f3e0925ca883083ebc6d3ec21b727f9edb4c011f932fe61dac1e8`)
selected exposed Gin pilot ID `e843a55e790138194506b76a`, where the
sealed GLM and ARE top-three rankings differ. It acquired the public
`gin-gonic/gin` checkout at exact base commit
`a4ac275e079d46d493965491d686bfe72d121e85`, verified clean HEAD,
and called the actual ContextBench `repository-tools.mjs` `read_file`
implementation with `revision: base` and 50 lines at the best sealed
source-chunk start for each ranked path. Six of six calls succeeded. The
GLM-ranked paths were `context_test.go`, `context.go`, and
`binding/form_mapping.go` (3,631 delivered source bytes); ARE's were
`go.mod`, `gin.go`, and `context_test.go` (4,010 bytes). No gold was read.

The private 13,492-byte `READ-REPLAY.json` is under
`/home/vlad_/are-benchmark-archive/arb-v2-trace2code-20261004/exposed-gin-exact-read-replay-r1/`
at SHA-256 `5042c3e93b0bef59270715fea8ec94d15689247a3568b7ce49d04f0e75554a3e`.
Its `SOURCE-SEAL.json` is SHA-256
`36986fb6ab7c417fdd11e10230bece1598e8fbd31d4754e3c23872ccc9e92c8e`.

The [VPS-only tokenizer](../research/arb-trace2code-r1/tokenize-exposed-gin-exact-read-r1.mjs)
(SHA-256 `6d28030649c8ad3fd6ab0afc7312580c41a598379f977a49e5b751ef0034448c`)
used the existing pinned Node v24.10.0 binary and same-account GLM-5.3-flash
tokenizer. Both packets admitted under the 8K prompt-plus-512-reserve rule:

| Exposed arm | Prompt tokens | Plus reserve | Admitted |
| --- | ---: | ---: | --- |
| GLM-ranked reads | 1,141 | 1,653 | Yes |
| ARE-ranked reads | 1,626 | 2,138 | Yes |

The VPS `TOKENIZER-PREFLIGHT.json` and its private WSL cold copy have matching
SHA-256 `fa655afd266eed45d94080eff87a9675ee24576947b2ea8a0356cd0a0f1695c1`.
There were two tokenizer calls, **zero generation calls**, and no secret
material was written to the receipt. The VPS stage is under
`/opt/are/evolution-runtime/arb-exposed-gin-exact-read-tokenize-r1/`.

This proves only that one already-exposed ranking can be delivered through
the real base-revision read tool and fit an 8K request. The paths were
replayed from sealed rankings; an agent did not choose them in a live ARE
episode. The source-chunk starts and one-case denominator may differ from
an end-to-end agent policy. No fresh population, quality score, all-in
cost comparison, ContextBench score, or product superiority follows.

## Open Questions

- Can a frozen G01 policy drive these reads in a full live ARE episode and
  retain an advantage over matched RepoMap and ARE under 8K?
- Which untouched, repository-separated failure-trace set can test that
  policy without reusing the exposed ARB labels?
