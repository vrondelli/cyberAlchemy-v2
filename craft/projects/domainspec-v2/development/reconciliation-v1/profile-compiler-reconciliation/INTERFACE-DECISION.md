# Interface version compatibility decision

Date: 2026-09-09. PCR-06 Interface source reconciliation.
Status: option A selected by the user's `yes! continue the goal` on 2026-09-09.
Product-construction lane. Authority effect: none.

## Decision

Should a provider at `1.2.0` accept a consumer requiring `1.3.0` merely because
both versions have major `1`?

This changes the exposed contract and future compatibility results, not just
syntax highlighting, source layout or an internal implementation detail. The
standing instruction is to continue until the CLI works and stop for an
important decision. No Interface compiler or historical contract changed before
the user selected this policy. Historical contracts remain unchanged afterward.

## Current source evidence

The authorized reconciliation work explicitly requires reuse of all 13 metatype
meanings and their implementation references; a proof provider is not itself a
generator. Current Interface sources disagree:

- `impl/cli/src/input/project-model.ts` accepts positive integer version strings
  and `exact` or `backward` compatibility. Its operation signatures carry
  qualified Operation/Query references and separate request/result fields.
- `impl/cli/src/generation/generators.ts` emits an exact equality check or a
  numeric requested-version <= provider-version check. Three-part versions
  cannot enter this path through the current source decoder.
- `impl/architecture-conformance/families/versioned-interface-boundary/contracts/interface-contracts.ts`
  names `same-major-backward-compatible/v1` and `consumer-to-provider`.
- That family's `settlement-interface.ts` fixture explicitly accepts consumer
  `1.3.0` against provider `1.2.0`. Its evaluator checks the major number for
  accepted observations, not minor/patch ordering. The native target passes
  that fixture. The policy name is therefore not evidence of minimum-version
  enforcement.
- The TypeScript representation profile selects a structural boundary, not a
  class, transport server or universal infrastructure abstraction. The richer
  family separately preserves public contracts, Mapping obligations, inside/
  outside boundaries and transport/domain separation. Those distinctions must
  survive generation regardless of the version policy selected here.

Read-only execution against current code confirmed:

| Consumer | Provider | Existing factory accepts an observation claiming compatibility? | Recommended minimum-version policy |
| --- | --- | --- | --- |
| `1.0.0` | `1.2.0` | Yes | Yes |
| `1.2.0` | `1.2.0` | Yes | Yes |
| `1.3.0` | `1.2.0` | Yes | No |
| `2.0.0` | `1.2.0` | No | No |

The complete existing TypeScript Interface target returned `pass`. Calling the
current CLI decoder with version `1.2.0` returned `MTCLI_INTERFACE_VERSION`.
These are direct counterexamples, not a full Interface regression or proof of
cross-language parity. No source or fixture was mutated for the probe.

## Options

### A. Explicit directional minimum-version policy — recommended

Construct a new versioned Interface contract with explicit three-part numeric
versions. For backward compatibility, accept only when major versions match
and the provider's version is at least the consumer's required version. Keep an
explicit exact-version mode. The examples above define the distinguishing
behavior; prerelease/range syntax is not implicitly introduced.

Benefit: a consumer requiring newer functionality is not accepted solely by
major-number equality. Direction is observable and can be tested independently.
Cost/risk: this is a successor policy, not preservation of the old factory
fixture. It needs a new policy identity, current source/native evidence and
explicit legacy migration. Short-term construction is larger; long-term policy
and diagnostics are clearer. Choose this if the requested version expresses a
consumer's minimum supported contract.

Downstream: parser selection, generated compatibility functions, migration,
native language tests, proof observations and public documentation must bind
the new policy rather than overwrite historical evidence. Legacy integer and
factory same-major behavior remain version-bound and unchanged. No implicit
mapping from legacy `1` to `1.0.0` is assumed. Passing a version check does not
prove request/result shape compatibility or authorize transport execution.

### B. Preserve the factory's same-major behavior explicitly

Generate a policy that accepts any consumer/provider pair with the same major
version, including consumer `1.3.0` against provider `1.2.0`. Expose its precise
meaning as same-major acceptance; do not claim minimum-version enforcement.
Keep the old CLI integer policy as a separately versioned legacy path.

Benefit: preserves the current factory fixture's version decisions. Lower
short-term compatibility change. Cost/risk: minor/patch requirements are not
enforced by this policy; required public members and shapes need separate
evidence. Choose this if all revisions within a major are deliberately treated
as interchangeable. Downstream tests and docs must make that guarantee visible
instead of importing a stronger interpretation of the word backward.

## Selection and boundaries

- Selected option: A, directional minimum-version policy with legacy preservation.
- Decision source: the user's explicit `yes! continue the goal`, answering the
  proposal for same major and provider >= consumer with legacy behavior separate.
- Resolved blocker decisions in this unit: one; remaining version-policy blockers: zero.
- Exact selected construction definition: [interface-version-policy-contract.json](interface-version-policy-contract.json).
  Implementation and verification: [INTERFACE-VERSION-POLICY.md](INTERFACE-VERSION-POLICY.md).
- Workflow's previously recorded DEC-08 occurrence-schema decision remains
  separate and is not bundled into this question.
- No operational-support blocker exists. Admission, publication, default
  cutover and runtime adoption remain deferred owner-controlled effects.
- After selection: author the exact prototype definition and ontology scaffold,
  reconcile typed boundary signatures and explicit mapping/adapter bindings,
  implement the selected generator, then verify native types, behavior,
  compatibility direction, hostile inputs and independent compiling mutations.
  Broader signature questions must be resolved from their current sources, not
  inferred merely from this version-policy decision.

## Historical discovery task-session evidence (request 048)

Previous goal turn: progress — implemented and verified the State Machine unit.
This turn: progress — recovered the Interface source frontier and obtained a
current executable counterexample that changes the next action. Full CLI goal
remains active. This is the first turn encountering this Interface blocker;
the goal is not marked blocked or complete.

Context-builder mode: standard with a bounded expansion into the exact legacy
decoder/generator and factory Interface contract, fixture, evaluator and target.
Controlling obligations: preserve canonical exposure semantics, native
structural representation, exact version behavior, explicit source selection,
public/transport separation and old bytes. No runtime handoff or subagent.
The decision-gate skill pauses new Interface implementation before selecting
the new compatibility meaning. Only this record, CLI-COMPLETION and STATUS
are changed. No product test or package installation is claimed this turn.

ARE request: `ds-cli-continuation-20260909-048`; `CA2-ROUTE-IMPLEMENT`.
Route receipt:
`53e740376396a50ef051995db9095a5d4a3f5ca39033c1af5a13641fcfad3136`.
Context result:
`66af142113da214f154f44ae6923f1714d9fe5b62c6562903b9ca0e50d58e7d0`.
Three-file decision-record effect assessment:
`0fd8e8c1862f113f4b12cc8c1bcaeccf07b1b4079f005f69e6fd41afd8120f48`.
The effect was structurally admissible and consequential with no additional
owner references. Existing user scope permits recording this decision; it does
not select the compatibility policy or grant operational authority.

## Examined source identities

| Source | SHA-256 |
| --- | --- |
| `impl/cli/src/input/project-model.ts` | `bd5a36dd1cb54a3a75441a2bdb2cf00283c6cc741330b3808189b76a72749057` |
| `impl/cli/src/generation/generators.ts` | `0a1ed11c6ffa670dc1088772facbdd07649113203502396f6811b070eff3b714` |
| `impl/architecture-conformance/families/versioned-interface-boundary/contracts/interface-contracts.ts` | `af76221950e10521a5ba0911042db5da1768674f217d19079a49b6c72d2934ac` |
| `impl/architecture-conformance/families/versioned-interface-boundary/fixtures/settlement-interface.ts` | `0a92403545194a7fb3457d435805b04d97d8b068c30d5d016cae873d4f5ef33a` |
| `impl/architecture-conformance/families/versioned-interface-boundary/evaluator/evaluate-interface.ts` | `328ce31b189c542b923d1c617517652fd33e1ee325d2be59605dce1ccb18f92d` |
