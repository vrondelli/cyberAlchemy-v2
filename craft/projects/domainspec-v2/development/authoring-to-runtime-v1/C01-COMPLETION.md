# C01 bounded completion — unified profile architecture

Date: 2026-09-20. Status: scoped complete. Authority effect: none.

## Result

C01's bounded obligation is satisfied. `application-v1` is the only registered
product-language profile. A single closed selector establishes root profile
identity for both CLI dispatch and the shared domain parser. Historical SFOL is
an explicit compatibility record (including its preserved no-profile default),
while existing capability adapters and Rust/local-host packages are registered
as non-product capabilities with closed command surfaces.

No adapter was silently promoted, removed or reinterpreted. Duplicate,
malformed and unregistered root profiles reject before semantic dispatch. A
command outside the selected profile contract rejects instead of falling
through to another adapter.

## Obligation accounting

| C01 obligation | Evidence | Result |
| --- | --- | --- |
| Profiles select bounded capabilities | Frozen descriptors declare role, parser/model owner, commands, capabilities and optional-package boundary. | Pass |
| Profiles do not redefine the product language | Exactly one descriptor has `product_language: true`: `application-v1`. | Pass |
| Shared selection boundary | CLI dispatch and `parseDomainSource` call `selectAlchSourceProfile`; legacy per-profile dispatch regexes are removed. | Pass |
| Compatibility remains explicit | Application, explicit legacy and historical-default cases share exact selector/parser identities. | Pass |
| Competing claims fail closed | Unknown, malformed and duplicate roots reject causally; package-local adapters cannot enter the shared product parser. | Pass |
| Optional packages are preserved | Rust and local-host identities remain bounded optional-package descriptors and retain their existing implementations. | Pass |
| Profile compatibility matrix | `PROFILE-ARCHITECTURE.md` records the complete shipped-root classification and ownership boundary. | Pass |

## Fresh validation

- `npm run typecheck`: pass.
- Selector/parser/source/CLI suite: 18 passed, zero failed or skipped.
- Applicable capability-adapter suite: 35 passed. Three module-configuration
  cases are not evaluable because the pre-existing external
  `implementation/agent-reasoning-engine/packages/module-port/alch-semantic-adapter.mjs`
  file is absent.
- Optional-package, Rust event execution, ontology projection and migration
  suite: 48 passed, zero failed or skipped.
- Diff whitespace validation: recorded at the completion boundary.

A broader local-host runtime run was diagnostic only. Its listener-dependent
cases could not start because the existing provisioner rejected
`work-orchestration-implementation/runtime/Cargo.toml` as `SOURCE_DRIFT` against
its source manifest. C01 did not modify that source or manifest, and the failed
runtime cases are not counted as profile-architecture evidence.

## Evidence surface

- `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/profile-architecture.ts`
- `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/cli.ts`
- `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/parser.ts`
- `language/capabilities/alchlang/plans/general-compiler-v1/implementation/test/profile-architecture.test.ts`
- `PROFILE-ARCHITECTURE.md`
- `COMPATIBILITY.md`

## Claim ceiling

This proves a closed root-profile architecture and compatibility boundary. It
does not prove C02's thirteen-type breadth, C03's full FormalClaim consumer
closure, C04's multi-file/multi-entry composition, three-language parity,
installed-package behavior, product approval, publication, deployment or
production readiness.

Progress is 18 of 37 scoped nodes. C02, C03 and C04 are dependency-ready.
Product-owner validation remains deferred until L4X.

## Open Questions

C02–C04 own any capability promotion through the shared normalized model. The
missing external module adapter and unrelated provisioner source-manifest drift
remain with their existing owners; neither is a C01 fallback authorization.
