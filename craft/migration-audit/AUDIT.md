# DomainSpec-core to Craft consolidation audit

Date: 2026-09-19. Status: additive source copy verified; dependency cutover not
performed. Authority effect: none. Visibility: private.

## Outcome

Copied and SHA-256 checked **19,256 files / 318,394,265 bytes** from explicit
source roots. The destination preserves the source's internal directory layout.
Original files, unrelated dirty work, Git history and existing CyberAlchemy
candidate copies were not modified. The copy includes tracked and untracked
working-tree files; it is not limited to the latest commit or latest CLI work.

## What was preserved

| Area | Scope |
| --- | --- |
| Product and language meaning | Product thesis, architecture, definitions, relationships, axioms, authority, ontology, discovery, formalization, capabilities |
| Implementations | Entire source `impl`: CLI, generators, provider/integration code, test-derivation engine, architecture conformance, governance, validators and operational-resilience experiments |
| Development | All 74 development subdirectories, including reconciliation, BMCREL-related relationship work, meta-type factory reproducibility, EVF, SFOL, first-production-release, source contracts, prior decisions, active DAG and tests |
| Research | Product research plus dedicated DomainSpec, SMT/FOL, Lean implications, paper-evidence and proof-obligation substrate research outside the product root |
| Supporting concepts | Framework-unification and ontology project sources, deterministic test-derivation development |
| Tooling | Root tools and pinned Node/TypeScript toolchain source/configuration |
| Provenance | Parent package/workspace/lock/build manifests, source Git state, source-to-destination manifest and copy receipt |

Development accounts for 15,634 files / 288,346,929 bytes; implementation
accounts for 2,645 files / 19,759,168 bytes. Development is not automatically
disposable: the current compiler's materializers consume exact contracts and
baselines from it. Historical experiment `dist` and coverage evidence were
preserved, unlike the rebuildable active CLI `dist` directory.

## What was deliberately not copied

Installed `node_modules`, active CLI build output, Git metadata and caches were
excluded. Symlinks are not followed; credentials and local databases are excluded
by policy. Every selected-root exclusion appears in `source-manifest.json`.
Original source remains the recovery copy. No repository, database, container,
volume or source branch was deleted.

Application projects such as Body War and Auth Foundation are consumers/test
environments, not silently adopted as Craft implementation. References to them
are retained and inventoried. A reference in a document is not sufficient proof
that its entire project must become a Craft runtime dependency.

## Dependency findings

1. **CLI alone is insufficient.** Its build materializers depend on definitions,
   relationship authority, development baselines, reconciliation source capsules,
   integration contracts and native publication sources. These are now copied.
2. **Shared tooling is outside the old product root.** CLI TypeScript configuration
   extends `toolchains/node-typescript`; the compatible hierarchy is copied.
3. **Alch still resolves the old checkout.** `src/domainspec-cli.ts` and
   `scripts/run-toolchain.mjs` in the Alch implementation select sibling
   `domainspec-core/projects/domainspec-v2/impl/cli` (or an explicit package root).
   Copying does not alter those active consumers.
4. **Old workspace assumptions remain.** Foundation/governance tooling computes
   a repository root by directory depth; frozen contracts include original
   `projects/domainspec-v2` paths and exact hashes. Do not bulk-rewrite historical
   evidence or silently refresh its hashes.
5. **Existing CyberAlchemy migrations already exist.** The product, architecture,
   authority, implementation and development mirrors and `current-candidate-*`
   trees must be compared before consolidating active ownership. None was
   overwritten, deleted, or treated as authoritative merely because it exists.
6. **External consumers are a separate closure.** Operational-resilience canaries
   reference Body War/Auth; tests and governance fixtures reference CyberAlchemy.
   These are not evidence that the CLI requires every old application at runtime.
7. **Formal tooling is external too.** The parent `.formal-tools` points into
   user-local tooling; binaries, credentials and installed toolchains are not
   transferred by this source copy.
8. **The old provider decision remains pending.** Messaging destination ownership
   was not resolved by migration. The copied execution record retains that state.

Machine-readable detail: `source-references.json` records source references;
`workspace-reference-map.json` records repository-wide lexical consumers and
scan exclusions. These are discovery evidence, not a
claim that every lexical match is executable or that dynamic path closure is
proved. Files over the reference scan's 4 MiB limit are listed, not silently
declared clear. The selected source copy itself hashes files without that limit.

## Repository-wide discovery results

The reference scan completed: 37,261 enumerated files in DomainSpec-core
(5,916 lexical matches) and 597,645 in CyberAlchemy (5,011 matches). This is an
`rg --files --hidden` inventory with Git ignore rules and explicit cache/build
exclusions; it is not a claim to inspect ignored files or all possible dynamic
dependencies. Forty core and 140 CyberAlchemy files exceeded the 4 MiB text-scan
limit. Product files were nevertheless included in the byte-verified copy.
The oversized DomainSpec product files are historical EVF audit-kit archives,
Rust experiment binaries and compressed recovery preimages, not omitted source.

The expanded copy also preserves `research/projects/domainspec`, the Bolina
formal-modeling research, Lean refresh/validation ledgers, the skill/agent
canonicalization records and the governance-kernel build-path decision. Relevant
handoff records referencing `projects/domainspec-v2` are retained under
`support/core/.arcanum/handoff-notices`, as historical evidence, not an activated
handoff queue. Shared indexes retain original references and do not claim that
every unrelated indexed project was copied.

### Dependency classification and required treatment

| Surface | Classification | Treatment |
| --- | --- | --- |
| CLI `src`, templates, contracts, definitions, authority and materializers | Product/build source | Copied with original hierarchy; seven materializer/schema checks pass |
| Development source capsules and frozen catalogs | Build inputs plus immutable evidence | Copied; keep hashes and paths intact until a versioned rebinding is validated |
| `toolchains/node-typescript` | Shared build dependency | Source/configuration copied; installed tools must be provisioned independently |
| Parent package/workspace manifests | Mixed umbrella workspace | Preserved under `support/core`, not activated; the original workspace includes unrelated applications |
| Alch `src/domainspec-cli.ts` and `scripts/run-toolchain.mjs` | Active package/tool resolver | Still chooses old sibling roots unless explicitly bound; requires tested Craft rebinding |
| CyberAlchemy `tools/toolchain/verification.json` | Active verification entry point | Still names the original CLI working directory; must move with the resolver |
| CLI `tools/governance-kernel.mjs` | Executable repository-layout assumption | Reads `cyberAlchemy-v2/language/realization-bindings.json` and governance product nodes beneath its calculated root; that is not Craft's new layout |
| CLI `tools/freeze-integration-product-candidate-v2.ts` | Explicit external source pins | References CyberAlchemy Define/plan/matrix files with exact hashes; retain provenance, resolve local ownership explicitly |
| Body War, Auth Foundation and other application projects | Consumers and integration/canary environments | Inventory references, do not absorb whole applications into the compiler |
| `.formal-tools` and Node/Rust/Python installations | Host prerequisites | Document/provision; not source files to copy or symlink back into core |
| Existing CyberAlchemy DomainSpec trees | Parallel historical/candidate work | Byte comparison completed; retain unique content and reconcile deliberately |
| Core handoff notices and governance decisions | Historical process evidence | Copy relevant records without activating their old routes or authority |
| Core inventory indexes and unrelated application/research references | Discovery/consumer evidence | Reference map retained; not promoted to runtime dependencies solely because of a text match |

### Existing candidate comparison

`candidate-comparison.json` compares the existing implementation mirror and ten
candidate trees against the copied DomainSpec product files. Caches, installed
dependencies, `dist` and coverage directories are excluded from this comparison.

The unnumbered implementation mirror has **1,972 identical files, 125 differing
files and 898 paths absent from the core baseline**. Most unique paths belong to
EVF repair assurance, CRABS replay/convergence and verification-tier work. A
difference does not establish which version is newer or authoritative. They are
already inside CyberAlchemy and remain preserved there; no merge or overwrite
was performed.

The candidate trees have 588–600 differing files each, and zero or one unique
path each. They cannot safely be treated as interchangeable duplicate folders.
Their exact paths and hashes are in the comparison report. The intended active
Craft source is the new copy, but switching existing consumers requires semantic
review of relevant divergent implementations, not a bulk directory replacement.

## Validation performed in the copied CLI

All seven checks passed from `craft/projects/domainspec-v2/impl/cli`:

- frozen catalog: 39 realization rows;
- relationship authority: 31 signatures;
- integration profiles: 5 definitions / 3 languages;
- reconciled source capsule: 136 sources;
- cross-generator source capsule: 18 sources;
- native atomic-publication source/payload currentness;
- packaged schemas and their references.

Every copied file was compared against its source hash before and after copying.
This proves the stated copy and source-materializer closure, **not** an independent
clean build, full test pass, active-consumer cutover or safe deletion of the old
checkout. No installed dependencies were copied to create a false clean-build pass.

## Docker cleanup

`docker image prune --all --force` completed successfully and reported
**6.797 GB reclaimed**. Docker went from 61 images to 7; all 8 containers and
9 volumes were retained, with the same 5 running containers. Build cache was not
pruned. Images used by stopped containers were retained. Deleted images need to
be pulled/rebuilt to use again. WSL free space is not Windows VHDX compaction.

## Remaining work before removing the dependency

1. Use the classified reference map to close executable dynamic roots and source
   registries; preserve historical references without treating them as live roots.
2. Establish an independent locked Craft development workspace; install its
   dependencies without linking back to the original checkout.
3. Build/typecheck the copied compiler and run native TypeScript, Python and Rust
   regression plus installed-package checks from that workspace.
4. Rebind Alch package/toolchain discovery and other active consumers explicitly;
   test with the old root unavailable to those consumers.
5. Compare existing CyberAlchemy candidates, preserve their unique changes,
   and document one selected active source plus immutable historical sources.
6. Validate the entire active dependency closure and update navigation/registries
   under their applicable identity rules. Source deletion remains a separate
   action and has not been requested here.

## Open questions / claim boundary

No further decision was assumed about provider semantics, authority admission,
package renaming, publication, or removing historical evidence. The copy is
verified; a complete semantic dependency audit and cutover are not yet proved.
