# R04 — Named public-contract Mapping bindings

Status: completed bounded R04 candidate; R05 is next.
Updated: 2026-09-09. Authority effect: none.

## Outcome and retained decisions

The additive `domainspec.typed-mapping/v3` source binds explicit domain/public
inputs to an Entity or Interface-owned named public target. Shared contract
identity is the pair `interface_selector` and `contract_id`; optional member-use
evidence selects a declared `operation_id` and request/result side separately.
The entire member endpoint type must agree, including wrappers. No implicit
unwrap, same-shaped contract substitution, domain construction or Calculation call.

The current frozen graph authority defines `maps` to Entity/Interface and
`exposes` from Interface to Operation/Query. The plan's maps-from/maps-to wording
is interpreted as endpoint roles, not permission to add verbs. Exactly one maps
edge selects the target owner; compiler input/field/member bindings add no edges.
A Value Object may be an input/shared public field, not a new canonical maps target.

All previous Mapping formats, source-selection files, Workflow recovery choices
and native implementation forms remain unchanged. R04 implements source checking,
not native v3 generation; R05 is the explicit successor.

## Construction and verification

Definition: [public-mapping-contract.json](public-mapping-contract.json).
Ontology scaffold: [public-mapping-candidate.json](../ontology/public-mapping-candidate.json).
Direct DomainSpec fixture: `impl/cli/test/input/public-mapping.test.ts` authors
a project, Entity, two Queries, named Interface, Mapping and canonical edges.

The registered adapter requires one checked graph, composition boundary and exact
field compilation plus exact definition bytes. Its frozen result retains the
Mapping source, Interface declarations/member references, typed field projection,
graph certificate and digest. Copies, mixed graphs and altered definitions reject.
No disk reread is needed after the checked snapshot.

The new source-selection v7 is explicitly bound to unchanged v6 and every earlier
selection. It pins changed parser bytes, the new public Mapping module and
definition. Only live positive configuration-preview fixtures select v7.
Old pinned selections correctly detect drift; no historical hashes were refreshed.

Independent expected outcomes cover inbound/outbound multi-input projections,
shared member uses, qualified cross-Interface identity, same-shaped wrong
contracts, optional positions, defaults, total/empty contracts, nested contracts,
shared Value Objects/Enums, sums, list/set path distinctions, Entity leaks,
recursive/unresolved closure, exact maps/exposes, inert data, ownership and forgery.

A compatibility control without any named Interface exposed a real legacy proof
gap: formalization accepted v3 while omitting its new semantics. Explicit v3
rejection was added to formalization and legacy runtime preflight. The rejection
is Mapping-specific; it does not depend on another unsupported node being present.
Legacy generators already reject v3. No v1/v2 behavior was changed.

### Executed checks

- Source typecheck, frozen catalog/relationship/integration-profile checks: pass.
- Initial new suite: 10/10. The added Mapping-only proof control failed before
  explicit legacy rejection, then passed after the fix.
- Corrected final compatibility run: 55 passed, zero failed, one existing skip,
  56 total in 23942.442096 ms. Includes final 12/12 public Mapping checks,
  runtime-l2, static-backend-completion, thin-backend-verticals and formalization.
  The skipped native Lean compile reports no installed Lean provider; no Lean
  execution proof is claimed.
- Initial compatibility run from the project root: 34 passed, 5 failed. Four
  failures were working-directory/local-dependency setup; one test asserted an
  error code against message text. Re-ran from `impl/cli` with the existing locked
  dependency cache and corrected the assertion to inspect `error.code`.
  No timeout, dependency version or production behavior was changed to pass.
- Eleven-suite native/configuration regression: **212/212 passed**, zero failures
  or skips, in 247621.36591 ms with test concurrency 2. Includes final public
  Mapping tests, project-model, interface-mapping-scopes, compiled-field-model,
  composition-boundary, configured Mappings, named Interfaces, configured Enums,
  configured Rules, configured factories and configuration selection.
- 21 protected source files match R04 entry hashes. Package edit registers only
  the new test; existing positive preview edits only select the v7 source file.

Locked tests use Node 26.8.1 and the already resolved dependency cache.
Native generator suites use the pinned Docker TypeScript 7.0.2 image.
An owned temporary `impl/node_modules` symlink supported legacy subprocess tests;
it was removed after both runs finished. Dependency cache and packages remain
unchanged. No package installation.

## Exact scope and provenance

Initial 17-file allowlist was expanded by two compatibility-only guards after
the failing proof control; runtime preimage was
`445a0ebe3ecf6628497b71599c8735ec4aa26199ee75701d2ac6bbcb0e8be802`,
formalization preimage was
`0cbef5ab6ff9d11c52655a9b71fa928f97ed5dc20ad2a18979d0158ab06f7e58`.

- `impl/cli/src/typed-backend/mapping-public.ts`
- `impl/cli/src/input/compiled-public-mapping.ts`
- `impl/cli/src/input/project-model.ts`
- `impl/cli/test/input/public-mapping.test.ts`
- `impl/cli/package.json`
- `development/reconciliation-v1/profile-compiler-reconciliation/public-mapping-contract.json`
- `development/reconciliation-v1/ontology/public-mapping-candidate.json`
- `development/reconciliation-v1/profile-compiler-reconciliation/PUBLIC-MAPPING-BINDINGS.md`
- `development/reconciliation-v1/profile-compiler-reconciliation/configuration-public-mapping-v1-sources.json`
- `development/reconciliation-v1/profile-compiler-reconciliation/configuration.mjs`
- `development/reconciliation-v1/profile-compiler-reconciliation/configuration.test.mjs`
- `impl/cli/test/generation/configured-enums.test.ts`
- `impl/cli/test/generation/configured-rules.test.ts`
- `impl/cli/test/generation/configured-factories.test.ts`
- `development/reconciliation-v1/profile-compiler-reconciliation/CLI-COMPLETION.md`
- `development/reconciliation-v1/profile-compiler-reconciliation/STATUS.md`
- `development/reconciliation-v1/profile-compiler-reconciliation/remaining-work-plan.json`
- `impl/cli/src/runtime/in-memory.ts`
- `impl/cli/src/formalization/projection.ts`

Implementation/contract identities (before evidence-only ledger updates):

| Source | SHA-256 |
| --- | --- |
| `impl/cli/src/typed-backend/mapping-public.ts` | `605e8f9f8d96b582a41428f65b72fc79c022e6b4c2bb58e97cd8fdaf28f59ecc` |
| `impl/cli/src/input/compiled-public-mapping.ts` | `7b5c6a45815a0549d06ee11c0b78dae0a54a4ad99e744e2795fd0c0dffc0a7ee` |
| `impl/cli/src/input/project-model.ts` | `42346249031c2968d962a9839a5cbb93b970897e7f5810d0a7c56a805e3f7355` |
| `impl/cli/test/input/public-mapping.test.ts` | `627e9ae3b2f49f9ba05f01af205a6acb49917bf1e35c9dc879dbf54aeb1b63e4` |
| `impl/cli/package.json` | `aefc4fbe26c2f6ae3ad380ca684971835bab56b0252ad187ec03203251aa3dc2` |
| `development/reconciliation-v1/profile-compiler-reconciliation/public-mapping-contract.json` | `5de04e24cbd6a137b3f3120b5fbfbba2775339f26cfb3d56498eaf6ae8e067b3` |
| `development/reconciliation-v1/ontology/public-mapping-candidate.json` | `4188036ab4ea3d51e2cd4ee390f2b129ce50d173a9dd279675a40582cdf084b6` |
| `development/reconciliation-v1/profile-compiler-reconciliation/configuration-public-mapping-v1-sources.json` | `44b9cc3ebd70b9fc275905d4236e0cf93b2e5d6fbed602994ee7a76e3e0ac1e6` |
| `development/reconciliation-v1/profile-compiler-reconciliation/configuration.mjs` | `a0fd4b7ca19e56cb856b99f064fd4e1419c092d8bbc691293a6a9e21b57edf33` |
| `development/reconciliation-v1/profile-compiler-reconciliation/configuration.test.mjs` | `6367e3e1b1c19d61d24cc554f9da8decc90171554fe3df2f5f1795d00000fb78` |
| `impl/cli/test/generation/configured-enums.test.ts` | `c5625ee45b44d99f5f47046998d8f6a7f43416ae4dfc7d496b357e163e1fb781` |
| `impl/cli/test/generation/configured-rules.test.ts` | `c45adc7c4283cd63915067a1975bcc22bbc153c3cbe5dcea59de3603759e9573` |
| `impl/cli/test/generation/configured-factories.test.ts` | `f2969c2d5af5e14e080fc6d3ec0e969f7448b4524623f9af96f9bd951960512f` |
| `impl/cli/src/runtime/in-memory.ts` | `88fe97f977879aae032ff5bf6bd98f7bed82761d3bf1b84e8a5995ff6a053df4` |
| `impl/cli/src/formalization/projection.ts` | `f5d477a7b0385c8ac46de35aa51311369d8b1e4af617972992a20f6a6d965db1` |

ARE request `ds-cli-continuation-20260909-066`, session
`codex-ds-profile-check-20260908`:
route `04d558a07d48212a0909398069823a51deed2e9555ec9359f906568051f7e6a6`;
context `d4b6aaadcb4c06314561a0a89fb3c3875e3a7f91724f9e22573d4c2c3043cdae`;
initial effect `78ae627308bc40ed83f6917eb18e563fb383105a3f273404073f695185c229ec`;
compatibility effect `ad89d4e9f035c8d0e0719338ba7bb7bb09fdb8efb353d9912e2bd70d3eb49b30`.
The compatibility request first rejected an unsupported metadata key, then used
the installed schema's `owner_gate_ref`. The effect result records a consequential
owner gate with no unknown/rejected effects; execution rests on the user's exact
plan authorization, not on the receipt. No semantic/profile admission is implied.

## Remaining work

R04 validation is complete; live ledgers select R05 next.
R05 must compile and execute public Mapping and configured Interface artifacts,
preserving qualified imports, normalization and exact values. R06–R18, public CLI
integration, Python/Rust parity, native39 and installed-package verification remain.
No product decision is currently required. No AlchLang reconciliation, release,
publication, default cutover or production provider effect was performed.

ARE continuation selected R05 under the same explicit owner authorization:
`3eb29cdf333aaf813ae1ead4c7e1e7af53c26e2c131732de013ad9748ddef9ef`.
