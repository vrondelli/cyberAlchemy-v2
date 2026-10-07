# G01 BugSwarm r1 external trace transfer — terminal result

Status, 2026-10-04: **24/24 source, labels, matched standalone rankings,
GLM tokenizer admissions and GLM generations valid; predeclared improvement
gate failed.** This is a private, provisional source-projected
failure-output-to-code retrieval result, not original ContextBench Span-F1,
official RepoMap, live ARE, or product superiority.

The [prospective protocol](G01-BUGSWARM-TRANSFER-R1-PROTOCOL.md) was sealed
before rankings or provider dispatch, SHA-256
`8929d29cac3c03ccb9fb0a9344a9a227f4a0dc3558d8d5b6c1502e4ff671430b`.
The fixed 24-case/24-repository, 12 Python/12 Java campaign freeze SHA-256
is `f3d46be103d8917a8f8e9e755b05d8a7da1e7d7a09181fec3c00d1158ec14151`.
No case was substituted after admission. [Source, log and gold admission](G01-BUGSWARM-EXTERNAL-TRACE-POPULATION-FEASIBILITY-2026-10-04.md)
preceded the run, with gold paths isolated from model inputs. The 24 source
code roots were copied to a new private VPS run directory; `rsync -a
--checksum --dry-run --delete` reported zero differing paths before ranking.
No evaluator gold was sent to the VPS. The post-run source/response copy back
to private WSL storage passed the same checksum dry-run with zero differences.

The VPS ARE source ranker indexed all **26,186** projected code files over
the 24 cases, with full per-case coverage. The memory-bounded chunk BM25
control also ranked every file. Its output had exact rank-order parity with
the pinned full Snapshot implementation on one Python and one Java case.
The 24 source-only GLM packets were sealed at SHA-256
`ee0d6ff047426241b6533e5938f7da97219a6f64336b13e354b739c68e6baa76`,
packet-seal SHA-256
`be138a42969914a63a719b7ac50f5aa86f59c5a6ae5b9f6a4bd990ad23409bc4`.
Each packet held 10–19 candidate paths. All 24 prompts passed the 8,192-token
admission cap, and all 24 one-shot GLM-5.3-flash calls returned structurally
valid selections. Cases 14 and 17 validly abstained with `[]`, invoking the
frozen ARE-order fallback. There were no replacement calls.

Evaluator-only [scoring code](../research/arb-trace2code-r1/evaluate-bugswarm-transfer-r1.py)
(SHA-256 `2acc7ec69efcbdba4859e3e754486239c445cb464b85a91df844b3cdf8a8b0fc`)
verified packet, ranking, response and gold receipt identities before opening
scores. The private `evaluator-only-r1/EVALUATION-R1.json` is SHA-256
`d38225bb370301787492529745a35dcb38444399bcbf923e5da6bba3c30732b3`.

| Arm | MRR@8 | Hit@3 | Recall@20 |
| --- | ---: | ---: | ---: |
| ARE source-file ranker | 0.19831 | 0.20833 | 0.58333 |
| Local chunk BM25 | 0.07813 | 0.08333 | 0.37500 |
| GLM rerank + frozen ARE fallback | 0.24792 | 0.41667 | 0.58333 |

The primary paired GLM-minus-ARE gain was **+0.04960 MRR@8**, below the
predeclared **+0.10** minimum. The deterministic 20,000-draw
repository-unit bootstrap 95% interval was **[−0.02778, +0.12847]**;
it includes zero. There were **7 wins, 15 ties, 2 losses** against ARE,
below the required 16 wins. Thus all three quality components of the
advancement gate failed despite full execution validity. The paired
GLM-minus-chunk difference was +0.16979, interval [+0.06181, +0.29167],
but chunk was the weaker standalone arm and this does not repair the
predeclared gate.

The top-ten ARE + top-ten chunk candidate union contained a gold source
file in only **13/24** cases; the other **11/24** could not be rescued by
this reranker. Both ARE and GLM scored zero MRR@8 on those 11 cases. This
is the clearest next mechanism target: source candidate acquisition and
recall, then rerank quality. It is a diagnosis on an **exposed** cohort,
not an independent hypothesis confirmation. By language, the descriptive
MRR@8 values were Python 0.28968→0.32639 and Java 0.10694→0.16944
(ARE→GLM); no language-specific claim was predeclared.

A post-score evaluator-only [rank-depth census](../research/arb-trace2code-r1/diagnose-bugswarm-candidate-ceiling-r1.py)
(private receipt SHA-256
`ffb74aaa88439bc73cce09eeabb106fcbb7118dc1eb1401ad6bfaadee8e2b151`)
found gold in the union of the first *k* ARE and chunk files for
**13/24 at k=10, 16/24 at k=20, 18/24 at k=50, and 20/24 at k=100**.
ARE alone reached exactly 13/24 at k=10, so the chunk top-ten arm added
no gold-reachable cases to this packet. This is a ceiling diagnosis, not
a license to change r1's fixed packet or score a wider post-hoc rerun as
fresh evidence.

Known provider usage was **56,410 prompt + 1,158 completion tokens** across
24 generation calls; summed generation latency was **52.962 s**. The two
standalone rankers reported **20.906 s** (ARE) and **29.081 s** (chunk)
of ranking time. Source acquisition, transfer, tokenizer, and human review
costs are not included, so these are not all-in efficiency figures. The
extra GLM calls did not pass the quality gate and no cost superiority
claim follows.

The BugSwarm original logs and diffs came from an unauthenticated HTTP
endpoint; exact failed commits and gold-path existence were independently
checked through GitHub HTTPS, but the HTTP payloads remain
transport-provisional. This caps even a future positive score until
independent payload validation. No publication or product-page claim is
authorized by this result.

## Next research boundary

Use these 24 cases only as exposed development evidence. Diagnose which
pre-fix files the top-ten unions miss and test a source-only acquisition
mechanism under a bounded cost/coverage gate. Select any confirmation cohort
prospectively from as-yet-unused BugSwarm repositories, freeze source and
labels separately, and compare matched controls before making a new claim.
Official RepoMap and live ARE delivery remain separate gates. Do not rerun
the same 24 as fresh independent evidence.

## Open Questions

- Can a source-only acquisition step recover the 11 missing-candidate cases
  without excessive index, token or latency cost?
- Can original logs and diffs for a fresh BugSwarm cohort be authenticated
  or reproduced independently of the HTTP API?
- Will a prospective disjoint cohort show a meaningful paired improvement
  over the stronger ARE source ranker and survive matched RepoMap/live ARE
  evaluation?
