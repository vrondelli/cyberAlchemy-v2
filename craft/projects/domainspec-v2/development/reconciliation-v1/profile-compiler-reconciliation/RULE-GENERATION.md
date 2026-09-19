# PCR-06: configured TypeScript Rule generation

Date: 2026-09-08. Internal candidate implementation and evidence report.
Authorization: user `next`; bounded native implementation under the existing
D65 construction boundary. Authority effect: none.

## Outcome and scope

The [new planner](../../../impl/cli/src/generation/configured-rules.ts) generates
direct, typed TypeScript Boolean arrow functions from checked Rule closures.
Each Rule is a leaf module under
`{module_root}/features/{feature-id}/src/domain/rules/{node-id}.ts`.
Declared Rule references become direct relative leaf imports and calls, including
cross-feature references. No classes, generic AST interpreter, fabricated graph
edges or legacy-renderer rewriting are used.

This is **one completed candidate slice of PCR-06, not all-13 completion**.
Rule is the only PCR-05 metatype with no recorded dependency blocker. Its supported
subset here is String/Bool scalar parameters, direct parameter paths and literals,
`all`, `any`, `not`, `eq`, and declared `rule_ref` calls. Numeric, named/record,
collection and sum inputs and other operators reject before a plan is returned.
Existing compiler support for those constructs is not removed or reinterpreted.

The internal entry point is `planConfiguredRules(checkedGraph, selection, sources)`:

```json
{
  "schema_version": "domainspec.configured-rules-selection/v1-candidate",
  "language": "typescript",
  "module_root": "commerce",
  "roots": ["commerce:can-submit"]
}
```

It returns immutable artifacts and a digest-bound plan, not filesystem effects.
Normal CLI/application generation remains unchanged; public integration belongs
to PCR-07. Python, Rust, release packaging and AlchLang are outside this slice.

## Source and semantic boundaries

- The existing nominal checked-graph boundary rejects reconstructed or changed
  snapshots. Generation uses that snapshot; it does not reread project sources.
- The source bundle contains exactly the PCR-05 configuration, base profile and
  TypeScript profile as raw strings. Exact SHA-256 checks reject stale bytes.
  The Rule role and source-location constraint are read from those bound sources.
  This planner does **not** replay PCR-05's full 12-source/117-reference audit or
  declare the whole resolved configuration compilation-ready.
- Portable identifiers and reserved names follow PCR-05; tests compare generated
  paths against its independent location preview. Root relocation changes paths,
  not module content. Roots and dependency imports are canonically ordered.
- Rule-reference closure validation is reused from DomainSpec. Calls are to
  declared Rule selectors only. Same-name Rules in different features remain
  separate leaf modules with local import aliases.
- Generated functions reject missing/extra keys, wrong scalar types, inherited-only
  inputs and accessor properties without evaluating getters. They read property
  descriptors into locals and evaluate a direct Boolean expression. This is not
  a sandbox for hostile JavaScript proxies or modified global intrinsics.
- Configuration identity, checked-project certificate, closure digests, module
  imports and artifact hashes are bound into the immutable plan digest.

## Validation

The [tests](../../../impl/cli/test/generation/configured-rules.test.ts) independently
specify four expected leaf modules, callable names and direct import bindings.
Emitted TypeScript is compiled by the existing locked native TypeScript 7.0.2
toolchain. JavaScript runs against independently stated truth tables. An
[independent native AST observer](../../../impl/cli/tools/observe-configured-rules.mjs)
checks artifact paths, exports, Boolean arrow form, leaf imports, bounded call
allowlists and return structure. It is deliberately not a full semantic oracle.

Negative controls cover wrong imports, extra exports, ambient calls, non-Boolean
return annotation, imperative declarations, source drift, forged configuration,
unchecked graphs, unsupported inputs and reserved names. Constant-true and
dropped-reference mutants still compile and pass the bounded structural observer
but fail independent expected behavior. This keeps semantic evidence separate
from compilation and structural evidence.

The combined regression command, from the DomainSpec root, is:

```sh
TMPDIR=/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/test-tmp \
/home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run \
  node --import /home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/projects/domainspec-v2/impl/node_modules/tsx/dist/loader.mjs \
  --test --test-concurrency=1 \
  development/reconciliation-v1/profile-compiler-reconciliation/configuration.test.mjs \
  impl/cli/test/generation/configured-rules.test.ts \
  impl/cli/test/generation/profiled-project.test.ts \
  impl/cli/test/input/project-model.test.ts
```

Native targets use the selected Docker toolchain without network access. Source
tests use the existing locked loader and disk-backed temporary root. Final test
counts and source typecheck outcome are recorded in [STATUS.md](STATUS.md).
The new suite is added to normal CLI test discovery; the entire `test:parallel`
suite is not claimed as rerun here.

## Exact implementation identity and preservation

| Artifact | SHA-256 |
| --- | --- |
| `configured-rules.ts` | `5ddc94c9ca285d0932c80f2861e6fc0c270b418886325d56529352cf93d14d65` |
| `observe-configured-rules.mjs` | `fcfd255ea8c768c5c8256ddea5478bcc5e6a85f7528e45d9421a67709355124c` |
| `configured-rules.test.ts` | `4378dfd436502f239a2c9551ea20db126ae6e8832b35ed686ef182e771778215` |

Only these three new files, CLI test discovery, this report and successor status
are in the write envelope. Existing generator, L0 generator and configuration
retain their entry hashes. Removing only the new test-discovery entry restores
the exact entry package hash
`b15406dc47f03876ea81e959982aa9fdf7302d099b8bed228b22e46317fa23b8`.
Existing dirty package changes are preserved. No profile promotion, dependency
installation, historical digest refresh, default cutover or publication.

## Remaining frontier and open questions

PCR-06 stays in progress. Full Rule protocol coverage remains pending, as do the
other 12 metatypes. Their [PCR-05 dependencies](CONFIGURATION.md) remain unchanged:
DSR-009 for field/compound structure, DSR-011 for composition, and affected
DSR-014..017 for Mapping, Policy, StateMachine and Workflow contracts. Resolve
those contracts before claiming dependent generators complete. The next bounded
unit should address the DSR-009 structural frontier, not skip to all-language
generation or public CLI integration.

Decision ownership remains in [PLAN.md](PLAN.md#9-open-questions-and-proposed-decisions).
This internal report does not add unresolved questions to user-facing product docs.
