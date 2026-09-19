# Explicit factory and Rule composition

Date: 2026-09-09. PCR-06 construction continuation under the working-CLI goal.
Authority effect: none. Candidate planner integration; no public CLI switch,
profile admission, default cutover, publication or release.

## Implemented contract

Factory selection `domainspec.configured-factories-selection/v10-candidate`
inherits the owned-field/path support from v9 and explicitly selects the tested
[Rule v5 numeric and collection contract](NUMERIC-RULES.md). It requires:

```json
{
  "rule_selection": {
    "schema_version": "domainspec.configured-rules-selection/v5-candidate",
    "value_profile": "json-safe-uint64/v1-candidate"
  }
}
```

This is a fragment of the existing factory selection, not a new domain
declaration or standalone public command. The planner also requires the exact
[factory composition contract](factory-rule-composition-contract.json) plus all
four inherited Rule contract source texts. Missing selections, unknown fields,
other versions, full-width profiles and changed source bytes reject.

Explicit validator arguments may end at String, Bool, UInt64 or one list/set
layer over those scalars. Their checked type must match the declared Rule
parameter exactly. Paths may traverse required owned Entity and Value Object
snapshots; the final value is passed to the imported Rule. For example:

```json
{
  "rule": "commerce:owner-budget",
  "arguments": [
    {"parameter": "allowed", "path": ["owner", "allowed"]},
    {"parameter": "amount", "path": ["owner", "amount"]},
    {"parameter": "amounts", "path": ["owner", "amounts"]},
    {"parameter": "cap", "path": ["owner", "cap"]}
  ]
}
```

The existing emitter produces direct calls such as
`validator6({["amount"]: fields["owner"].fields["amount"], ...})`.
No interpreter, inferred Rule, Calculation, Mapping, field lookup service or new
semantic relationship is added. A reference field does not become its target
Entity. Optional paths, collection indexing, sum traversal, named Rule
arguments and nested collection endpoints remain outside this version.

The normal construction pipeline still normalizes all fields and verifies exact
component ownership before evaluating Rules. Base validators and selected local
extensions run on create/reconstruct/Entity-transition. Extensions remain
additive; a child does not inherit its parent's selected extensions or vice
versa. Value Objects still require exact authored base-invariant coverage.

The Rule plan is generated from the same checked graph and its exact artifact
bytes are reused in the factory plan. Each binding retains its path, Rule closure
digest and Rule artifact digest. The factory plan binds the selected Rule plan
digest. Numeric values retain the JSON-safe range, zero normalization, exact
type equality, list occurrence and set uniqueness semantics already tested in
v5. Full-width UInt64 is not claimed.

## Verification

Final focused native tests: **7/7 PASS**, no skips, in **15.01 seconds**. CLI
typecheck PASS. Full eight-file selected regression: **151/151 PASS**, no skips,
in **277.95 seconds**. Source identities, report links and scoped whitespace
checks PASS.

The focused fixture composes an Entity, a Value Object containing that Entity,
and nine declared Rules across two features. It exercises all three scalar
types and list/set forms, numeric ordering, membership, conversion, quantifiers,
declared Rule dependencies, exact arguments, String ordering and Bool extension
conditions. Expected factory imports, validator calls, component protocols and
Rule declarations are authored independently of the generated plan.

Coverage includes:

- deterministic plans, relocation, source removal without rereading, exact
  nested Rule-plan artifact reuse and binding hashes;
- prior-version output preservation and rejection of v10-only options;
- missing/forged Rule selection, every source digest, wrong list/set/scalar
  types, optional/nested endpoints, invalid paths and missing invariants;
- independent native factory and Rule structural observations, followed by
  execution of the compiled JavaScript;
- base and extension validation on every Entity construction route, with no
  failed snapshot returned; Value Object create/reconstruct validation;
- safe maximum, overflow, wrong scalar types, malformed lists, duplicate sets,
  accessors without reads, positive-zero normalization and frozen copied inputs;
- Entity identity versus numeric state, Value Object equality, extension
  independence and child ownership before path reads;
- four native-compiling mutations: substitute a same-typed argument, substitute
  the parent amount for a child's amount, bypass validation, and reverse the
  dependency Rule comparison. Exact-AST expectations detect both path mutations;
  independent behavior detects all four. The reversed Rule remains structurally
  legal, showing why structural PASS alone is not a semantic verdict.

The initial fixture incorrectly declared set cardinality as `many`; the checked
parser correctly rejected it. The fixture now uses `many-unique`. A later native
observation rejected two incorrect test expectations: the owned-Entity protocol
name and the existing generated type-import alias. Both were corrected against
the unchanged emitter contract; no compiler guard or observer was weakened.

Run the same eight-file regression documented in
[NUMERIC-RULES.md](NUMERIC-RULES.md#reproduction-and-source-identity). For the
focused run, select only `configured-factories.test.ts` with
`--test-name-pattern='PCR-06 factory Rule composition'`. Native tests use the
existing pinned TypeScript 7.0.2 image, strict declarations and network-disabled
containers. No compiler, dependency or system package was installed.

## Source identity and preservation

| Changed source | SHA-256 |
| --- | --- |
| configured-factories.ts | d121c895ee486bc18f2577da1eeec7e9dd1e5facdb673ae787db669e875e8a11 |
| configured-factories.test.ts | dc1385e2b386f5fe27c88164277929457b359e47df3e776187336a24fe429360 |
| factory-rule-composition-contract.json | 76c66c6558998c5ec7a251f7aed86a130a41ed0995c5c60e25438a8d35f5e2c4 |

Factory emitter remains
`b960b7340b6042b35a8c2c7e6ef1f630f9db3072fb852856bebac6c1f4ebe181`;
factory observer remains
`426e362cd7236c4bba3192e039e12601bf5aa33e605cb3a86079f2779e514848`;
Rule planner remains
`032d0186408b1e6e9ef7b345e97f32db1cc7f458c0ea8a76710326bf60c6b477`;
Rule collection observer remains
`1419128464757a430d8382406a670ace334cbb225a55680f5e085df823d9b61b`;
unrelated dirty project-build.ts remains
`3e6e576c5c584185a8acc980a0294a23e4ce5213211e80d9d1add65147bd1250`.
The private factory support stays
`f93c0ab11dae3236777ac2f05b12db8b4f64579842d3f9cf7b14aad448ba735f`.
Previous contracts, profiles, parsers, emitters, helpers and defaults were not
edited. Earlier reports keep their historical tested digests.

## Context pack and task-session result

Product frontier: PCR-06. Operational support remains the existing ledger's
separate lane, with no new operational prerequisite. Previous goal turn was
concrete progress: Rule v5 and its 144-test regression established the exact
dependency consumed here. This turn does not shrink the all-39-cell goal.

Context mode: standard. Selected obligations and sources: PCR PLAN.md outcome
and sequence; CLI-COMPLETION.md frontier; NUMERIC-RULES.md and its v5 contract for
numeric boundaries; v9 factory contract and report for path/extension meaning;
configured-factories.ts binding checks and plan provenance; unchanged factory
emitter for direct calls and ownership pipeline; checked property cardinality;
factory tests and native observers for independent verification. No unrelated
discovery, delegation, runtime handoff or experiment harness was used.

Decision: explicitly select the already tested Rule version inside v10 instead
of silently changing v1–v9. This is an implementation compatibility choice,
not new numeric meaning or owner-level language policy. ARE route/context and
the exact effect assessment preserve existing user authorization and grant no
operational authority.

Exact six-file envelope: factory planner, its test file, new composition
contract, this report, STATUS.md and CLI-COMPLETION.md. Final regression and
ledger synchronization are complete. Task-session result: **PASS for explicit
factory/Rule composition**. No adapter or experiment harness applies. The full
working-CLI goal stays active; no owner-level decision is currently required.

## Open questions

No new owner-level decision blocks this composition. Full-width UInt64 Rules,
named/optional/nested Rule inputs, remaining metatype generation, shared CLI
entry points, native-language parity and the clean installed package remain
in [CLI-COMPLETION.md](CLI-COMPLETION.md). Factory composition is not completion
of PCR-06 or permission to publish a release.
