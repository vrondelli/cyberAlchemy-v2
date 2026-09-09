# Completed fixed contract study

The [120-row final screen](final-contract-study/report.json) and [independent integrity audit](final-integrity.json) are complete. Four known fixture variants were repeated across nominal 8K/10K/12K windows, two repetitions and five arms. This is exploratory prioritization across clustered tasks, not a held-out product qualification.

| Arm | Initial valid, correct proposals | Correct raw source | Contract failures | Unknown response/source |
| --- | ---: | ---: | ---: | ---: |
| Baseline | 14/24 | 18/24 | 5 | 0 |
| Metadata reminder | 17/24 | 18/24 | 1 | 0 |
| Host envelope | 15/24 | 15/24 | 0 | 1 |
| Neutral card | 15/24 | 16/24 | 2 | 1 |
| Boundary card | 15/24 | 20/24 | 6 | 0 |

Contract counts use each arm's declared native contract. Unknown responses are reported separately, not treated as valid contracts. Supplemental raw-source validation never changes an original initial failure into a pass and never returns hidden-oracle feedback to the model.

The metadata reminder meets its fixed screen: three paired initial-success wins, zero losses, and no semantic regressions. Both arms have exactly 18 correct raw sources, so the observed improvement is contract adherence rather than better underlying repairs. This supports retaining that reminder as a pilot candidate; it does not establish broad model efficacy.

The host envelope fails its screen: two initial wins and one loss, net +1 below the required +3, plus three semantic regressions. Boundary guidance also fails: six initial wins and six losses against the neutral card, net zero. Its higher raw correctness does not compensate for failed output contracts under the fixed endpoint.

The canonical H2 aggregate decision remains revise-hypothesis because its host-envelope contrast has counterevidence; the supported metadata contrast stays separately visible. H3 likewise remains revise-hypothesis. See [canonical observations and decisions](final-contract-study/research.json) and [the 82-record/128-edge DAG](dag-contract-final.json). Do not convert an aggregate counterevidence decision into wholesale technique adoption.

## Accounting and scope

There were 76/120 initial passes, 480 model and 480 tokenizer attempts, zero retries, zero fixture mutations and zero unsafe dispatches. Two final model requests exceeded the unchanged 60-second deadline. Their unknown responses remain failed trials; they were never retried or replaced. Execution continued only through unstarted schedule rows, with the pauses retained in [resume-68](resume-68.json) and [resume-70](resume-70.json).

No trial recycled. This experiment therefore supplies no recycling-continuity evidence. It does not reopen the historically qualified M1 small-window profile or complete the larger GLM finish plan.

## Open Questions

The independent [H20 live study](../live-recovery-v1/README.md) now tests whether GLM selects decisive archived evidence when recovery remains available after masking. Both H20 arms already use the same metadata reminder, fixed before this result. Actual recycling pressure, multiple facts, larger windows and product integration remain separately required before broader adoption; [GLM-FINISH-PLAN.md](../../../../../GLM-FINISH-PLAN.md) owns those milestones.
