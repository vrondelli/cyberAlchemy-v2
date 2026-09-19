# Completed-selection native scores

The separate diagnostic scored all three eligible selections successfully with
zero new model calls. The supervised worker exited zero, without forced
termination; its process group was absent. Post-score integrity checks passed
using the explicitly recovered historical source bytes. Independent result
review is pending.

| Slot / arm | Span-F1 | File-F1 | Reference span coverage | Selected span precision |
| --- | ---: | ---: | ---: | ---: |
| 01 / current ARE / C | 0.00% | 28.57% | 0.00% | 0.00% |
| 03 / current ARE / C++ | 48.51% | 28.57% | 32.60% | 94.79% |
| 07 / minimal history / Go | 47.91% | 100.00% | 31.50% | 100.00% |

These are actual native scores, replacing uncertainty for these three outputs
only. They do not replace the original failed campaign report. All twelve
assigned outcomes, 252,615 known model tokens and the additional 8,000-token
unknown reservation remain recorded. There is no accepted savings estimate,
architecture comparison, perfect-score result or benchmark-clearance claim.
These context-selection metrics do not establish patch correctness.

The C++ and Go selections are precise at the span level but incomplete. The C
selection has zero reference-span overlap. This supports investigating retrieval
coverage and final evidence selection in addition to shared completion defects.
It does not show whether retrieval, forgetting or final selection caused the
missing spans. Do not inject reference spans into future model inputs or use
these exposed tasks as untouched confirmation.

## Next research decisions

Use the existing ontology research chain and original targets. First separate
source discovery from selection loss using existing receipt-bound evidence.
Keep a radical retrieval-first branch: can external evidence storage and fresh
retrieval replace persistent reasoning-state carryover without reducing quality?
Compete it against repairing the existing delivery/selection path and the null
hypothesis of no net benefit. Shared planner, batch-admission and outcome-parity
repairs must be tested before a fresh comparison. Do not choose an architecture
from these three surviving outputs.

## Open Questions

Independent postrun audit; whether missing context was never delivered or was
later omitted; prospective radical-branch protocol and original perfect-quality,
15% cumulative-token savings and untouched confirmation. See
[the diagnostic protocol](../COMPACT-DESCRIPTIVE-SCORING.md).
