# Node 26 Migration Report

Date: 2026-08-29

## Implemented boundary

- Runtime authority: Node 26.8.1 container, pinned by image digest.
- Package manager: pnpm 10.34.5 for every active workspace package.
- Type authority: TypeScript 7.0.2, with the TypeScript 6 compatibility API
  alias only where ecosystem tooling still imports the compiler API.
- Shared configuration: `tsconfig/base.json`, `tsconfig/node.json`, and
  `tsconfig/browser.json`.
- Dependency authority: one pnpm lock and one current Docker module volume for
  the parent workspace and for each independently versioned private submodule.
- Browser authority: Playwright 1.59.1 through the shared container wrapper.

Public Arcanum, collaborator-owned submodules, historical or staged evidence,
and the protected dependency fixture named in `migration-inventory.json` were
not migrated or cleaned.

## Security result

The final `pnpm audit --audit-level=low` result is clean for all three active
dependency graphs:

- parent workspace: no known vulnerabilities;
- `implementation/domainspec`: no known vulnerabilities;
- `validation/poker-team`: no known vulnerabilities.

Vulnerable Drizzle Kit development dependencies were removed where committed
SQL migrations already provide the migration authority. Vulnerable Vitest,
Vite, esbuild, and OpenTelemetry dependency paths were upgraded or overridden
to audited versions.

## Validation result

- The container reports Node 26.8.1, npm 11.19.0, pnpm 10.34.5, and TypeScript
  7.0.2; the toolchain validator passes.
- Auth, Ontology Evidence Workbench, Body War, low-risk parent packages, the
  private DomainSpec web app and test engine, and Poker Team typecheck/build/test
  gates passed under the container.
- Poker Team completed 461 passing backend tests with 67 intentional skips. Its
  browser suite is not evaluable without the declared PostgreSQL service at
  `127.0.0.1:5439`; the harness otherwise reaches the migrated runtime.
- Existing red gates were reproduced without being hidden: RPV has eight stale
  fixture-contract failures; the parent DomainSpec engine has 14 stale
  registry/digest/fixture failures; its legacy build graph imports sources
  outside its declared root; and the private DomainSpec backend/Craft API still
  depend on missing or historically pinned external inputs.

## Cleanup result

- Removed active checkout `node_modules` trees, including at least 1.1 GB from
  the measured later waves.
- Removed active leaf npm/pnpm lockfiles in favor of each boundary's root pnpm
  lock.
- Removed 16 superseded Docker module volumes. The only current module volumes
  are the parent workspace, `implementation/domainspec`, and
  `validation/poker-team`; the shared npm cache and pnpm store remain.
- Removed the stray checkout `.pnpm-store` and 50 reviewed current-source Python
  cache directories, including three tracked `.pyc` files in the private
  DomainSpec submodule.
- Seventeen `node_modules` directories remain only in excluded historical,
  protected, collaborator-owned, or ignored project material.

## Remaining migration debt

Four active packages still use `tsx` directly. This is explicitly transitional:
their current build graphs do not all emit runnable JavaScript cleanly, so the
doctor remains in report mode rather than enforcement mode. Converting those
scripts requires repairing their inherited compile boundaries first.

No commit, push, publication, deployment, or external product effect was
performed. Deferred lifecycle reconciliation is recorded by Handoff Notice
`HN-5D3C673BD5FB`.
