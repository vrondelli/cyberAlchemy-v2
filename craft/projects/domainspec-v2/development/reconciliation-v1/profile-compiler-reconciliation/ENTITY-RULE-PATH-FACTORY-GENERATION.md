# Explicit Rule paths through embedded Entities

Date: 2026-09-09. PCR-06 opt-in v9 candidate, authorized by user “next”.
Authority effect: none. No default cutover, admission, publication, release,
AlchLang change or new canonical Rule relationship.

## Implemented scope

The [candidate contract](entity-rule-path-factory-contract.json) selects
`domainspec.configured-factories-selection/v9-candidate`. Explicit factory
argument paths may traverse required owned Entity and Value Object fields,
in any finite combination, and end at a String or Bool field matching the
declared Rule parameter exactly.

This is a checked implementation binding to an already declared Rule. It does
not add a Rule language, infer a Rule from an invariant reference, or turn an
Entity into a record. The unchanged [checked field contract](../contracts/field-and-reference-model.json)
owns field types, cardinality, embedding-cycle rejection and identity meaning.

## Example

Within the existing factory selection, this extension binds a declared Bool
Rule parameter to a nested child field:

~~~json
{
  "id": "visible",
  "validators": [{
    "rule": "commerce:is-visible",
    "arguments": [{
      "parameter": "flag",
      "path": ["z_parent", "z_child", "enabled"]
    }]
  }]
}
~~~

The generated TypeScript calls the imported Rule with:

~~~ts
validator2({["flag"]: fields["z_parent"].fields["z_child"].fields["enabled"]})
~~~

The parent factory first normalizes its fields and verifies exact child-provider
membership. Its selected extension then reads the supplied immutable snapshot.
No target is fetched. A field storing an identity reference does not become a
target Entity, and projection metadata does not compute a value automatically.
An actually stored owned Value Object remains traversable on its own terms.

## Semantic boundaries

- Two child snapshots with the same Entity identity can have different Bool
  state. They compare equal by identity but can produce different Rule outcomes.
- Paths do not read a similarly named parent field or another embedded child.
  Their exact segments remain bound into the plan with checked field and Rule
  closure/artifact digests.
- Base Rules and explicitly selected extensions run on create, reconstruct and
  Entity transition. Extensions remain additive and local; embedding a child
  does not require the child's optional extensions.
- Existing Value Object invariant coverage and Rule parameter/type checks remain
  mandatory. Mixed Value Object → Entity → Value Object paths are supported.
- Child transitions create new snapshots, leaving existing parent state intact.
  A parent transition still preserves its own identity.
- Optional traversal, collection indexing/quantification, sum payload traversal,
  numeric Rule arguments, missing fields and scalar traversal reject. There is
  no automatic skipping, unwrapping or reference lookup.

## Verification

Focused validation: **7/7 PASS**, no skips, in 12.81 seconds: six new tests and
the existing v8 Entity-path rejection test. Full CLI typecheck PASS, including
39 catalog rows, 31 relationship signatures and five integration definitions
across three languages. This does not establish v9 generated-language parity.
Native observer syntax check PASS.

Full selected regression: **117/117 PASS**, no skips, in 202.64 seconds
(six added tests plus the preceding 111). All 19 protected source/configuration
files match their entry hashes. Report source digests, links and scoped
whitespace checks PASS. Task-session result: **PASS for this bounded slice**.

The six new tests cover deterministic selection/relocation, source-contract
drift rejection, immutable plan provenance, prior-version rejection and v8/v9
output comparison with only the explicit contract digest changed for old paths;
snapshot-state/identity separation; extension orthogonality; all Entity
construction routes and hostile ownership inputs; fail-closed unsupported paths;
and mixed owned Entity/Value Object String validation with a failing leaf value.

Two native-compiling mutants replace a child Bool path with a same-typed parent
or sibling path. Independent exact-AST expectations detect both substitutions,
and execution demonstrates that each mutant incorrectly accepts the known-false
child condition. Expectations are hand-authored, not derived from planner output.

The initial focused run exposed shared extension-array aliases in the test
fixture. Cloning each factory selection independently fixed the fixture; no
planner guard or expected semantic failure was weakened.

Native tests emit JavaScript and declarations with the existing locked
TypeScript 7.0.2 environment, using network-disabled containers with read-only
roots. No compiler was installed. The full regression command is the same
eight-suite selection documented in [the sum report](SUM-FIELD-FACTORY-GENERATION.md#verification).

## Exact sources and preservation

| Source | SHA-256 |
| --- | --- |
| configured-factories.ts | 18d5b74ac6d18d12995d2f79f0101c02fcce6f346fd4265ed973d6d6fe376555 |
| configured-factories.test.ts | fa9d0d0f42082b3f5cbf38aed172e744b333d9fc8baa9485c5ab51c8e524924a |
| entity-rule-path-factory-contract.json | 504bc456b793e87091c5133b4dda408f7233f266eb33994d19d04f298500644d |

The existing factory, Entity, sum, collection, Enum, numeric and reference
emitters/helpers and native observer are unchanged. Combined private support
remains f93c0ab11dae3236777ac2f05b12db8b4f64579842d3f9cf7b14aad448ba735f.
Versions 1–8 keep their contracts and output. Checked field/reference models,
Rule/Enum/L0 planners, configuration, profiles, package manifest, historical
reports and unrelated dirty project-build.ts retain their entry bytes.

The five-file write envelope comprises the planner, its test file, the new
contract, this report and STATUS.md. No staging, branch operation or external
publication occurred.

## Task-session result and context pack

Task: PCR-06 explicit Entity Rule-path continuation. Native local execution;
no delegation, runtime handoff or experiment harness is applicable.

Context-builder selected the current STATUS next-step row and v8 report/contract
for scope and compatibility; the planner's binding checks and checked-field
dependency for admissibility; the existing factory validator emitter and Rule
parameter gate for exact code behavior; and native fixtures/observer selectors
for independent verification. Every obligation of this bounded slice has a
validation surface; no broader Rule-expression or language-parity claim is made.
This is session evidence, not a new canonical definition.

Decision: use an explicit v9 planner gate with unchanged code emitters and helper
protocols. Changing v8 in place would alter an existing contract; introducing
another runtime traversal helper is unnecessary because generated field access
already supports these paths. No blocker-level owner choice remains in scope.

Gate: current user authorization and ARE route/context/effect assessment delimit
the D65 candidate-construction boundary. The effect assessment identifies the
existing authorization boundary and does not itself grant authority. Tests
support bounded candidate completion only. STATUS.md is synchronized at the
completion boundary; default integration, admission and publication remain
separately owned operational work, not prerequisites for these local tests.

## Open Questions

No unresolved semantic decision remains within this bounded explicit-path slice.
Broader Rule expressions, numeric/collection/sum Rule arguments, codecs,
full-width UInt64, other metatype generators, language parity, public integration
and packaging remain separate. PCR-06 is still in progress. Next: review the
remaining PCR-06 Rule-expression coverage against the checked Rule contract
before selecting its next implementation slice. Admission/release decisions stay
with [the PCR plan](PLAN.md#9-open-questions-and-proposed-decisions).
