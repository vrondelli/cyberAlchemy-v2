# G02 r11 two-hop import navigation — exposed coverage screen

Status, 2026-10-04: **reject unfiltered two-hop import expansion as a G02
read policy**. This is a source-only graph followed by a separate
evaluator-only coverage audit on the nine already-exposed Python tasks. It
made no GLM call, ARE read, native score, or fresh-cohort claim.

The [source-only sealer](../research/g02-product-r4/seal-g02-r11-two-hop-import-coverage-exposed-r1.py)
read the previously sealed r11 task packets, verified every exact clean base
commit, indexed tracked regular `.py` files up to 256 KiB, and extracted
Python AST imports. It resolved only unique module aliases and expanded
forward and reverse import edges from ARE-delivered Python files. Its private
`SOURCE-GRAPH.json` SHA-256 is
`2de9fcf4db64de71c3b3e7cb29d450604bb071a570be770473bce192fd13cf25`.
The graph contains paths but no gold, DSH output, score, or model response.

The [evaluator-only audit](../research/g02-product-r4/audit-g02-r11-two-hop-import-coverage-exposed-r1.py)
matched exact instance/base identities to the pinned native references and
previous relation union. Its counts-only receipt SHA-256 is
`bb82affe5a47da64d1628c363c8460d40082bf629daaf2c3a744f27e1206f3f1`.

| Exposed Python tasks | Candidate placements | Missed gold covered | New gold beyond old relation union |
| --- | ---: | ---: | ---: |
| One hop | 1,633 | 8/14 | 0 |
| Second hop only | 11,441 | 2/14 | 2 |

The two new second-hop hits occur on exposed Ansible task 5 and Sympy task 7.
This is a recall ceiling, not usable precision: choosing all second-hop
files would add 11,439 non-gold placements, and neither hit is selected by
a sealed, issue-conditioned rule. The simple AST graph may also miss dynamic
or unresolved relations, so the result rejects *this unfiltered expansion*,
not all semantic navigation or language-server resolution. It gives no
File-F1, Span-F1, cost-qualified live read, or superiority evidence.

Next hypothesis: if navigation is pursued, resolve **specific ambiguous
relations from high-confidence issue/source anchors on demand**, keep an
explicit evidence/abstention record, and cap candidate and read counts before
opening evaluator labels. This differs from widening the static import graph
and from reranking the unchanged 2,732-file relation union. It still needs an
exposed quality-and-cost screen and then a separately frozen untouched
matched G02 cohort.

## Open Questions

- Can a language-server-resolved relation from an issue-anchored delivered
  symbol reach new gold with materially fewer candidates than this graph?
- Can an explicit evidence workspace reliably abstain on tasks with no
  supported candidate, while preserving native File-/Span-F1 and token/time
  budgets in actual ARE reads?
