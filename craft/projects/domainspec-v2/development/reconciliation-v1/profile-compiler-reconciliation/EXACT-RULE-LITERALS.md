# Exact UInt64 literals in checked Rule source

Date: 2026-09-09. PCR-06 continuation under the working-CLI objective.
Authority effect: none. This is tested candidate construction, not admission,
default cutover, publication or completion of the full CLI plan.

## Source and generated code

`domainspec.typed-rule/v2` declares UInt64 literals as canonical unsigned decimal
strings in JSON. This avoids losing precision before the compiler receives the
source. String and Bool literals retain their existing representation and meaning.

```json
{
  "schema_version": "domainspec.typed-rule/v2",
  "ontology_rule": "COMMERCE-AT-MAXIMUM",
  "parameters": [{"name": "value", "type": {"kind": "scalar", "name": "UInt64"}}],
  "expression": {
    "op": "eq",
    "left": {"op": "path", "root": "value", "properties": []},
    "right": {"op": "literal", "type": "UInt64", "value": "18446744073709551615"}
  }
}
```

Select `domainspec.configured-rules-selection/v7-candidate`, value profile
`domainspec.typescript-exact-uint64/v1`, and the exact
[literal contract](rule-exact-literal-contract.json) plus all inherited Rule
contract sources. The generated comparison is numeric:

```typescript
p0 === 18446744073709551615n
```

The existing exact helper normalizes runtime arguments first. No Number
conversion, string comparison or runtime expression interpreter implements this
literal. Both endpoints, zero and the UInt64 maximum, are accepted. Signs,
leading zeros, whitespace (including terminal Unicode line separators), exponent
or hex notation, overflow, JSON numbers and non-string source values reject.
V2 requires decimal strings even for small UInt64 literals; there is one authored
numeric representation in this version. V1 still requires safe JSON integers.

## Composition and compatibility

The existing typed closure includes v2 Rules in dependency traversal, type/scope
checking, rule bindings and its digest. The envelope remains closure v1: each
contained node already has its own explicit typed-contract schema. The source
version and original decimal bytes survive loading and closure serialization.
The decoder copies/freezes the checked expression. Old decoders reject the
unknown nested schema; they are not handed v2 data mislabeled as v1.

V1 and v2 Rules may call each other with matching typed arguments. V7 realizes
both using bigint numeric locals, including safe-number literals from v1 source.
Membership, occurrence quantifiers, list-to-set conversion and nested lexical
scopes can use full-width constants. Lists retain duplicate occurrences; sets
remain distinct. Text such as `"10"` remains text when its literal type is String.

Configured selections v1–v6 reject selected v2 roots or dependencies. Legacy
native renderers and the in-memory runtime reject selected closures containing
v2 instead of silently omitting a dependency or interpreting its number as text.
The runtime preflights all requested closures before executing a step; unrelated
unselected v2 declarations do not disable supported v1 steps. An Operation's v2
guard remains in its checked closure but cannot run through an old evaluator.

V7 produces byte-identical artifacts/modules to v6 for previously supported v1
inputs. The exact runtime helper, independent observer, factory planner, existing
exact renderer and original configuration JSON retain their previous bytes.
Factory v10 still selects JSON-safe Rule v5. No public CLI selection for the new
configured planner is claimed: shared entry-point integration remains PCR-07.

## Explicit parser-source selection

The first broad regression correctly rejected changed project-loader bytes under
the original PCR-05 source binding. The implementation did not replace its old
hashes. Instead, [configuration-rule-v2-sources.json](configuration-rule-v2-sources.json)
binds the two exact parser/loader successors to their predecessor hashes and
unchanged paths. Its closed source set cannot override a profile, language,
metatype, semantic obligation, baseline or other source axis.

The configuration resolver accepts this selection explicitly as its third
argument. Its result binds the predecessor configuration digest, effective
source identities and complete selection into the resolved-plan digest. The
original configuration remains usable against its original source snapshot;
against this changed checkout, calling the checker without an explicit successor
correctly reports source drift. The current read-only check is:

```sh
node development/reconciliation-v1/profile-compiler-reconciliation/configuration.mjs \
  --source-selection development/reconciliation-v1/profile-compiler-reconciliation/configuration-rule-v2-sources.json
```

The naming-preview tests explicitly select this source revision. The 39-row
configuration check is still configuration evidence, not 39 generated realization
cells. Its Rule input description remains v1; v7's separate contract governs v2
generation. No architecture or production-default selection was changed.

## Verification

- Focused exact-literal tests: **8/8 PASS**, no skips, **13.28 seconds**.
- Configuration tests: **12/12 PASS**, no skips, **0.99 seconds**.
- Existing runtime L2 tests: **6/6 PASS**, no skips, **4.26 seconds**, including
  the fresh-process public `run` command and source/receipt binding.
- Full CLI source typecheck: **PASS**.
- Final expanded twelve-suite regression: **186/186 PASS**, no failures,
  cancellations or skips, in **325.45 seconds** on final source bytes.
- Scoped diff whitespace and configuration script syntax checks: **PASS**.

The final regression command, from the DomainSpec-v2 project root:

```sh
TMPDIR=/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/test-tmp \
/home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run node \
--import /home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/projects/domainspec-v2/impl/node_modules/tsx/dist/loader.mjs \
--test --test-concurrency=1 \
impl/cli/test/generation/configured-factories.test.ts \
impl/cli/test/generation/configured-enums.test.ts \
impl/cli/test/input/compiled-field-model.test.ts \
impl/cli/test/input/field-reference-model.test.ts \
development/reconciliation-v1/profile-compiler-reconciliation/configuration.test.mjs \
impl/cli/test/generation/configured-rules.test.ts \
impl/cli/test/generation/profiled-project.test.ts \
impl/cli/test/input/project-model.test.ts \
impl/cli/test/generation/exact-uint64.test.ts \
impl/cli/test/typed-operation/contracts.test.ts \
impl/cli/test/typed-operation/rust.test.ts \
impl/cli/test/typed-operation/hardening.test.ts
```

Focused run: select `configured-rules.test.ts` only and add
`--test-name-pattern='PCR-06 exact Rule literals'`. From domainspec-core, the
existing pinned toolchain runs typecheck and the public-runtime regressions:

```sh
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl/cli -- npm run typecheck
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl/cli -- node --import tsx --test test/runtime-l2.test.ts
```

Tests cover malformed source forms, zero/safe-boundary/full maximum values,
cross-representation runtime arguments, exact threshold behavior, text/numeric
non-collapse, declared Rule calls in both source-version directions, nested
scope, lists/sets, snapshot-only planning, deterministic relocation and source
digest changes. Invalid operand types, scopes, Rule arguments, unknown versions,
stale bindings and unsupported legacy paths reject.

Three deliberately changed generated constants compile natively: adjacent value,
overflow and Number-rounding substitution. The independent maximum-equality
oracle detects all three. The unchanged observer rejects the Number conversion;
it correctly leaves structurally valid changed constants to behavioral evidence.
Source identity and structure alone are not semantic verification.

The first focused run had one fixture-isolation failure: unrelated same-named
legacy Rust callables failed before the intended whole-build v2 check. The test
now isolates the build graph; individual roots/dependencies and unrelated v1
execution are still checked separately. The initial broad regression also
exposed the parser-source drift described above; it is not reported as PASS.

## Source identity

| Source | SHA-256 |
| --- | --- |
| typed-operation/contracts.ts | 5645254213112782d41ae9a25186759e8ae363650f56de8347ff9590109aac51 |
| typed-operation/closure.ts | 639d3fee0d736e5991ab5795f300ffe6d844564684dc093337c2344e5029d003 |
| input/project-model.ts | a5884b5a569ba9f6f442833415ada19dbbd55b9fba158c38b04a7a47455dd280 |
| generation/configured-rules.ts | e5b6dfa0a0f5ac49a26a228c23b37471aea46fac80989754cafc4e1c65b84352 |
| generation/configured-rule-predicates.ts | 253276deec071f8c305ddd982e4cb65b46a055cd028b0dcc3a3c725ea911373a |
| generation/generators.ts | 6bf4761f9bd1de83176c0480fd96ee022c23831ece3d40896657efe8ea7d2ecd |
| typed-operation/rust.ts | bcd4c1c391aef40e6b3ad751332df9157ab625bcdab903db62c13ad7875f6828 |
| runtime/in-memory.ts | b9e483d2ef92e46ebcfb418ba9d38545437bd244e82f94473c1a8137928960a4 |
| configuration.mjs | 65a69de20fe69dce0cde70f34c74407045f103ff7f372e5dc306e351a0557869 |
| configuration-rule-v2-sources.json | 88d31247c1df5b7230462b05f5d52dec1d948cce2b838ed54001a894db7d1701 |
| rule-exact-literal-contract.json | b89f26b8e82f501b94c625fd027ff088d2c130ccbd0b19c8cf792ea88b4e7381 |
| generation/configured-rules.test.ts | 6face4e4e074322a610191bc059e2ce0e6fdce10b35cc4dc0ccd491a5553d9f1 |
| generation/configured-enums.test.ts | 44aeeadd4fef40ea18c1033fa0367ff249df893b71e2efa5d4966a8d05dc5751 |
| generation/configured-factories.test.ts | 42cc0ae17d70eaa850c105e83d4e620e758b1f5cf42c4365647c6e0a2f5e0345 |
| configuration.test.mjs | 772dacd7e868bd106a1b765e770ee5b0674a618b9fa25004e3605f4724aca591 |

Preserved original configuration JSON:
`77a7ec204fa575c52a1f3c126ce839206c81154e9bbd3541eb2ad992143631eb`;
factory planner `d121c895ee486bc18f2577da1eeec7e9dd1e5facdb673ae787db669e875e8a11`;
exact helper `a1918e8f4e968940185801a6f9a733af32495b2bc55774b0c313fb6d5bc7d92a`;
independent observer `ab463c9cb714f62d88e15bd4eb4c99510d9ab7b43c185c271dac2de7c4573e51`;
old exact renderer `bd110aa4dba95cf5726a7e20d40d26021c8b4d1c91e94ebe66ed9248658221c6`.
Earlier reports retain their historical tested identities.

## Context pack and task-session result

Product frontier: PCR-06. The previous goal turn was progress, with 159 passing
tests for exact runtime Rule inputs. This turn closes authored literal coverage
in the candidate Rule group, not the whole 39-cell product.

Context mode: standard, expanded only for the demonstrated configuration source
binding. Selected sources: the PCR outcome and current completion ledger; typed
Rule decoder/closure; project selection functions; configured Rule planner and
predicate emitter; legacy renderer/Rust/runtime entry boundaries; exact input
contract/helper/observer; configuration source-binding resolver and its exact
test callers. These cover versioning, dependency semantics, no-loss realization,
legacy rejection, preservation and validation. No broad history scan, external
research, delegation or runtime handoff was used.

Decision: reuse the already selected exact numeric representation. Version the
authored Rule contract rather than reinterpret v1. Keep legacy paths explicitly
unsupported until their planned reconciliation. The source-binding successor is
candidate evidence only; ARE route/context/effect assessments use existing user
construction authorization and confer no authority.

The 19-file envelope includes the eight implementation sources above, the three
configured-generator test callers, the literal contract, configuration resolver,
configuration tests, source selection and instructions, this report, STATUS.md and
CLI-COMPLETION.md. Only relevant spans of already dirty files are changed.
No dependency installation, baseline rewrite, commit, publication or AlchLang
change occurred. Experiment harness: not applicable to this product task.
Final regression, source-identity verification and synchronized ledger close this
bounded unit with PASS. The full working-CLI goal remains active.

## Open questions

No owner-level representation decision is required here. Next: carry the
existing exact value profile through checked factory fields and explicit
validator composition. Named/optional/nested Rule realization, remaining
metatypes, shared public CLI planning, Python/Rust parity, composition and clean
installation remain required in [CLI-COMPLETION.md](CLI-COMPLETION.md).
