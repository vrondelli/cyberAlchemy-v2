Correction: native trajectory coverage is cumulative union coverage. My earlier statement that these values describe individual exported steps rather than the union was wrong. Prior audits remain unchanged; this additive record corrects that interpretation.

Pinned upstream revision `1436c28a8eb95496da4ea69ad458b9f8a8eb7d61` accumulates union_files and merged union_spans before calculating each step’s coverage. The last step therefore represents the union of all exported steps. The wrapper preserves pred_steps; native step counts match the saved predictions and all delivered projection events (19, 67 and 23). All three projections report zero unmapped current lines.

| Slot | Exported union span coverage | Final span coverage | Difference |
|---|---:|---:|---:|
| 01 | 2.669633% | 0% | 2.669633 percentage points |
| 03 | 32.596205% | 32.596205% | 0 |
| 07 | 32.739971% | 31.500735% | 1.239235 percentage points |

No new native evaluation is needed to obtain exported-union coverage. Within the exported evidence, the low union coverage is a much larger ceiling than the additional final-selection loss. This does not yet prove complete representation of every possible raw delivery or source category; receipt-to-export completeness remains a separate check. It also does not identify retrieval, delivery, model choices or forgetting as a causal mechanism, nor establish comparative quality or savings.

No provider/evaluator calls or prior-audit edits were made. Exact source and artifact hashes are in [TRAJECTORY-SEMANTICS-CORRECTION-R1.json](TRAJECTORY-SEMANTICS-CORRECTION-R1.json).

## Open Questions

Receipt-to-export completeness and general source-delivery improvements remain under [COMPACT-DESCRIPTIVE-SCORING.md](COMPACT-DESCRIPTIVE-SCORING.md).
