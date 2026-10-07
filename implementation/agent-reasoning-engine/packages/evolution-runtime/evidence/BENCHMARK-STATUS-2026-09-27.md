# ARE benchmark status — 2026-09-27

The current high-level accuracy/token/efficiency objective has bounded positive evidence in all three active benchmark branches. These are not full benchmark campaigns or a production-wide claim.

| Branch | Bounded result | Scope limit |
| --- | --- | --- |
| G01 shared 8K ContextBench reliability | [Four-task campaign](g01-shared-reliability-campaign-r1/RESULT-NOTE.md): macro Span-F1 0.01260 → 0.14072, File-F1 0.31250 → 0.57540, 24.85% fewer tokens, 24.72% less summed arm time | Four source-only tasks; one Svelte row has zero/zero native quality and suspected label misalignment |
| G02 large-window ARE vs DSH | [Predeclared three-task NodeBB/Flipt holdout](g02-cross-repo-holdout-r1/RESULT-NOTE.md): mean Span-F1 0.27268 → 0.34532, File-F1 0.37473 → 0.51563, 49.51% fewer tokens, 22.51% less summed arm time; 2/3 individual strict four-gate passes | Small two-repository holdout; NodeBB socket migration quality regressed; [four-task Go development cohort](g02-go-four-task-development-cohort-r1/RESULT-NOTE.md) is favorable but adaptively assembled |
| G03 LongMemEval interaction memory | [Frozen 16-question cohort](longmemeval-fast16-v1/RESULT-NOTE.md): 11/16 strict correct vs control 2/16, 98.664% fewer all-in tokens, 97.585% less summed arm-plus-judge time | Sixteen questions across five types; not full LongMemEval; control had two invalid rubric outputs, retained under strict scoring |

G02 benchmark execution now uses a one-command source-only matched runner. Full G02 predictions, costs, pre-score seals, native scores, and failed attempts remain in separate VPS roots listed by each evidence note; compact results are in this checkout. The ranker own-property guard fixes a pre-model crash when a task contains `constructor`. The rejected 100-line packet, broad/selective history retention, and Go named-type closure were exposed diagnostics and are not in the retained candidate. The Flipt validation task had two DSH transport failures and is unscored, not omitted from the operational audit.

The next research question is replication on a larger, independently sampled holdout with uncertainty intervals, plus diagnosis of the G02 socket-migration miss and G01 Svelte label lineage. Do not reuse exposed tasks as untouched prospective evidence. No benchmark success by itself deploys an engine version.

## Open Questions

- How large and diverse must the next independent G02/G01 holdout be to support a broader claim?
- Can the G02 selector improve the socket-migration miss without sacrificing the frozen holdout gains?
- Can transport reliability and failed-attempt costs be reported separately from valid matched-arm efficiency?
