# Bounded native evaluator bridge

`scoreNativeBounded({config,prediction,directory,stage_guard,stage_root,persistence})` in `scorer-bridge-bounded-v3.mjs` returns the original native aggregate score object. The caller supplies one shared guard and persistence object for all offered/selected evaluations and a new per-evaluation directory. `config.repository_cache` is the already-bound local repository (or a matching task's repository_cache); no repository acquisition fallback exists.

The private planning subprocess validates the pinned upstream/reference hashes and existing native prediction identity contract, then derives the exact gold/prediction path union. Only the isolated evaluator handles reference values. The parent bridge reads exact regular Git blobs with bounded, readonly local Git commands; every write is preceded by a shared stage lease whose absolute target is checked. Each file settles before the next lease, preventing retained bytes from being counted twice. Symlinks, submodules, directories, unsafe paths, oversized unions, or missing parsers fail closed.

The scoring subprocess verifies materialized hashes and positional path identity, replaces only native checkout with the verified sparse base, and invokes unchanged `evaluate_instance`. Both subprocesses run Python `-B` within bubblewrap's read-only host filesystem and isolated network namespace; stdout/stderr and whole-process duration are bounded. Stderr content is discarded, never logged; thrown diagnostics retain only an enumerated phase/code, exit status, byte counts and hashes. A synthetic regression verifies private messages/paths are excluded. No Git worktree, cache mutation, parser installation, or network is permitted.

Each settled evaluation deletes its disposable private source base. The evaluator stage retains the private source identity manifest, prediction, native aggregate and audit receipt. This avoids retaining the same blob union 32 times. The wrapper owns the final artifact reserve and fixed-slot reporting. This module alone does not establish end-to-end stage bounds; that requires every wrapper/native writer to use the same shared guard.

## Validation

`node --test scorer-bridge-bounded-v3.test.mjs`: eight synthetic tests passed. Coverage includes exact blobs and unchanged Git cache, missing paths, a 16MiB union without double accounting, quota rejection before source creation, mismatched guard roots, unsafe/symlink paths, actual sandbox write denial, isolated network connection failure, bounded private pipes/deadline, and pinned native metric equality between a regular synthetic repository and its exact sparse projection (including a missing predicted file). Fixtures read no actual benchmark labels. The suite uses the existing pinned local Python/upstream installation without downloading anything.

## Open Questions

Independent review and parent wrapper/freeze closure remain the authority for runtime readiness. Actual reference-dependent path unions have not been inspected or scored in this implementation task. A union exceeding the remaining ordinary budget is an infrastructure failure, not a relaxed storage gate or a benchmark result. Private manifests belong only to the evaluator stage and must not be supplied to generation.
