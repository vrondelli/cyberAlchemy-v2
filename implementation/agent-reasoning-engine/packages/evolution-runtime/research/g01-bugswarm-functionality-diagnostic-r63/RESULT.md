# G01 r63 exposed BugSwarm Python diagnostic

Status: complete; descriptive diagnostic, no advancement gate.  
Population: all 16 source-localization-admissible Python cases from r62's
sealed 17-case BugSwarm source ranking. Ordinal 15 remains r62's terminal
added-file admission failure and is not scored here.

| Arm | MRR@8 | Hit@3 | recall@20 |
| --- | ---: | ---: | ---: |
| A — ARE + raw chunk BM25 | 0.10417 | 4/16 | 0.64063 |
| D — r61 fixed functionality acquisition/rank | 0.14583 | 5/16 | 0.72396 |

D–A MRR@8 was `+0.04167`, with repository-bootstrap 95% interval
`[0.00000, +0.09375]` and 3/13/0 case wins/ties/losses. Three cases gained
early-rank MRR; functionality retrieval added gold-file recall in several
others but lost recall in one case. The interval's lower bound is **not
positive**, and this 16-case score cannot pass r62's frozen all-17 gate.

Interpretation: directionally favorable cross-dataset mechanism evidence,
weaker than the BugsInPy development effect and not a superiority result.
New cohorts must pre-screen old-side label existence before model spend.
Do not tune r61 weights or a selective guard on these 16 exposed outcomes.

Private evidence: `functionality-transfer-r62/R63-DIAGNOSTIC.json` under the
BugSwarm WSL archive; it pins r62 source rankings and r41 direct Git-tree
label census.

## Open questions

- Can a new, fully admitted 24-case population show a positive paired gain
  under the unchanged r61 rule?
- Does fuller failure evidence or structural retrieval explain the many ties
  without harming the cases that already improved?
