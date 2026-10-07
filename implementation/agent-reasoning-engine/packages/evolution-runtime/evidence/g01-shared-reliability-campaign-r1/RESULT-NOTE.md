# G01 shared-reliability four-task campaign

The [pre-dispatch definition](DEFINITION.json) froze four untouched, source-only tasks across zstd C, GitHub CLI Go, Svelte JavaScript, and clap Rust. Both arms used the same opt-in `bounded-view-and-output-cap-r1` transport policy, pinned GLM endpoint, 8K request window, token/call budgets, and native scorer. The candidate was the fixed identifier-aware distinctive shortlist; control was native intent-anchor convergence. The one-command runner froze, dispatched, sealed predictions, scored, and summarized all four pairs.

**The campaign passes its predeclared aggregate rule.** All four pairs were valid and natively scored. Macro Span-F1 rose **0.012596 → 0.140720** and macro File-F1 **0.312500 → 0.575397**. Known model tokens fell **320,200 → 240,642** (−24.85%) and summed arm duration **1,171.621 → 881.979 seconds** (−24.72%). There were no Span-F1 regressions. These are four-task results, not a full ContextBench campaign or cross-benchmark product proof.

| Task | Control Span/File-F1 | Candidate Span/File-F1 | Tokens, control → candidate | Seconds, control → candidate | Task-level outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| zstd C `6b844996` | 0 / 1 | 0.096887 / 1 | 71,884 → 37,701 | 318.577 → 210.221 | Span gain; File-F1 tie; cost gain |
| CLI Go `00f7bf1b` | 0.050385 / 0.25 | 0.146139 / 0.444444 | 81,512 → 76,564 | 221.103 → 189.948 | All four gates pass against nonzero control |
| Svelte `0ed92fe3` | 0 / 0 | 0 / 0 | 84,589 → 84,110 | 353.192 → 319.021 | Quality tie at zero; modest cost gain |
| clap Rust `2a1daf41` | 0 / 0 | 0.319855 / 0.857143 | 82,215 → 42,267 | 278.748 → 162.790 | All four gates pass |

The C control activated reasoning-view fallback once. Its original view was denied even after reducing retained tool output (the last measured mandatory envelope was 8,293 tokens); a second view omitted historical assistant reasoning and was admitted. The complete raw exchange remained archived. This is live evidence that the shared policy can preserve a scoreable control under an 8K admission failure. No other arm activated fallback, and no arm activated the bounded output-cap correction. The quality gains therefore cannot be attributed to reasoning omission or output-cap correction. The Svelte zero/zero tie remains an important quality limitation.

Post-score diagnosis of the exposed Svelte task found that the source-only objective names a **migration-script attribute** fix. The reference patch changes `packages/svelte/src/compiler/migrate/index.js` and a changeset. The control selected a preprocess test file; the candidate selected the patched migration file. Native gold instead lists eight files including `/workspace/ast_parsed.json`, `/workspace/compiled.js`, `/workspace/reproduce.mjs`, and compiler client-transform files; it lists neither patched file. This is strong evidence that the gold context for this row is misaligned with its objective and patch, explaining the zero measured overlap. It does not justify deleting or reclassifying the task after scoring. Audit the label lineage before designing an engine change around this failure.

The compact [campaign result](CAMPAIGN-RESULT.json), [freeze](CAMPAIGN-FREEZE.json), pair plans, prediction seals, and pair results are retained here. Full model/tool receipts are on the GLM VPS at `/opt/are/evolution-runtime/g01-shared-reliability-campaign-r1`; immutable source snapshot is `/opt/are/evolution-runtime/g01-shared-reliability-source-r2`. All four tasks are now exposed and must not be reused for untouched prospective evidence.

## Open Questions

- Is the exposed Svelte gold context aligned with its source-only objective, and what fraction of fresh G01 tasks have similarly opaque or workspace-only labels? Audit without changing this frozen score.
- Can the candidate raise genuinely aligned Svelte-like zero-quality tasks without losing token/time gains?
- Does the improvement replicate in a larger untouched cohort, especially against more nonzero controls?
- Will the output-cap correction activate and preserve run validity in a future live case?
