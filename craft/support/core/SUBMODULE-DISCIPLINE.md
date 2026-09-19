# Submodule Discipline

How this repo is structured and the rules that keep submodules from breaking. Read once; then `make bootstrap`.

## 1. Topology (open / private boundary)

`domainspec-core` is a **private** umbrella that composes one public submodule and several private ones.

| Repo | Path | Visibility | Canonical host (target) |
| --- | --- | --- | --- |
| `domainspec-core` (this) | — | **private** | `cyberAlchemyAI/domainspec-core` |
| `arcanum` | `arcanum/` | **PUBLIC** (source-available) | `cyberAlchemyAI/Arcanum` ✅ |
| `domainspec` | `implementation/domainspec/` | private | `cyberAlchemyAI/domainspec` (migrate from `vrondelli/`) |
| `poker-team` | `validation/poker-team/` | private | `cyberAlchemyAI/poker-team` (migrate from `vrondelli/`) |

**Boundary rule:** private content must never land in `arcanum` (the public repo). Public + private only ever compose **here, in the private parent**. Treat `arcanum/` as if the world reads every commit — because they can.

## 2. The Golden Rule — submodule first, parent last

Always commit/push in this order:

1. Commit **and push** the change *inside the submodule*.
2. *Then* bump the parent gitlink (`git add <submodule-path>`) and push the parent.

**Never** commit a parent pointer to a submodule commit you haven't pushed. That is the #1 way to break collaborators: their `git submodule update` fails because the commit your parent references doesn't exist on the remote. The `push.recurseSubmodules=check` config (below) enforces this automatically.

## 3. Linear publication — fresh target, scoped replay, fast-forward only

Routine publication must not merge current remote history into a stale topic branch or temporary worktree. That reverse integration makes existing target history appear as a giant new first-parent diff.

For every shared-branch publication:

1. Fetch the target without recursing into dirty child repositories:
   ```
   git -c submodule.recurse=false fetch --no-tags --no-recurse-submodules origin \
     refs/heads/master:refs/remotes/origin/master
   ```
2. Work from an isolated, clean branch or worktree based on the freshly fetched `origin/master`.
3. Replay only unpublished, scoped work:
   - **Rebase** when the entire unpublished topic branch belongs in the publication.
   - **Cherry-pick** onto the fresh target when selecting coherent commits from a mixed or dirty checkout.
4. Run `make publication-check TARGET_BRANCH=master`, review the exact commit/path delta, then run `make bump-check` when gitlinks are involved.
5. Advance `master` only by fast-forward, using `git push --recurse-submodules=check origin HEAD:master`. A concurrent remote update must reject the push; fetch and replay again.

Safety boundaries:

- Never rebase or otherwise rewrite published `master` or shared commits.
- Never use a merge commit merely to catch a publication branch up with the target. An intentional topology-preserving merge requires explicit owner approval and a stated reason.
- Never force-push `master`.
- A dirty primary checkout is a reason to use an isolated clean worktree, not a reason to merge the target into stale work.

The clone-local `make config` guardrails set `pull.ff=only` and `merge.ff=only`; they block accidental non-fast-forward pulls and merges. The explicit publication check also rejects dirty worktrees, stale target ancestry, whitespace errors, and merge commits in the proposed target delta.

## 4. Branch tracking (no more detached HEAD)

Every submodule pins `branch = main` in `.gitmodules`. Move them forward with:

```
git submodule update --remote        # = make sync
```

If a submodule ever lands in detached HEAD, `git -C <path> checkout main` puts it back. Files "disappearing" from a submodule almost always means it's detached or `git submodule update` snapped it back to the recorded (old) gitlink — not data loss.

## 5. One-time config per clone (local, safe)

```
make config        # or:
git config submodule.recurse true
git config status.submoduleSummary true
git config diff.submodule log
git config push.recurseSubmodules check
git config pull.ff only
git config merge.ff only
```

- `submodule.recurse` — `pull`/`checkout` recurse into submodules.
- `status.submoduleSummary` + `diff.submodule=log` — the parent *shows* submodule drift instead of hiding it.
- `push.recurseSubmodules=check` — **blocks a parent push that references unpushed submodule commits** (enforces the Golden Rule).
- `pull.ff=only` + `merge.ff=only` — block implicit divergence merges; use an explicit rebase or scoped cherry-pick instead.

These are per-clone local settings; they never affect collaborators.

## 6. Daily commands (`make`)

| Command | Use |
| --- | --- |
| `make bootstrap` | first-time setup after clone (init recursive + config) |
| `make status` | show submodule drift vs recorded pointers |
| `make sync` | pull each submodule to the tip of its tracked branch |
| `make publication-check TARGET_BRANCH=master` | fetch the target and reject dirty, stale, or merge-bearing publication state |
| `make bump-check` | verify submodule commits are pushed before bumping the parent |
| `make doctor` | diagnose detached HEADs / dirty submodules |

**Bumping the parent gitlink is deliberate, never automatic.** After `make sync` and reviewing, run `make bump-check`, then `git add <path> && git commit && git push`.

## 7. Onboarding (clone)

```
git clone --recurse-submodules <parent-url>
cd domainspec-core && make bootstrap
```

If someone forgot `--recurse-submodules`: `git submodule update --init --recursive`.

## 8. Org consolidation (pending migration)

`domainspec` and `poker-team` still live on a personal account (`vrondelli/`). Target: move them under `cyberAlchemyAI/` so ownership/access is uniform. Per repo, the migration is:

1. **Transfer** the repo on GitHub (Settings → Transfer) to `cyberAlchemyAI`, or `gh repo transfer`. GitHub leaves a redirect, so nothing breaks immediately.
2. Update the URL here:
   ```
   git config -f .gitmodules submodule.<name>.url git@github.com:cyberAlchemyAI/<repo>.git
   git submodule sync
   git -C <path> remote set-url origin git@github.com:cyberAlchemyAI/<repo>.git
   ```
3. Commit the `.gitmodules` URL change in the parent and push.

Prefer **SSH** (`git@github.com:`) for org repos so private fetch/push uses keys, matching `arcanum`.

## 9. Known cleanup items

- `validation/poker-team/domainspec` is a **nested** submodule, currently uninitialized. Decide: initialize it (`git submodule update --init --recursive`) or remove it if obsolete.
- The parent `master` gitlink for `implementation/domainspec` was stale (pointed at an old commit). Bump deliberately via §6 once you're ready for a fresh clone to pull current content.
