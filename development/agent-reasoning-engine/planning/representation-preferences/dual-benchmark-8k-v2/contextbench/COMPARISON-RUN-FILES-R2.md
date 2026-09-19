# Saved-run file adapter R2

Status: additive correction; six offline filesystem tests pass. Independent R2 review pending.

[comparison-run-files-r2.mjs](comparison-run-files-r2.mjs) supersedes the rejected original adapter. The original module/test/docs and [53-binding rejection](COMPARISON-RUN-FILES-REVIEW.md) remain unchanged.

The review found that opening root evidence with O_RDONLY before checking the descriptor type can wait indefinitely on a named pipe. This requires no concurrent mutation. An isolated child-process regression reproduced the timeout against the original module.

R2 requires the final path to be a regular file before opening, and adds O_NONBLOCK alongside O_NOFOLLOW. Descriptor regular-file and bounded-size checks remain. The same regression now rejects named pipes at both started.json and events.jsonl promptly; all six tests pass. No provider calls occurred.

Run: node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-run-files-r2.test.mjs

## Open questions and next work

The [original component contract](COMPARISON-RUN-FILES.md) still owns the parsed evidence, external file hashes, settled-local-tree assumption and limits. Future campaign integration must import R2 explicitly. Safe per-run reads do not bind the expected hashes to a campaign seal or prove outer process settlement; both remain required. Fixed twelve-outcome integration, isolated scoring, prospective native experiment amendment and exact execution freeze remain next. Coordinator owns integration and independent review; D:/WSL admission applies, C: is excluded, and no benchmark quality/savings claim follows.
