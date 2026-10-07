# G02 r11 relation-union three-read upper bound

Status, 2026-10-03: **evaluator-only exposed feasibility bound; no ARE read,
model call, native rescore, independent confirmation, or superiority claim**.

The [fixed audit](../research/g02-product-r4/audit-g02-r11-union-three-read-oracle-r1.py)
(SHA-256 `a0d3da77ab9b97a4e28fbc5ffcedcb5caa1833514a40f125c8c6552c3f4c4b64`)
joined the already sealed [relation union](G02-R11-RELATION-UNION-EXPOSED-2026-10-03.md)
with pinned native labels only inside the evaluator. It verified exact task,
base-commit, issue and delivered-path identity, and reproduced archived ARE
and DSH native file-count intersections for all 12 scored r11 tasks. The
private write-once counts/metrics receipt is
`/home/vlad_/are-benchmark-archive/g02-r11-union-three-read-oracle-r1/AUDIT.json`,
SHA-256 `8280a391b3c9046b6536cae118da42e9992dcde4fff9b25bb7f8a00293d47c4e`.
It exports no native gold paths.

The counterfactual preserves every archived ARE selection and false positive.
For each task it adds at most one, two, or three **read-cap-eligible** gold
files from the sealed relation union that ARE had not already selected. The
selector knows evaluator labels, so its precision and abstention are
unattainable by the current source-only policy. It also assumes no token,
time, or Span-F1 penalty from performing the reads.

| Mean File-F1 on 12 exposed scored tasks | Value |
| --- | ---: |
| Archived ARE | 0.535975 |
| Archived DSH | 0.563586 |
| Perfect union selector, at most one new read/task | 0.611111 |
| Perfect union selector, at most two new reads/task | 0.641015 |
| Perfect union selector, at most three new reads/task | 0.657323 |

Only **five of 12 tasks** have any eligible unselected gold file in the union.
The pool contains 12 such files; a three-read limit could admit **10** of
them with perfect selection (five with a one-read limit, eight with two).
The oracle's 0.657323 mean is 0.093737 above archived DSH, but that is an
upper bound on this exposed File-F1 set calculation, not achieved improvement.
Django's three-task mean would remain 0.822222 versus DSH 0.888889 even
under the oracle. Prior generic issue-anchor ranking found just **1 gold hit
in 33 proposals**, so the existing ranker is nowhere near this bound.

The result narrows the G02 frontier: merely sorting the 2,728 eligible union
candidates is not a justified next live campaign. A new source-grounded
localizer must sharply reduce the candidate set, identify linked code
elements and read windows, and abstain on unsupported tasks. It must then
pass an exposed quality-and-cost screen with actual ARE reads before a fresh
matched cohort. None of this receipt changes the terminal r11 denominator or
supports a G02 or product superiority headline.

## Open Questions

- Can a source-only file-to-element graph generate a small, high-precision
  candidate set on the five potentially improvable tasks without overfitting
  their exposed labels?
- Can the same rule abstain on the seven tasks with no eligible union hit and
  transfer to a separately frozen untouched cohort with full Span-F1 and
  token/time accounting?
