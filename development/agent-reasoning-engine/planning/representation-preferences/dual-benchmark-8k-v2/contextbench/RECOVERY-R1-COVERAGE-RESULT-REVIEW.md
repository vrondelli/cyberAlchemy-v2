# R1 coverage result review

Diagnostic integrity verified; original R1 remains **inconclusive**.

Verified 331 reviewed bindings and 98 retained input hashes, reconciled all four selected recall/F1 values to prior native scores, and checked aggregate formulas and evaluator provenance. All eight rows remain, including four incomplete rows. Known cost remains 381,518 model tokens plus two unknown attempts. No new evaluation, reference-value reads or provider calls were performed.

| Completed arm | Archive recall | Offered recall | Selected recall |
|---|---:|---:|---:|
| Task 1 control | 2.670% | 2.670% | 0% |
| Task 1 treatment | 3.782% | 3.782% | 0% |
| Task 2 control | 48.911% | 48.602% | 48.602% |
| Task 2 treatment | 17.121% | 17.121% | 17.121% |

None of these confirmed/projectable archives permits perfect selection—even arbitrary subspans cannot supply the missing reference evidence. Task 1 also loses its small available overlap during selection. Task 2 selection preserves nearly all overlap available in its archives.

Missing delivered evidence is therefore the principal ceiling on perfection for these completed arms. Prioritize discovery/evidence-acquisition diagnosis before another expensive full run; increasing timeout alone does not address this deficit. These completion-selected observations are not a causal treatment comparison or an accepted efficiency result.

## Open Questions

RECOVERY-R1-COVERAGE-PROTOCOL.md owns discovery versus selection hypotheses and follow-up registration. The bounds describe retained/projectable evidence, not all source the agent could have discovered; broader generalization remains untested.
