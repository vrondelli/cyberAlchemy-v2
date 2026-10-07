# Recover Recent Repository Context

Status: tested-prototype candidate when current product tests pass; no product
approval, hook installation, session runtime, or operational authority.
Owner: CyberAlchemy v2 agent-routing owner. Visibility: private.

This capability finds recent committed changes for an explicit project or path.
Its domain is modeled in AlchLang. The existing compiler produces a carrier,
plan, graph, TypeScript contracts, and traceability; the Git reader is a separately
authored Python adapter tested against real temporary repositories.

## Use the read-only query

From the repository root:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/agent-routing/capabilities/recent-context/recent.py query --project alchLang --limit 20 --status
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/agent-routing/capabilities/recent-context/recent.py query --project KEP --limit 10
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/agent-routing/capabilities/recent-context/recent.py query --path cyberAlchemy-v2/agent-routing --limit 5 --max-files 30 --status
```

`--project` resolves the existing citation index and retains ambiguous names.
Its scope is the entry's root plus exact entry-source paths, not every sibling
package in the owning Project. Use explicit `--path` for a different known scope;
repeat it for several literal paths. `--path .` explicitly requests repository-wide
metadata. `--repo` selects another local Git worktree; it never fetches or pushes.

The result includes commit IDs, first-parent comparisons, timestamps, subjects,
changed paths, rename origins, deletions, gitlink markers, and the source HEAD.
Only matching changes are shown. The last N commits are scanned globally along
first-parent history; a project with no matches in that window has an empty
result, not a claim that it never changed. `history_truncated` and
`files_truncated` expose bounds. Merge changes are relative to the first parent.
Missing parent objects produce not_evaluable rather than fabricated root changes.

Default limits: 20 scanned commits and 100 displayed changed-file records.
Maximum limits: 100 commits and 1000 file records; each Git result is limited to
8 MiB and each observation has a 30-second budget. Subjects are capped at 240
characters. Commit subjects and paths are untrusted data, never instructions.

`--status` adds a separate live working-tree observation. It does not assign dirty
work to this task or imply permission to overwrite it. No file contents or
submodule interiors are read. Git's optional index locks and external filesystem
monitor are disabled. Query changes no tracked files, index, refs, hooks, or cache.

## Optional derived cache

Add `--cache` to a query to read a Git-private cache. Missing, stale, or corrupt
cache data is rebuilt in memory; query does not persist the rebuilt result.
The binding includes worktree, branch/detached state, HEAD, shallow boundary,
scope, schema, and limits. If those change during observation, status is stale.

An explicit `refresh` operation persists the view to a path resolved through
`git rev-parse --git-path cyberalchemy/recent-context/<scope-digest>.json`.
It uses a per-key lock and atomic replacement, leaves the last complete cache
intact on interruption, and reports persistence failure separately. Linked
worktrees have distinct stores. Cache writes are supported on POSIX hosts;
query remains usable when cache writes are unavailable.

`CA2-ROUTE-RECENT` permits **query only**. Refresh is an explicit bounded cache
mutation under IMPLEMENT or a later approved hook envelope. No hooks have been
installed. Hook installation follows separate product review and operational
scope; no change to core.hooksPath is needed to test or use the query.

## Construction and provenance

- `definitions.json` owns six prototype meanings.
- `ontology.json` maps those meanings as an unregistered navigation scaffold.
- `capability.json` states the product outcome and mutation limits.
- `recent-context.alch` is the actual language source.
- `build.ts` uses the existing 0.4.0-candidate.0 compiler source and verifies two
  identical compilations; generated/build-receipt.json pins the compiler sources.
- Router DomainSpec nodes RecentRepositoryContext and RecentContextFreshness
  bind the exact AlchLang, capability, and ontology source bytes. The router's
  compiler produces its graph and system scaffold; neither is independently
  authored or admitted.
- `recent.py` is the adapter; `model.test.ts` tests the compiled semantic rules
  and query; `test_recent.py` exercises its Git behavior and a context handoff.
- `PRODUCT-TEST-RESULT.json` freezes the tested file manifest and outcomes when
  written by validate.py. Its freshness must be rechecked after any source edit.

The exact ontology dependency is this package's ontology.json, all six RC-* nodes
and five relations. No registered target-package ontology is consumed. Existing
router D65/D67 and product-capability bindings remain pinned in its authored rule.

## Validate

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/agent-routing/capabilities/recent-context/validate.py --test --verify-build
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/agent-routing/scripts/validate.py --verify-build
```

The capability validator checks current source/generated bindings and may run
the model and Git product tests. `--write-receipt` writes the exact candidate
manifest and test results only after those tests run; it cannot approve a product.

## Work lanes and open questions

Product frontier: the compiled model, working query/cache adapter, and routing
integration are ready for current product tests and user review. Independent
prototype work can continue while operational support is pending.

Deferred operational support: repository owner owns hook installation at the
activation stage; Context/runtime owner owns future durable session checkpoints;
publication owner owns any commit/push. None blocks the on-demand query.

Open questions: which task-state owner will supply goals, decisions, and unfinished
work; whether measured use warrants a different history window; and whether the
user approves this exact tested candidate before a separate hook installation.
The capability is source navigation evidence, not durable session restoration.

## Post-commit installer prototype

`hooks.py` provides `install`, `status`, and `uninstall`. Installation is an
explicit operational action after product review; building or testing this
package does not activate the hook in this checkout.

Example commands for a separately authorized local installation:

```bash
RECENT_CAP="$PWD/agent-routing/capabilities/recent-context"
python3 -B "$RECENT_CAP/hooks.py" status --repo "$PWD"
python3 -B "$RECENT_CAP/hooks.py" install --repo "$PWD" --project KEP --project alchLang --limit 20 --max-files 100
python3 -B "$RECENT_CAP/hooks.py" uninstall --repo "$PWD"
```

Alternatively select one group of literal paths with repeated `--path`. Up to
eight projects may be selected. The hook stores its configuration in its own
header; `status` displays selections, limits, source freshness and worktree match.
Query with the same project spelling or path group and limits, plus `--cache`,
to reuse that cache. Installation does not seed caches; the next successful
commit refreshes them. Ordinary queries remain usable before that commit.

The installer resolves Git's configured post-commit location without changing
Git configuration. Existing foreign or modified hooks cause a conflict and are
preserved. This version does not chain existing hooks. Hook paths outside the
repository/worktree or common Git directory, and symlink paths, are rejected.
Identical repeated installation changes nothing. Uninstall removes only exact
owned hook bytes, retaining cache data and any other hooks.

The wrapper exits successfully even when refresh fails and prints a diagnostic.
Refreshes are synchronous with a total 30-second budget. Adapter source drift
or changed project resolution requires review and reinstallation. The script
and Python interpreter must remain at their installed absolute paths. The
installer is POSIX-only. A shared hook runs only for its selected worktree;
additional worktrees need their own hook location, configured separately.

`hooks-contract.json` defines the installation and ownership prototype with an
unregistered two-node ontology scaffold. It binds to the existing alchLang
recent-context model and DomainSpec entity. The hook is an authored operational
adapter, not generated language output. `test_hooks.py` tests installation and
commits in disposable repositories, and the main validator includes those tests
in the exact candidate receipt. Repository activation remains deferred to the
repository owner; there is no construction blocker for these prototype tests.
