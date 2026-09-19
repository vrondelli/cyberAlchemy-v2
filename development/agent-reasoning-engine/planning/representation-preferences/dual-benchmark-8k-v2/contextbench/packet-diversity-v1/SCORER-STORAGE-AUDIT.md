# Native scorer storage audit

The existing scorer does **not** enforce a 32 MiB stage cap. A bounded successor is feasible without changing native metrics, but requires replacing repository checkout effects and isolating the evaluator process. No runtime was built or executed here; no gold values were read.

## Actual write surfaces

`score-v2.mjs:56` creates `live/evaluation-v2/<donor>/<variant>/{offered,selected}/`, writes each `prediction.json`, and asks Python to write `native-score.json`. Up to 32 Python calls are possible (16 offered plus16 selected). Successful slots also write `evaluation-v2/slot-00.json` through `slot-15.json`; final `RESULTS-V2.json` is currently written at the live root, outside the evaluation subtree. Its failure seal must be included in the same intended budget. There is no scorer worktree cleanup.

`score_native.py:main` verifies pinned sources, loads isolated gold, computes the exact union of gold and all predicted file paths, then replaces `evaluator.checkout` with native sparse checkout. Gold patches remain stripped; metrics are unchanged. Its final output is an unguarded `Path.write_text`.

Pinned upstream `contextbench/core/repo.py:checkout` creates the cache directory and `<repo_key>.lock`; for a missing cache it tries clone up to three times. Even an existing cache takes an unconditional fetch attempt, worktree prune and worktree add. Each invocation creates `<cell>/native-worktrees/contextbench_worktrees/<repo_key>/<commit>`. Sparse checkout writes source files and a `.git` pointer there, while Git modifies the shared base `.git` (worktree registrations, index/config/sparse rules, HEAD/log/lock metadata; fetch can update FETCH_HEAD, refs or objects when permitted). Existing worktree fast paths still run sparse configuration and checkout. Thus stage-only accounting misses shared cache effects. `GIT_ALLOW_PROTOCOL=file` prevents remote Git protocols, not local effects; `GIT_NO_LAZY_FETCH=1` does not make fetch or checkout read-only.

Python imports may create `__pycache__` in upstream/venv paths because the command omits `-B`/`PYTHONDONTWRITEBYTECODE`. Tree-sitter fallback uses installed `tree_sitter_language_pack` native code with download/cache APIs. Existing parsers are present under `~/.cache/tree-sitter-language-pack/v1.20.0/`; absence must fail rather than trigger a download. Current stdout/stderr are drained, not written. Upstream stderr includes gold file/symbol details, so retaining it as public diagnostics would leak evaluator information. The 180-second kill targets Python only; descendant Git processes are not explicitly drained.

## Capacity evidence

Source-only `git ls-tree -rlz` metadata shows full tree file allocation lower bounds (4 KiB rounding, excluding directories/index): CB1 7,135,232 bytes/413 files; CB2 7,892,992/530; CB3 1,966,080/293; **CB4 50,409,472/7,773**. CB4 exceeds both 32 MiB and the guard's4,096-entry limit. Its logical content alone is21,912,833 bytes, illustrating why logical size is insufficient. Copying a complete checkout is not a valid bounded plan.

Retained scoring cache allocations measured with `du -s -B1`: zstd8,544,256; simdjson6,569,984; tokio7,077,888; svelte29,155,328; also retained cli12,976,128, django73,322,496 and material-ui73,166,848 bytes. The four confirmation repositories respectively occupy44,568,576;17,858,560;45,871,104;176,136,192 bytes. These existing inputs need not be duplicated and must remain read-only during bounded scoring. Exact measurements and source hashes are in `SCORER-STORAGE-AUDIT.json`.

## Minimal prospective plan

1. Keep the native evaluator and metric implementation pinned. In an evaluator-only successor, replace only `evaluator.checkout` with a verified minimal base for the exact existing gold+prediction path union already computed by `score_native.py`. Resolve blobs from the retained local exact commit without fetch, clone, worktree, checkout, hooks or filters. Preserve native handling of nonexistent predicted paths and gold failures; do not silently drop valid source files.
2. Materialize those bytes through the shared stage guard, including directories and private manifest, before scoring. Determine allocated upper bounds and entry count before writes. Reuse the same minimal base for one donor's offered/selected evaluations or remove explicitly owned temporary source files after each score. Keep private gold-derived path manifests evaluator-only. Their required size is currently unmeasured because this review did not load gold; reject rather than infer that the union fits.
3. Run the evaluator with Python `-B`, pinned preinstalled parser libraries and read-only views of upstream, references, venv, parser caches and repository caches. Deny network and filesystem writes by the evaluator; return bounded JSON through a pipe for parent-side guarded persistence. A two-phase private manifest then read-only evaluation avoids needing subprocess writes or a second unsynchronized budget. `bwrap` exists locally, but namespace availability and enforcement must be proven with a synthetic test before relying on it. Alternatively a quota-backed isolated writable filesystem needs explicit provisioning; `RLIMIT_FSIZE` alone is only per file, not an aggregate cap.
4. Put all predictions, aggregate scores, checkpoints and exactly one final seal under a single stage budget; drain ordinary leases before final phase. Bound stdout and stderr without exposing gold paths, and terminate/drain the whole subprocess group on timeout. Equivalence fixtures should compare native metrics on the same exact blobs and missing-path cases, plus denial-before-write and preserved partial-score/fixed-slot accounting.

If the isolated union cannot fit24 MiB ordinary space plus8 MiB final reserve, use serial source reuse/cleanup first. Otherwise declare a different measured prospective scorer budget; do not claim32 MiB while allowing worktrees or cache writes outside it. Existing frozen scorer files remain untouched.

## Open Questions

Exact evaluator-only union sizes, parser read-only behavior, sandbox capability and complete subprocess writer isolation remain unproven. These are prerequisites for a bounded scorer successor, not reasons to enlarge or weaken scientific criteria.
