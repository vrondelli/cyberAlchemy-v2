# G01 BugSwarm selective r40 terminal result — 2026-10-04

Status: terminal; frozen 24-case evaluation gate failed before scoring  
Claim ceiling: evaluator-admission diagnosis only

## Result

R40 froze all ranking inputs, label rules, metrics, bootstrap settings, and
advancement gates before opening evaluator evidence. The one-shot GitHub
comparison pass then stopped exactly at its first inadmissible case:

| Measure | Result |
| --- | ---: |
| attempted comparisons | 15/24 |
| identity-complete comparisons | 15/15 |
| admissible failed-source labels | 14/15 |
| first inadmissible slot | 15 |
| model calls | 0 |
| scores computed | 0 |

Slot 15, `OpenNMT/OpenNMT-py`, had an exact one-commit comparison from failed
SHA `84221b0126c346d21ae422b7abdcb8dfc592914f` to passed SHA
`54641186689cbca4aafa5935cdb0b9cc2f815077`. Its only changed file was the
newly added `onmt/modules/moe.py`. Because the file does not exist in the
failed-source snapshot, no source-localization ranker can retrieve it.

This is not a ranker miss. It is a cohort-eligibility failure discovered too
late in the pipeline. The frozen denominator required 24 admissible labels and
forbade metrics on a selected subset, so r40 is terminal and no partial score
was calculated.

## Integrity receipts

| Artifact | SHA-256 |
| --- | --- |
| r40 protocol | `fc6bc99459341bd32b9883b0ad459ff7022737420858a869875cecd3dd59cc36` |
| label acquisition runner | `7d48346ad31b6a37c9069e16f6828eb024ef556f82c2b8673acfb06c4e57d68c` |
| pre-request label freeze | `35cab2699fd1554aa32c75df5b722561a5d266886bb5ba91909f7158c541a70b` |
| terminal label result | `8140eba19fffce0b5613987582faef09d6774281a9d95269ad587666d7c40963` |
| slot-15 GitHub comparison | `3d6f221855a154e9f35dc3a26b7ab4fbb35be12950d0826aa614574b7b1a6f30` |
| slot-15 label receipt | `3a5ab2ba8c0d5b6541d08d49ebbb5bc299b2a4f81af41898fa080f38fd15bf0d` |

Private evaluator root:

`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28/evaluator-only-r40`

## Consequence

Future source-localization cohorts must perform an evaluator-isolated
**target-exists-in-failed-source** admission screen before expensive log,
archive, ranking, or model work. The screen may expose label paths to the
evaluator, but must export only an admission bit and opaque receipt to the
ranking side.

R40's first fourteen labels are now exposed evaluator evidence. The population
cannot be represented as untouched confirmation evidence even if slot 15 is
later replaced.

## Next step

Run a separately frozen remainder census for slots 16–24 without scoring. This
will measure the full label-admission defect rate and identify whether the
existing 24 cases remain useful as an exposed development population. Then
either:

- score every prospectively declared admissible case only as an exposed
  diagnostic, or
- construct a new label-screened population for qualification.

Any superiority claim still requires a distinct, fully admitted confirmation
population and independent review.

## Open questions

- How many of slots 16–24 have retrievable old-side source targets?
- Should added-only fixes become a separate repository-change benchmark rather
  than be excluded from source localization?
