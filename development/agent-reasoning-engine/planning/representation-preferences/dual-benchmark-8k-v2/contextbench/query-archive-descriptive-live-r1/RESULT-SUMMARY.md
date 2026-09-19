# Query-archive R1 descriptive results

The [result integrity review](RESULT-REVIEW.md) approved the two native scores
and clean evaluator settlement. No additional model calls were made.

| Task | Span-F1 | File-F1 | Exported union span coverage | Final span coverage |
| --- | ---: | ---: | ---: | ---: |
| contextbench-1 | 0.00% | 20.00% | 0.00% | 0.00% |
| contextbench-3 | 41.91% | 66.67% | 30.30% | 30.30% |

Tasks 2 and 4 failed mandatory-exchange admission and are excluded only from this
separate quality diagnostic. The original campaign still has four assignments,
276,040 model tokens, 62 model calls and two failures. Neither survivor is
perfect. These scores do not establish campaign quality, patch correctness,
causal improvement, matched savings or generalization.

The native exported union already lacks reference spans. Final selection alone
cannot reach perfect coverage from that union. A confirmed-delivery/export census
is still needed to distinguish export loss from upstream gaps for this candidate.
Do not infer the raw acquisition or semantic-understanding cause from F1 alone.

A separate [structural source alignment check](SOURCE-ALIGNMENT.json) verified
all four task/alias/repository/commit identities, actual base checkouts, source
existence and native byte range bounds. Nine annotations end at the logical empty
line after a trailing newline; the native conversion maps them to EOF correctly.
No identity, checkout or byte-range mismatch was found. The dataset contains no
problem statement, so this check does not establish text provenance or semantic
annotation relevance. Reference paths/content were not added to model inputs.

Next: census the archive candidate's evidence path; register the completion and
quality counterevidence in the native research DAG; compare a measured bounded
working view, adaptive input/output allocation, and an explicit acquisition
frontier as successor hypotheses. Select a mechanism based on evidence before
another live run. The 8K limit, full-cost accounting, candidate-only direction,
perfect-quality objective and untouched confirmation remain required.

## Open Questions

Can bounded working views prevent overflow while keeping exact raw evidence
recoverable? Can systematic tracking of explored versus missing evidence improve
coverage, rather than only replaying previously acquired context? Does task-text
provenance need a separate upstream source audit? Which candidate generalizes
beyond the four exposed tasks? [Prospective archive protocol](../QUERY-ARCHIVE-CANDIDATE-R1.md).
