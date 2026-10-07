# G01 r57 functionality-query result

Status: complete; advancement gate failed  
Population: 48 exposed BugsInPy r1+r2b cases  
Claim ceiling: exposed mechanism evidence only

## Outcome

All 48 source-only packets passed same-account tokenizer admission. All 48
`glm-5.3-flash` generations returned a 20–400-character plain-text summary
under the frozen format check; no raw-query fallback was used. Known usage was
15,025 prompt and 1,648 completion tokens, with 120.866 seconds summed
generation latency. The WSL SweRank embedding pass completed over the sealed
735 r56 document windows in 1,776.153 seconds. All 48 rankings were sealed
before evaluator labels were opened.

| Arm | MRR@8 | Hit@3 | recall@20 |
| --- | ---: | ---: | ---: |
| A — ARE + chunk RRF | 0.26746 | 17/48 | 0.75347 |
| B — raw-query SweRank fusion | 0.25047 | 17/48 | 0.75347 |
| C — functionality-query SweRank fusion | 0.29995 | 20/48 | 0.75347 |

C-minus-B MRR@8 was `+0.04948`; the 24-cluster 95% bootstrap interval was
`[+0.00298, +0.10809]`. C-minus-A was `+0.03249`, interval
`[-0.01567, +0.08636]`, with 10 cluster wins, 10 ties, and four losses.
The frozen gate required at least `+0.05` versus A, a positive cluster lower
bound, and at least 14 cluster wins. It failed on all three conditions.

The format check did not establish semantic fidelity. One of 48 summaries
included a source-like path copied from its failure log despite the prompt
request not to name a file. No summary was repaired or excluded post hoc.

## Decision

Functionality extraction improved the semantic arm over raw-log embedding and
raised early-hit quality, but it is not yet a qualifying replacement for the
ARE + chunk baseline. A next exposed fusion experiment may combine the
independently sealed raw and functionality semantic rankings using a single
fixed rule. Candidate acquisition must also be addressed: the r56 fixed
top-20 union omitted every gold path in 12/48 cases. Among those, three had
a gold path inside either original ranker's top 15 and eight inside top 30.

## Evidence

- Provider packet seal: `functionality-query-r57/packets/PACKET-FREEZE.json`
- Provider run: `functionality-query-r57/provider-run/RUN-RESULT.json`
- Source seal: `functionality-query-r57/source-run/SOURCE-SEAL.json`
- Evaluation: `functionality-query-r57/EVALUATION.json`

These paths are relative to the private WSL BugsInPy benchmark archive.

## Open questions

- Does fixed raw-plus-functionality semantic fusion reduce harmful demotions?
- Which candidate acquisition method reaches the four cases beyond both
  rankers' top 30 without excessive context or CPU cost?
- Can the 29.6-minute CPU embedding stage be indexed or accelerated without
  altering the comparison?
