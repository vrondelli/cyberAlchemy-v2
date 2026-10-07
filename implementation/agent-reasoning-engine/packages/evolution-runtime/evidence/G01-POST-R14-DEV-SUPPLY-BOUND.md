# G01 post-r14 development supply bound

This is a source-only feasibility calculation, not a benchmark run or a
superiority result. It conservatively treats all 24 r14-selected tasks as
exposed, including the 11 not attempted after the terminal stop. It preserves
the 233 reserved confirmation IDs and the existing clean-label rule.

## Pinned inputs

| Input | SHA-256 |
| --- | --- |
| [Pre-r14 development cap census](/home/vlad_/are-benchmark-archive/g01-r14-dev-cap-r1-20261002/RESULT.json) | `e1316479dee8ff9e7843875f8793518007f2f1c836cd0a7d299d39ec5d29065d` |
| [r14 source-only screen manifest](/home/vlad_/are-benchmark-archive/g01-r14-dev-screen-r1-20261002/SOURCE-ONLY-MANIFEST.json) | `68604bf7b00a65472efbbd4e45733b3a91c48cf8f4c4c4d1df7f4047cea4374c` |
| [r14 gold-lineage eligibility](/home/vlad_/are-benchmark-archive/g01-r14-dev-screen-r1-20261002/GOLD-LINEAGE-ELIGIBILITY.json) | `182cc3cf29858a205d0a6e9ed4c28f9f0dd9a1c3c9a33386bde22f7cc86959fd` |
| [r14 selected candidate](/home/vlad_/are-benchmark-archive/g01-r14-dev-candidate-r1-20261002/g01-r14-clean-cohort-candidate-r1/COHORT-CANDIDATE.json) | `014c2cb62ac545b91adb123aa5a7494fb197d0e826effdad06217c3a48fa7845` |

The prior census counted 23 known-clean and 198 unscreened source-valid
development tasks. The r14 screen consumed 67 of the unscreened tasks and found
22 clean. The r14 candidate selected 24 clean tasks: 14 from the prior-clean
set and 10 from the newly screened set. Thus 21 known-clean and 131 unscreened
source-valid development tasks remain after conservative r14 exclusion.

Per-origin subtraction gives the following feasibility bounds. The upper bound
assumes *every* remaining unscreened task is clean; it is not a prediction.

| Maximum tasks per git origin | Known-clean slots | All-unscreened-clean upper bound |
| ---: | ---: | ---: |
| 2 | 8 | 10 |
| 3 | 12 | 15 |
| 4 | 15 | 20 |
| 5 | 17 | 25 |
| 6 | 18 | 30 |
| 7 | 19 | 35 |
| 8 | 20 | 40 |

At the r14 cap of three per origin, a fresh 24-task r15 cohort is impossible
even under the optimistic upper bound. A cap of four is also impossible. A
cap of five is only theoretically possible and would require at least seven
more clean slots among the unscreened tasks. Any cap change is a new protocol
decision, not a continuation of r14's frozen cohort or a claim about the
original ContextBench population. No model calls, new gold inspection, or
source fetches were made for this calculation.

## Open Questions

- Which prospective population and origin-diversity rule should be frozen for
  the next G01 development campaign? The current cap-three/24-task combination
  has no fresh supply.
- Before freezing a successor, should the exposure scanner be rerun on the VPS
  to confirm no later cross-branch manifests consume additional tasks? This
  calculation uses the pinned pre-r14 census plus the r14 screen and candidate.
