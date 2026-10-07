# Router checkout layout

Status: candidate construction revision, 2026-09-07. Authority effect: none.

## Source meaning and bounds

`scripts/layout.py` owns physical source selection for validation and building.
Logical `cyberAlchemy-v2/` references always mean this local checkout. If its
parent is named `domainspec-core`, the compatibility layout is umbrella;
otherwise DomainSpec v2 and the Node/TypeScript toolchain resolve only through
the in-repository `craft/` source. No search or missing-file fallback selects
another checkout. Symlink redirects of that mount, traversal, absolute paths,
public/generated instruction sources, and symlinks escaping a selected source
root are rejected.

Umbrella `AGENTS.md` means the umbrella instruction file. Standalone instructions
come from this checkout's `AGENTS.md`, never the unrelated parent directory.
Both instruction formats enforce the same routing markers and forbidden routing
directives. The local ontology read-model link is allowed as evidence only.
The only other mounts are the exact submodule-discipline document and the
DomainSpec compiler/toolchain prefixes. These are source inputs, not route owners.
Local project lookup does not acquire those external mounts.

## Build and tests

From this checkout, install the locked local runner using
`npm ci --prefix agent-routing --ignore-scripts --no-audit --no-fund`.
Build with `npm run --prefix agent-routing build`; verify reproducibility with
`PYTHONDONTWRITEBYTECODE=1 python3 agent-routing/scripts/validate.py --verify-build`.
The runner pins Node 26.8.1 and tsx 4.20.6, matching the selected compiler package.
Builds read the actual DomainSpec compiler in the selected mount and write only
local candidate projections. Replay emits JSON, compares two independent runs,
and checks the exact seven generated artifacts against disk.

The projection binds the selected instruction file, layout mode, compiler,
runner manifest/lock, source inventory, contracts, tests, and implementation.
The D65 and D67 selectors, product capability, and business ontology retain their
existing inspected semantic hashes. No canonical source or approval was changed.
The directly selected recent-context AlchLang compiler receipt had stale
`src/cli.ts` and `src/index.ts` bindings. Its actual builder was rerun against
the inspected current sources; model, query, and replay tests cover the new
candidate epoch. The adapter and compiler implementation were not modified.
The authored DomainSpec source records the explicit layout and sibling lookup
conditions; generated views remain derived candidate evidence.

Current product frontier: layout-compatible route validation and reproducible
candidate construction. Runnable work: source selection, route/lookup tests,
and deterministic replay. Operational owner: future repository operator for
missing orchestrator/submodule restoration, affecting future runtime selection
only. That residue does not block router construction. Product approval,
profile admission, runtime activation, and deployment remain ungranted.

## Open Questions

- Other checkout shapes require an explicit mapping amendment and tests; no
  arbitrary root override is supported.
- Which operator will restore the absent orchestrator sources and submodules?
- Which owner will review this exact tested candidate for product approval?
