# G01 BugSwarm r27 selective-GLM exposed efficiency screen

Status, 2026-10-04: **promising post-hoc hypothesis; requires untouched
transfer**. This evaluator-only simulation made no provider call and does not
modify or strengthen the independently reviewable r25 accuracy result.

The [r27 auditor](../research/arb-trace2code-r1/audit-bugswarm-fresh-r27-selective-glm-exposed.py)
pins the r25 evaluation, unchanged ARE and graph-r2 ranking seals, generation
summary, and tokenizer summary. It verifies every case identity and individual
ranking hash, reconciles all 24 per-call token/time receipts to their run
summaries, and applies one source-only policy:

> Call GLM only when the unchanged ARE and graph-r2 top-ranked paths differ;
> when they agree, use the graph-r2 ranking without a tokenizer or generation
> request.

This rule was selected after inspecting exposed r25 outcomes. It was **not**
predeclared for r25 and must not be described as a validated improvement on
that cohort. The private numeric `SELECTIVE-GLM-AUDIT-R27.json` SHA-256 is
`cf8bfff11f3fa0691aa3ed5ce95b4f73cf44c39a053ae352956add1a759dada1`.

| Exposed simulation | Always GLM | Selective policy |
| --- | ---: | ---: |
| GLM calls | 24 | **20** |
| MRR@8 | **0.72361** | **0.72188** |
| Difference from always GLM | — | −0.00174 |
| Generation tokens avoided | — | **14,354 / 89,883** |
| Summed generation time avoided | — | **11,688 / 53,509 ms** |

Tokenizer work for the four skipped cases would also avoid 14,023 prompt
tokens and 1,088 ms, reported separately rather than double-counted with
generation usage. The selective policy's paired MRR@8 difference versus ARE
is **+0.57044**, with repository bootstrap 95% interval
**[+0.41448, +0.72361]**, 19 wins, five ties, and zero losses. Versus graph-r2
it is **+0.19097**, interval **[+0.07083, +0.33125]**, with nine wins,
14 ties, and one loss. Its paired difference versus always GLM is −0.00174,
with interval [−0.02083, +0.01563]. These are exposed descriptive results,
not an independent non-inferiority test.

The next legitimate step is a prospectively frozen untouched transfer. Before
opening labels, fix the same top-1-consensus rule and require a full admitted
denominator, valid responses for every dispatched call, at least four of 24
calls skipped, selective MRR@8 no more than 0.02 below always GLM, and positive
paired lower bounds versus unchanged ARE and graph-r2. Report end-to-end
ranking, tokenization, generation, acquisition, and archive time separately.
The always-GLM arm must use the same packets and retained responses so the
selective comparison does not require duplicate model calls.

Passing such a transfer could add a bounded **efficiency-at-retained-accuracy**
claim to G01. It would still not establish ContextBench, live-ARE, G02/G03,
patch-resolution, or broad product superiority, and it would still require
Vlad and Dave review plus a separate publication decision.

## Open Questions

- Can enough repository-disjoint BugSwarm cases remain after all conservative
  exposure exclusions to form another 24-case untouched cohort?
- Does top-1 consensus skip at least four cases and retain accuracy when fixed
  prospectively, rather than merely fitting r25's exposed outcomes?
- What is the selective policy's complete wall-clock and storage cost when
  acquisition and archival are included?
