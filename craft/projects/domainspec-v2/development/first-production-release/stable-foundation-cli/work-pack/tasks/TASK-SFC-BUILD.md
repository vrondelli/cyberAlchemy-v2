# TASK-SFC-BUILD — One-lock compiled reproducible package

Layer/slice/wave: L1 / SFC-S2 / W1.

## Objective

Replace the supported build path's pnpm/source-run ambiguity with npm 11.17.0,
one root lockfile-v3 graph, an exact network-disabled script policy, compiled
JavaScript staging, and two-root reproducibility.

## SWU-SFC-009 — npm workspace and lock authority

- Primary behavior: resolve one complete supported dependency graph and script
  policy under `impl/package-lock.json` without renaming the impl workspace.
- Independent acceptance: exact npm version/lock/workspaces/dependencies/scripts
  pass; nested pnpm authority, undeclared install scripts, ranges/drift, missing
  integrity, or network-enabled build policy fail.
- Split analysis: root package, root lock, removal of competing pnpm manifests,
  CLI dependency declaration, and policy validator are one dependency-authority
  transition. Artifact compilation remains independently reproducible in 010.
- Dependencies: SWU-SFC-008 and owner-reviewed SFC-PR-002.
- Write scope:
  - `projects/domainspec-v2/impl/package.json`
  - `projects/domainspec-v2/impl/package-lock.json`
  - `projects/domainspec-v2/impl/pnpm-workspace.yaml`
  - `projects/domainspec-v2/impl/test-derivation-engine/pnpm-lock.yaml`
  - `projects/domainspec-v2/impl/test-derivation-engine/pnpm-workspace.yaml`
  - `projects/domainspec-v2/impl/cli/package.json`
  - `projects/domainspec-v2/impl/cli/contracts/build-policy.json`
  - `projects/domainspec-v2/impl/cli/tools/validate-build-policy.mjs`
- Done: npm 11.17.0, one lock v3, exact versions/integrity, no competing manager
  authority, scripts denied except exact reviewed build-only allowlist.
- Validation: `VC-SFC-009`; failure of the first command remains controlling.
- Execution owner: Task Session with build/security owner prerequisite.
- Expected receipt: `runs/SWU-SFC-009/TASK-SESSION-RESULT.json`.

## SWU-SFC-010 — compiled staging and two-root reproduction

- Primary behavior: compile and stage the exact CLI artifact with no runtime
  install, then reproduce it and normalized command results from two clean roots.
- Independent acceptance: artifact manifest binds source/lock/policy/runtime/build
  bytes; two arbitrary roots produce equal hashes; absolute paths/timestamps/caches,
  source-run coupling, network, or runtime install mutants fail.
- Split analysis: compilation, staging manifest, clean-root harness, and equality
  comparator form one reproducible-artifact behavior. Dependency authority passes
  separately in 009; dependency audit remains 011.
- Dependencies: SWU-SFC-009.
- Write scope:
  - `projects/domainspec-v2/impl/cli/tsconfig.build.json`
  - `projects/domainspec-v2/impl/cli/tools/build.mjs`
  - `projects/domainspec-v2/impl/cli/tools/stage-artifact.mjs`
  - `projects/domainspec-v2/impl/cli/tools/reproduce-clean-build.mjs`
  - `projects/domainspec-v2/impl/cli/acceptance/build`
  - `projects/domainspec-v2/development/first-production-release/stable-foundation-cli/evidence/build`
- Done: compiled JS, external Node manifest, content-addressed stage, two-root
  equality, no ignored cache/source-map/private-path residue.
- Validation: `VC-SFC-010`.
- Execution owner: Task Session.
- Expected receipt: `runs/SWU-SFC-010/TASK-SESSION-RESULT.json`.

## Stop conditions

Network need, a new package manager, unreviewed script, license/risk acceptance,
destructive cache cleanup, or release staging stops before mutation.

