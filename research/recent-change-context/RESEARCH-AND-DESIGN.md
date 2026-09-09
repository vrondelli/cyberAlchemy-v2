# Recent repository context: research and candidate design

Status: research and design candidate; no capability registration, implementation,
product approval, hook activation, session creation, or authority effect.
Date: 2026-09-05.
Selected route: CA2-ROUTE-RESEARCH.
Proposed meaning owner: CyberAlchemy v2 product owner; exact capability home and
runtime owner remain to be resolved before construction.

## User intent

Maintain an index of recently committed files, use it in repository routing to
help later agent tasks regain context, model the capability using alchLang,
and compare the idea with current agent-workflow practice.

## Recommendation

Build a small recent-change context view derived from Git. Refresh after a
successful commit and rebuild on demand whenever its source binding is stale.
Keep pre-commit for candidate checks: it cannot report a completed commit.
Git history supplies change evidence; a separate task/progress record supplies
intent, decisions, pending work, evidence references, and next actions.

Model the domain with alchLang. The proposed product capability is **Recover
Recent Repository Context**. A Git hook is a replaceable adapter for this
capability. Adding Git semantics to the core alchLang language is unnecessary.
The existing AlchLang package identifies governed domain modeling as its
outcome and distinguishes that outcome from compiler and runtime realizations.

## Documented practice, with claim limits

These are documented vendor designs and recommendations, not a market-share
survey or proof that most teams use a particular architecture.

| Pattern | Primary evidence | Design implication |
| --- | --- | --- |
| Repository and path-scoped instructions | [GitHub Copilot documentation](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions) | Keep durable conventions distinct from changing activity data. |
| Load relevant context as needed | [Anthropic context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | Return concise source locators and retrieve relevant material rather than loading every recent file. |
| Git history plus explicit progress artifacts | [Anthropic long-running-agent harness](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | Commit metadata and task meaning complement one another. |
| Agent lifecycle hooks for context injection | [Claude Code hooks guide](https://code.claude.com/docs/en/hooks-guide) | Task start/resume can request a brief independently of commit events. |
| Thread checkpoints and cross-thread stores | [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence) | Actual session restoration needs explicit runtime state beyond Git. |

[Git's hook contract](https://git-scm.com/docs/githooks) places pre-commit before
commit creation and post-commit after it. Post-commit cannot affect the outcome
of the completed commit. Checkout, merge, and rewrite have separate hooks;
therefore the index must also check its HEAD binding when read.

## Proposed capability contract

Outcome: an agent starting or resuming bounded repository work can find recent
committed changes relevant to its selected project, with exact provenance and
visible freshness, without treating recency as instruction or authority.

Inputs:

- explicitly selected repository/worktree and project or path scope;
- current branch or detached HEAD, exact commit object ID, and source history;
- a bounded commit count (initial proposal: 20) and output/path budget;
- explicit project-path mappings from the project citation index;
- optional separately owned task/progress evidence references.

Output:

- source repository/worktree identity and exact HEAD binding;
- selected scope, scan bound, history policy, and truncation indicator;
- ordered commit IDs, parents, timestamps, and short subjects;
- changed paths with statuses; preserve rename source/destination and deletions;
- explicitly mapped project identities, with unmapped paths kept visible;
- current, stale, unavailable, or no-history status with causal detail;
- a distinct live working-tree summary when requested;
- references to task meaning/evidence, if an authorized owner actually recorded it;
- authority effect none.

Commit subjects and filenames are untrusted descriptive data. They are never
instructions to execute commands, change routing authority, or load arbitrary
paths. No plaintext file bodies, credentials, remote calls, or model calls are
needed to maintain the metadata index.

## Implementation proposal

1. Start with an on-demand, read-only Git query producing bounded JSON to stdout.
   Freeze HEAD before traversal, use NUL-safe path parsing, and make history
   selection explicit. Proposed default: first-parent history, each commit
   compared with its first parent, with the root commit handled separately.
   This summarizes the current branch's changes without duplicate merge detail;
   it is not a complete account of every merged branch's individual commits.
2. Add an optional derived cache in a Git-private worktree-specific location
   resolved through Git, not a hardcoded .git directory. Do not track the cache
   in Git, auto-stage it, or create commits to refresh it.
3. Cache identity includes worktree, HEAD, scope, schema version, and scan limits.
   Rebuild on mismatch; branch switches, reset, amend, rebase, missing hooks,
   and skipped refreshes must never make an old cache appear current.
4. Use atomic replacement and per-worktree synchronization for cache writes.
   Cache failures remain visible and do not change the success of a commit.
   Keep read-only querying usable when cache persistence is unavailable.
5. Add a lightweight post-commit adapter after testing. Post-checkout,
   post-merge, and post-rewrite can refresh or invalidate the cache later;
   on-demand freshness checking remains the correctness mechanism.
6. Read working-tree status separately. A committed snapshot must not imply
   that uncommitted changes belong to the previous task or are safe to overwrite.
7. Represent submodule changes as gitlink changes only. Inspecting submodule
   content requires that submodule's own explicit scope and source binding.

Initial performance and output limits are design candidates to measure. The
commit path should not invoke an LLM, perform full-repository semantic indexing,
run a complete test suite for this metadata feature, or wait on remote services.

## Routing integration proposal

Preserve CA2-ROUTE-ENTRY and select one declared objective route. Resolve
user-cited project names with CA2-ROUTE-LOCATE, then obtain a recent-change view
only for the selected scope. Announce exact source reads before loading content.

A new read-only recent-context objective may be declared in routes.json with
an exact contract and implementation locator. It must not reuse or silently
unblock CA2-ROUTE-SESSION. The current registry explicitly marks durable
repository session creation unavailable. A recent-change view is useful
navigation evidence without claiming to restore a session.

Suggested context order:

    user objective and constraints
      -> selected project identity
      -> bounded recent committed changes
      -> separately labeled live working-tree status
      -> existing task/progress evidence, when available
      -> only relevant source reads

Recency is a retrieval hint, not proof of relevance, correctness, ownership,
completion, approval, or permission. Missing/stale recent metadata must not
block independent prototype work: report the gap and use bounded source lookup.

## Existing local hook evidence

Read-only inspection on 2026-09-05 found core.hooksPath explicitly set in the
repository's Git config to /home/vrondelli/projects/domainspec-core/.git/hooks.
No pre-commit, post-commit, post-rewrite, post-checkout, or post-merge file was
present at that configured path during inspection.

The versioned .githooks/pre-commit exists, formats selected working-tree paths
with npx Prettier, and re-stages them. It is not enabled by the inspected hook
path. Pointing core.hooksPath to .githooks would activate unrelated behavior.
A future installer must inspect and preserve the current configuration and
existing hook files, and show the exact install/uninstall delta before activation.

No hook configuration, hook file, staged content, or commit was changed by this
research. Git config evidence is a dated observation, not a future guarantee.

## Construction and operational lanes

Product-construction frontier: prototype capability meaning and product-test
contract, informed by the verified source locations above.

Runnable construction:

- choose the capability home and state exact prototype definitions;
- scaffold its business concepts and relationships without ontology admission;
- author the alchLang model and DomainSpec prototype source;
- compile deterministic graph/system scaffolds;
- implement an on-demand query, then an optional cache and hook adapter;
- freeze one exact candidate, execute the product tests, and obtain product
  approval before separate operational authority decisions.

No registered target ontology records are consumed by this research. The local
package profiles and entry documents are source evidence only. Construction
must explicitly select any later ontology and compiler dependencies.

| Operational support | Owner | Affected stage | Current disposition |
| --- | --- | --- | --- |
| Hook installation/configuration | Repository owner | Post-test operational activation | Deferred; no block on query/adapter prototypes. |
| Formal capability/project registration | Owning CyberAlchemy product/Project route | Administrative identity; exact construction dependency to be established | Deferred; no registration claim. |
| Durable session persistence | Context/runtime owner | Future session restoration | Current session route unavailable; not required for recent-change view. |
| Commit/push/publication | Repository publication owner | Publication | Outside this proposal's effect envelope. |

Causal construction decisions: exact capability home, selected AlchLang carrier
and compiler, and concrete source/output scope. These do not prevent research or
candidate contract drafting. Deferred operational residue remains separate.

## Product-test criteria

Use isolated temporary Git repositories rather than committing test fixtures
into the user's working repository. Required cases:

- successful initial/ordinary/empty commits and failed commit attempts;
- added, modified, deleted, renamed, spaced, Unicode, and newline-containing paths;
- merge history under the declared first-parent policy;
- amend, reset, rebase, detached HEAD, and branch switches;
- linked worktrees, independent caches, concurrent writes, and interrupted writes;
- missing, stale, corrupt, or unwritable cache and uninstalled/missed hooks;
- staged/unstaged/untracked changes remain untouched and separately classified;
- project scope excludes unrelated recent work; unmapped paths stay unresolved;
- private/public submodule boundary retained without content traversal;
- source/output limits are enforced and truncation is explicit;
- no network/model invocation, auto-staging, commit recursion, or hook overwrite;
- an agent can find the requested recent change from the brief and source links.

Structural validation alone does not establish the last user-facing outcome.
Measure lookup latency, output size, correct target discovery, and unnecessary
file reads against a plain Git-log baseline before expanding the feature.

## Open Questions

- Does the user want this turn limited to researched design, or a tested local
  prototype with hooks inactive? An optional question was sent; no answer has
  been recorded in this artifact.
- Which capability home owns the recent-context view? Context owns the frame;
  its entry document delegates resolver/runtime behavior to Registry Context.
  Do not assign runtime ownership to Context or AlchLang by naming proximity.
- Which exact alchLang model/carrier and compiler are selected for construction?
- What retained task record should provide intent, decisions, and unfinished work?
- Are 20 first-parent commits and a bounded metadata-only brief sufficient for
  the first user workflow? Tune from measured use, not market-prevalence claims.

## Local source fingerprints

Whole-file SHA-256 values below pin only the local evidence read for this design.
No source digest refresh is an approval or authority decision.

- `cyberAlchemy-v2/agent-routing/routes.json`: `055525eff4ca6fa8cfcbacc9177ef7b52373b47d9b0df10edad3a85ca0b1bc00`
- `cyberAlchemy-v2/agent-routing/ROUTER.md`: `2b92e8fb5e8ce0b6278f26acacc2e1a08ae83d493a7e307aa4afa20ba990b479`
- `cyberAlchemy-v2/language/capabilities/alchlang/profile.json`: `e920f83690b572dae8eb6b3e2d935ef1b8783dbaee0eceb29797f452b3bcf18b`
- `cyberAlchemy-v2/language/capabilities/alchlang/README.md`: `b2ecc59973d8bbc3ca944fd3be8dcfaf562cd1e826578f5388e0fdddf27c213e`
- `cyberAlchemy-v2/context/profile.json`: `5e23a1f8f7d204b05c435b8364db465d17821845aeca48ce841bdaf96c1aa686`
- `cyberAlchemy-v2/context/README.md`: `97550af74d600a415c562ffeca18e1515189d9437b90d0e650a769038909f041`
- `.githooks/pre-commit`: `204358b5d7b92cc2af802565262c813f3139028757f176c51247cf648166af62`
