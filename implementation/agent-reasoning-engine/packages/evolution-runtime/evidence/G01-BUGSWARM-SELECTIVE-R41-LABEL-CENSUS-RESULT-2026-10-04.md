# G01 BugSwarm selective r41 label census result — 2026-10-04

Status: complete population diagnosis  
Claim ceiling: exposed diagnostic evidence only; no benchmark score or superiority claim

## Result

The r41 census completed its prospectively bounded nine GitHub comparison
requests for r40 ordinals 16–24. All nine responses matched the frozen failed
and passed commits, exposed complete file lists, and contained at least one
changed Python/Java old-side path that exists in the failed-source Git index.

Combining those receipts with r40 accounts for all 24 slots:

- admissible for failed-source localization: **23/24**
- inadmissible: **1/24**
- sole inadmissible case: ordinal 15,
  `OpenNMT-OpenNMT-py-19529228404`
- reason: its relevant changed language file was added by the repair and does
  not exist in the failed source

No passing-source checkout was opened. No score or model call was made, and no
gold path was exported to the VPS.

## Interpretation

The original r40 24-case evaluation remains terminal and failed; r41 neither
repairs nor retrospectively changes its denominator. The census shows that the
failure is localized to one target-existence defect, rather than a general
comparison-label failure.

The unchanged 23 admissible cases may support a separately named, explicitly
exposed diagnostic score. Such a score must include every admissible case,
retain ordinal 15 in the population audit, and cannot be reported as a fresh
confirmation or product superiority result. A future qualifying population
must apply this target-existence screen before ranking or model dispatch.

## Receipts

- protocol SHA-256:
  `35a0c63a7725e5c49ecdcbaa5a2e1c2faeba6420c58510a12dc733e5011e0ac6`
- acquisition script SHA-256:
  `718b0ed7119fbdf72f2730e32b45028eec2c6a250b4a6ce119a84a0789947d9e`
- census freeze SHA-256:
  `18b2b9fa8ca1c2f023decb646a455d108e90ea81ff53df852f00e2c2808ce634`
- census result SHA-256:
  `88f011f1c532609e633e0f6a023c23c8894068babd4655436c64e38c200bf78e`
- private evidence root:
  `/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28/evaluator-census-r41`

## Open questions

- How do the four already frozen r38/r39 retrieval variants score on the full
  23-case admissible diagnostic subset?
- Does a future, independently selected and pre-screened cohort confirm any
  observed retrieval gain?

