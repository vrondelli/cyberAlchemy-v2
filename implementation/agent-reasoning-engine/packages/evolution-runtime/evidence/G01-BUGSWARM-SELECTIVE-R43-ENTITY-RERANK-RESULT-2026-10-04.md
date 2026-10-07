# G01 BugSwarm selective r43 entity-card rerank result — 2026-10-04

Status: complete, independently sealed and audited; advancement gate failed  
Claim ceiling: exposed mechanism development only

## Result

R43 preserved every frozen graph-r2 candidate set and replaced generic file
excerpts with bounded declarations, imports, and query-matching source lines.
All **23/23** prompts passed the live 8K tokenizer gate and all **23/23**
one-shot GLM responses passed independent JSON and identity validation.

| Exposed 23-case population | graph-r2 | Entity-card GLM |
| --- | ---: | ---: |
| MRR@8 | 0.41304 | **0.55228** |
| Hit@1 | 5/23 | **10/23** |
| Hit@3 | 12/23 | **15/23** |
| Top-30 reach | 22/23 | 22/23 |

Mean paired RR@8 improvement was **+0.13923**, with nine wins, six ties, and
eight losses. The prospectively frozen 200,000-draw paired interval was
**[−0.04348, +0.33851]**. Because its lower bound crosses zero, the r43
advancement gate failed. The independent audit reproduced every rank, metric,
interval, and gate outcome.

By language, the descriptive MRR@8 results were:

- Python: 0.54167 → 0.62351 over 16 cases
- Java: 0.11905 → 0.38946 over seven cases

These language subsets were not separate prospective claim populations.

## Cost and reliability

- tokenizer admissions: 23/23
- valid generations: 23/23
- known prompt tokens: 70,132
- known completion tokens: 1,213
- summed generation time: 54.220 seconds
- automatic retries: zero
- maximum packet prompt: 15,606 bytes
- source/gold data transferred to VPS: none

The first packet-build attempt was terminated before sealing after an
unbounded Java method regex exhibited pathological backtracking on vendored
JNA source. The repaired builder uses bounded line-by-line Java matching and
completed all packet construction in 6.2 seconds. Only its incomplete freeze
receipt was removed before the named repaired attempt.

## Diagnosis

The treatment solved important ordering failures, including several graph
gold ranks between 12 and 25, but also displaced strong graph candidates. An
explicitly post-hoc sweep preserved graph prefixes of zero through eight
before applying the already sealed GLM selection. The first zero-loss variant
kept graph ranks 1–4 fixed:

- guarded MRR@8: 0.44679
- mean gain: +0.03375
- interval: [+0.00870, +0.06501]
- wins/ties/losses: 5/18/0

This prefix was chosen after outcome inspection and is therefore only a
hypothesis for a distinct development transfer. It does not repair r43 or
support confirmation.

## Integrity receipts

- protocol SHA-256:
  `927c69a06ed097afcd7868d65d6a4b7fb1df90dc26c85d8a65a7f25b68864e29`
- repaired packet builder SHA-256:
  `f6781792d07cb4ea25e083732e192529d5cb7ac3c07300ca44642e567e34025b`
- packets SHA-256:
  `878e4f058a7d79a9cdd1eb1360f2ae8b3a1abf721de619071fdfce89c3d56492`
- packet seal SHA-256:
  `1ac5b372ea4fb33f4cb68805b09fc386845b8e2f9b1b6911a528a7467631c790`
- VPS runner SHA-256:
  `c955ba2ffa2b2c5492ce825d8e09709df4f0b66c1ccba2108b40f328e51eb382`
- run result SHA-256:
  `1c18769b1ca08c77f7da05cb415e3b89974fa6e218c720a5d44558952144a61d`
- predictions SHA-256:
  `2b4a482362f471964ea63ee56de7f1162c7dc804fcff092bfa3a0577f7bff93b`
- prediction seal SHA-256:
  `12311365b7ad247e27d855d4701b8aedb0880219a607564a1ffafafabfe5d448`
- evaluation SHA-256:
  `17789eddcbff33636bc3e751898fbf0198c44d066a25e2027b5ef2d09e82cd49`
- independent audit SHA-256:
  `f59a66633597dd8c6635afc1b6a4ea05dd857d7fcecdd8d4a13532103695b2bb`
- post-hoc guard diagnosis SHA-256:
  `bec517676a0223fe96db371668b6f88206147aaf7fd0329a67d9c06b1c325738`

Private WSL evidence:
`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28/entity-r43`

The checksum-identical VPS run remains at
`/opt/are-benchmark-runs/g01-selective-entity-r43`.

## Next benchmark

Transfer the unchanged entity-card construction and the prospectively fixed
four-file graph prefix guard to a distinct, already exposed development cohort.
Only a successful transfer may justify freezing a new untouched confirmation
population. Raw r43 remains failed regardless of the transfer outcome.

## Open questions

- Does the four-file prefix guard retain any meaningful gain outside r43?
- Are the large Java improvements stable in a larger Java development sample?
- Can a source-grounded confidence test outperform a fixed prefix without
  repeating the failed pairwise-verifier pattern?

