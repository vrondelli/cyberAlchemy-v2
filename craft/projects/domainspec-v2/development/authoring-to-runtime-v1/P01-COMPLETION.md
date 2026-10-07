# P01 completion — exact package boundaries and user documentation

Date: 2026-09-20. Status: scoped complete. Authority effect: none.

## Completion statement

P01 is complete for the current package-shape construction boundary. AlchLang
core, optional Rust and experimental local-host archives now have committed
exact file allowlists, command maps and export maps. The separate
`@domainspec-v2/cli@1.0.0` package boundary is hash-bound and expanded from its
declared directories to exact current files, including schemas, the
reconciled-commerce example and product documentation.

Packaging copies only allowlisted files, then compares the observed npm archive
inventory to the committed allowlist. Emitted AlchLang declarations contain no
checkout-relative `craft/` or `language/` imports.

## Package accounting

| Package | Files | Boundary |
| --- | ---: | --- |
| `@cyberalchemy/alchlang` | 229 | Core API/CLI, curated application/formal/language docs, and complete deterministic `application-v1` examples for TypeScript, Python and Rust; no Cargo templates or Rust/local-host modules. |
| `@cyberalchemy/alchlang-rust` | 203 | Optional Rust CLI, Rust builder/conformance exports and locked native templates; no local-host modules. |
| `@cyberalchemy/alchlang-local-host` | 211 | Experimental repository-bound host API/CLI and its documented consumed surface. |
| `@domainspec-v2/cli@1.0.0` | 1595 | Existing exact compiler package expanded to current files across exports, schemas, examples, tools and docs. |

Development source, tests, scripts, `node_modules`, docs-app source, generated
workspaces and repository package-artifact directories are excluded from the
AlchLang candidate archives.

## Validation

- AlchLang strict typecheck: pass.
- AlchLang build: pass.
- Exact boundary/allowlist/archive suite: 5/5 pass, zero skips.
- Optional-layer CLI and separation suite: 3/3 pass, zero skips.
- P01 qualification validator: 2/2 pass, zero skips.
- Combined package suite: 10/10 pass, zero skips.
- Qualification: `evidence/p01-package-boundaries/qualification.json`, SHA-256
  `6187dd93de974e73dab4f0d72d6c4839634b8bc1edce8354c0fb492ccbe7f02f`.

## Claim ceiling

This closes P01 package shape only. It does not prove clean installation or
execution, freeze final archive bytes, publish, release, deploy, validate a
product, operate production or grant authority. P02 owns installed consumers.

This P01 boundary has been refreshed to include the deterministic installed
examples exercised by P02. The separate P02 evidence now proves clean
installation and execution; it does not expand P01's package-shape claim.
Product-owner validation remains deferred until L4X.

## Open Questions

P03 owns freezing the exact tested archives, environment identities and
currentness validator. P01 and P02 remain construction evidence only.
