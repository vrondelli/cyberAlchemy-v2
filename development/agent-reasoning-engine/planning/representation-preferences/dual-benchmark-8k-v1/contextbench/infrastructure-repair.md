# ContextBench retained-cache repair

The original Stage 1 ContextBench task 4 failed during repository checkout in
both arms, before any model call. Those run directories and result hashes are
preserved in `infrastructure-repair.json`; this repair does not replace their
outcomes or authorize a replay.

The retained Svelte cache contained the pinned commit and complete object graph,
but no reference contained that commit. The native `git clone --no-local
--no-checkout` operation transferred referenced objects and omitted the dangling
commit. Existence of the original cache's commit object was therefore an
insufficient preflight check.

The repair adds a local branch reference to the exact existing pinned commit.
It changes no source bytes, revision, task, model policy or frozen experiment
file. No fetch or model call is needed. The repair script checks the original
zero-dispatch evidence, remote identity, complete reachable object graph, and
performs the exact native no-local clone followed by a detached checkout for
all four tasks. It verifies HEAD, tree identity and clean worktrees, then removes
only its own temporary verification clones. JSON evidence records every command,
source/configuration hashes, containing references, and the unchanged failure
artifact hashes.

## Open Questions

- A separately reviewed amendment owns whether to execute task 4's first model
  exposure in a new output directory; the original fixed-zero failure remains.
- Future repository preparation should verify exact clone transfer and detached
  checkout, rather than relying on `cat-file` in the retained source alone.
