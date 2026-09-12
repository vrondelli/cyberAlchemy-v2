# Patch attribution and evaluator continuation

The single frozen model episode completed and returned one edit to `SnippetBlock.js`. Its exporter returned whole-worktree `git diff`, which also included dependency changes already present in the pinned task image. The first [evaluation](evidence/evaluation/report.json) failed at patch application. This failed attempt is preserved.

The bounded [export verifier](export-model-patch.mjs) reconstructed the exact original final edits in a fresh network-isolated instance of the same pinned image. It verified the base commit, original submission schema and inspected-path membership, and required every model-edited path to be clean against HEAD before applying any edit. The resulting whole-worktree diff matched the original rollout patch byte for byte. It then emitted a diff restricted to those initially clean model paths and verified all untouched image changes remained byte-identical. No model edit was rewritten or selected based on tests; no extra model call was made.

[Attribution receipt](evidence/export-review/report.json) and [model-only patch](evidence/export-review/prediction-model-only.patch) bind the corrected evaluator input. The second evaluation uses the same upstream test patch, commands, resource limits and parser adaptations as before. It differs only in excluding verified pre-existing image changes from the submitted patch. Both evaluator attempts remain visible. This is a post-run export correction, not a change to the frozen model experiment or an official benchmark score.

## Open Questions

The live exporter still needs a separately frozen integration of this attribution check. A general exporter must handle image changes to model-targeted paths using a before/after worktree delta, or fail closed as this verifier does. The original global-diff artifact must not be treated as a scope-clean patch merely because each requested replacement passed the source guard. Broader task outcome questions remain in [PLAN.md](PLAN.md).
