# Embedded Entity factory generation

Date: 2026-09-09. PCR-06 opt-in v8 candidate, authorized by user “next”.
Authority effect: none. No default cutover, profile admission, publication,
release or AlchLang change.

## Implemented scope

The [candidate contract](embedded-entity-factory-contract.json) selects
domainspec.configured-factories-selection/v8-candidate. It consumes the unchanged
[checked field/reference contract](../contracts/field-and-reference-model.json).
Named Entity types now compose into Entity and Value Object fields, existing
optional/list/set wrappers, and named or inline sum payloads.

An embedded Entity is a complete immutable snapshot from its exact generated
provider. It is not a raw record, an identity-only reference, a database row or
a live pointer that updates when another snapshot is created.

Its equality follows the checked contract: declared Entity type and identity.
All child fields are validated during child construction, but nonidentity state
does not enter embedded equality. Value Objects retain their existing complete
typed-value tuple, whose Entity-valued components compare by identity.

## Generated product

Every v8 Entity module additionally exports a frozen NameValueComponent with
protocol_id typescript.owned-entity-component/v1-candidate, concept, contract
digest, isOwned, key and equals. It reads the Entity factory's private snapshot
membership and identity key. It provides no additional construction route.

Generated consumers import both that provider and its nominal Snapshot type.
Their private ownedEntityValue combinator validates membership and adds an
Entity-specific key tag. Existing Value Object, collection, Enum, sum, numeric
and reference helpers retain their meanings and prior bytes.

Example against the native test fixture:

~~~ts
import {createCustomerFactory, CustomerValueComponent}
  from "./application/features/commerce/src/domain/entities/customer.js";
import {createAccountFactory}
  from "./application/features/audit/src/domain/entities/account.js";

const customerFactory = createCustomerFactory();
const first = customerFactory.create({
  id: 1, label: "First", enabled: true, b_self: [],
});
const second = customerFactory.create({
  id: 1, label: "Second", enabled: true, b_self: [],
});

if (first.ok && second.ok) {
  CustomerValueComponent.equals(first.value, second.value); // true: same identity
  const account = createAccountFactory().create({
    id: 5, label: "Account", enabled: true, z_child: first.value,
  });
  // account retains the first snapshot, including its "First" label.
}
~~~

Creation from a raw child object or just an identity rejects. Reconstruct still
expects owned snapshots; it is not a JSON deserializer. Wrong-concept, spread,
proxy and duplicate-module snapshots do not pass exact provider ownership.

## Composition and validation

- Lists retain order and duplicate snapshots. Two list positions containing
  equal-identity children compare equal even when their child state differs.
- Sets reject duplicate Entity identities, including separately created snapshots
  with different nonidentity state. They do not choose a winning snapshot.
- Optionals retain existing absent/null semantics. Explicit undefined rejects.
- Sum payloads preserve the variant tag and Entity identity. An Entity payload
  and an identity-reference payload remain different alternatives.
- A parent Entity's identity is independent of its nonidentity child fields.
  Parent transitions may replace a child without changing the parent's identity.
- Parents and children are immutable snapshots. A child transition creates a new
  snapshot and does not mutate a previously formed parent or caller collection.

Children must already have passed their factory's field validation and declared
Rules. The parent checks exact child ownership and then runs its own bound Rules.
It does not rerun child Rules, require undeclared child extensions, inherit an
extension, or grant a child access to parent state. An optional extension remains
optional unless a later explicit selection defines a stronger requirement.

The existing checked model still rejects cyclic embedding, including cycles
through optional/collection fields. Entity-valued identity fields remain invalid;
identity stays String, JSON-safe UInt64 or a permitted finite Value Object.
Reference-only cycles retain v7's type-only behavior. Deep field projections
through embedded snapshots retain the indexed fields type and exact metadata.

Rule bindings still traverse only existing owned Value Object paths and end at
String/Bool fields. Traversing an embedded Entity for a Rule is deliberately not
enabled here. Persistence, cascading changes, referential integrity and automatic
reference resolution remain separate concerns, not inferred relationships.

## Verification

Focused suite: **8/8 PASS**, no skips, in 19.93 seconds.
Final selected regression: **111/111 PASS**, no skips, in 191.57 seconds
(eight added tests plus the preceding 103).
Full CLI source typecheck and native observer syntax check PASS. Typecheck covers
39 frozen catalog rows, 31 relationship signatures and five integration
definitions across three configured languages. This does not establish generated
Entity parity in all three languages.

Eight new tests cover:

- Exact entry-byte v7 goldens, previous-version rejection, source digest binding,
  checked snapshot identity, complete factory/dependency coverage, deterministic
  relocation and selection ordering.
- Independent checked-model equality and native execution for required/nested
  Entity fields, optional/list/set/nested collections, inline/named sum payloads,
  nested field projections and the distinction from identity references.
- Private provider ownership against raw, forged, wrong-concept, proxy and
  duplicate-module values without invoking a hostile fields getter.
- Child and parent validation, all Entity construction routes, local additive
  extensions, parent identity preservation and isolation of caller collections.
- Checked cyclic-embedding and Entity-identity rejection plus continued rejection
  of implicit Entity Rule traversal.
- Nominal snapshot types, deep indexed types and recursive readonly checks.
- Two native-compiling mutants: collapsed child identity keys and accidental
  inclusion of child state in equality. Both fail exact provider observation and
  independently disagree with checked parent-value equality.
- Composite String/UInt64 Value Object identities inside embedded Entities,
  retaining state without turning Entity equality into record equality.

Native tests emit JavaScript and declarations using the existing locked
TypeScript 7.0.2 environment. The network-disabled, read-only-root container and
registered test entry are unchanged; no compiler was installed.
Run the same eight-suite regression command recorded in
[the sum report](SUM-FIELD-FACTORY-GENERATION.md#verification). Source typecheck
uses the umbrella node-env launcher with projects/domainspec-v2/impl/cli and
npm run typecheck.

## Exact sources and preservation

| Changed implementation/test source | SHA-256 |
| --- | --- |
| configured-factories.ts | 4fbd1c30387581f095263875302268e6cecf8ce9d1840a2e3ff88bf01f82aca3 |
| configured-factory-source.ts | b960b7340b6042b35a8c2c7e6ef1f630f9db3072fb852856bebac6c1f4ebe181 |
| configured-sum-source.ts | cf910feb9f160a60ca26da65b3570d50eceff865da52b8f33fade0bc01d55650 |
| configured-entity-source.ts | 3e8c110b96277b5f857ebe3577866f83bc8991225661ec4803a40e9a72a9f821 |
| configured-factories.test.ts | 77cd2814bb6748b024c1ac2d5f101fce969945ab980344b07ec64c0444758f13 |
| observe-configured-factories.mjs | 426e362cd7236c4bba3192e039e12601bf5aa33e605cb3a86079f2779e514848 |

Contract SHA-256:
3725392ffac4dc7644779cfb3580905c86428394b7cf27f13f489fd8193649d7.
Combined private support SHA-256:
f93c0ab11dae3236777ac2f05b12db8b4f64579842d3f9cf7b14aad448ba735f.

Versions 1–7 retain their selections, contracts and output. Checked field models,
collection/Enum/numeric/reference helpers, Enum provider, Rule/Enum/L0 planners,
profiles, configuration and package manifest retain their entry hashes. The sum
emitter gains Entity shapes but its pre-existing sum support body is unchanged.
Historical reports and earlier contract descriptors are not rewritten.

The nine-file write envelope contains the six implementation/test files above,
the v8 contract, this report and STATUS.md. Existing untracked work and unrelated
dirty project-build.ts are preserved. No publication or branch operation occurred.

## Task-session result and context pack

Native local execution, no delegation or runtime handoff. Task-session and
context-builder selected the current PCR-06 status and unchanged field contract,
checked identity/embedding semantics, factory/sum/component emission and native
test/observer selectors. The explicit candidate output is Entity component
realization, not a new definition of Entity or an ownership policy.

Decisions: require previously validated snapshots, use identity equality, retain
separate Entity and Value Object protocols, and preserve local extension scope.
The selected sources cover this slice's obligations; broader Rule/profile parity
is not claimed. No blocker-level decision remains within the selected scope.

Gate: current user authorization and ARE route/context/effect checks delimit the
D65 construction envelope. Tests support candidate completion only, not admission
or activation. STATUS.md is synchronized at completion. Handoff and experiment
harness are not applicable. Publication/default integration remain owner-scoped
operational residue and are not prerequisites for this local construction.

## Open Questions

No unresolved semantic decision remains within this bounded embedding candidate.
The next bounded composition step is explicit String/Bool Rule bindings through
embedded Entity fields. Collection/sum/numeric Rule expressions, codecs, full-width
UInt64, other metatype generators, language parity, default integration and
packaging remain separate. Admission and release decisions stay with
[the PCR plan](PLAN.md#9-open-questions-and-proposed-decisions).
