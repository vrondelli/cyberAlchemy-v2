# Checked Operation action bindings

Date: 2026-09-09. PCR-06 product construction; prerequisite for configured
Operation generation. Authority effect: none.

## Product frontier

`compileOperationActionBindings` checks the explicit typed meaning of an existing
Operation's reads, writes, effects, Rule guards and success value. It returns a
registered immutable compiler input tied to the checked graph, composition
boundary, exact field model and definition bytes. It does not generate an
Operation or perform reads, writes, transactions, Rule evaluation or publication.

The current untyped Operation body names opaque action slots. It does not say
which typed argument supplies a write or which identity locates a read. Typed
Operation v1 has a separate closure and result-constructor contract, which cannot
simply absorb the current Event FieldSpec grammar. These explicit compiler
bindings bridge that missing information without silently changing either
source contract. Legacy typed Operation v1 is explicitly rejected by this new
compiler path and remains available through its existing implementation.

This is a checked-input prerequisite, not completion of Operation generation,
DSR-011, PCR-06 or the working-CLI goal. The full PCR-06..14 outcome remains in
[CLI-COMPLETION.md](CLI-COMPLETION.md).

## Meaning and composition

The versioned input declares initial typed parameters and separate live-read
result and Event-constructor parameter slots. It preserves their order and
requires unique parameter names across those roles.

| Binding | Checked meaning | Not implied |
| --- | --- | --- |
| Read | Authored slot, Entity target, exact identity-key type, named live result | Query execution or an initial snapshot masquerading as a live read |
| Guard | Existing enforcing typed Rule and exact named argument types | Inline predicate or evaluation during compilation |
| Write | Authored slot, create/replace/delete mode and typed Entity value | A fabricated Entity-write graph edge |
| Event | Authored effect slot, existing produced Event, distinct constructor input | Publication, persistence or Entity construction |
| Result | Explicit core typed value expression | Commit success or automatic failure recovery |

Read keys can refer only to initial parameters. Rule arguments, writes and the
result can additionally refer to declared live-read results. The source failure
continuation is preserved unchanged. A supplied replacement Entity is not
silently computed from a read; any computation remains explicit in the larger
composition. Event inputs occupy a separate role because their FieldSpec grammar
is not an arbitrary core typed record and cannot be traversed as one.

Named Entity and Value Object identities, exact UInt64, optional, list, set and
sum types use the checked field algebra. Types cannot collapse into one another.
No implicit optional or sum-payload traversal is added. `to_set` is an explicit
list-to-set value conversion, not a domain relationship. Full-width UInt64
literal text is preserved without unsafe-number coercion.

Slot coverage is exact against the authored `reads`, `writes` and `effects`.
Empty authored write/effect sets remain empty: Event-only and guarded-read
Operations do not acquire fabricated writes. The compiler does not achieve this
by dropping effects from an Operation that declares them.
Canonical target/source sets are checked separately:

- `reads`: Operation to Entity, matching all read targets.
- `creates`: Operation to Entity, matching create targets under the existing
  canonical cardinality constraints.
- `produces`: Operation to Event, matching all Event targets.
- `enforces`: Rule to Operation, matching every guard, including the named
  primary guard.

`mutates` is a UI Binding to Operation relationship, not an Entity-write edge.
Replace and delete bindings do not invent that relationship. Two authored effect
slots may construct separate occurrences of the same Event concept through one
`produces` edge. The occurrences are not deduplicated into concept identity.

## Execution boundary for the next generator

The checked contract requires `state-and-outbox` atomicity and
`awaited-settlement` continuation. The eventual generated action must validate
inputs, perform transaction-bound reads, check returned identities, evaluate the
declared Rules, validate owned write values and their invariants, prepare the
complete write/Event batch, commit atomically and return an explicit outcome.

Guard rejection and precommit failure must not mutate state or outbox. An
uncertain commit is indeterminate: it is not evidence of rollback or a safe
automatic retry. Event publication and distributed exactly-once delivery are
outside this action. Event clocks must remain explicit dependencies.

The current result lists those execution obligations; it does not discharge
them. The generator must compose the tested factory/Rule/Event providers and a
separately tested transaction provider. A descriptor, callback acknowledgement or
passing static check alone cannot establish atomicity or durability. Selecting a
production store, deployment, runtime adoption or publication is not part of this
unit and is not a prerequisite for local compiler construction.

## Validation and compatibility

Focused action and canonical relationship suites: **21/21 PASS**, zero failures
or skips, **1.48 seconds** (10 action tests and 11 relationship tests). Source
typecheck passes, including frozen catalog, relationship and integration-profile
checks. Final 29-file shared regression passes **343/343**, zero failures/skips,
in **375.25 seconds**, with two workers. The new action suite ran against the
final source, including trailing-newline and empty-write controls. The exact
temporary workspace dependency link was removed after the run; its retained
dependency mirror and the pre-existing CLI dependency link were not changed.
Final source typecheck and frozen checks pass after that cleanup.

Positive and negative cases check deterministic hashes, original source
relocation, registered-object brands, cross-graph rejection, exact definition
bytes, closed schemas, slot and relationship coverage, primary guard coverage,
read-key availability/types, Rule argument names/types, write/result types,
composite identity, explicit collection conversion and legacy separation.
Hostile inert-data cases reject getters without invoking them, coercion hooks,
symbol/hidden fields, trailing-newline identifiers, sparse or enormous arrays, cycles and bounded-depth/size
overflow. Arbitrary Proxy or modified-realm isolation is not claimed.

Non-collapse cases distinguish Entity types, optional/list/set/sum carriers,
Event versus Entity roles, read-key identity versus other scalar values and
write versus UI `mutates`. Causal controls change the read input, guard literal,
guard order and Event source version independently and observe changed evidence.
These are compiler-input semantic checks, not generated native behavioral or
atomicity tests; those remain required for the next implementation.

No parser, frozen relationship, selected profile, existing default generator or
prior test assertion changed. The package test-list change adds only the new
action suite. No dependency data is removed by the temporary regression setup.

## Task-session context and scope

Route: `CA2-ROUTE-IMPLEMENT`, request `ds-cli-continuation-20260909-042`.
Task-session and context-builder were used locally; no delegated execution or
runtime handoff. Strict context coverage was resolved before mutation. The
experiment harness is not applicable to this compiler work.

Controlling selectors were the PCR Operation profile and DSR-011 dependency;
BODY_CONTRACTS.Operation/Event; typed Operation v1 decoding/closure; current
`reads`, `creates`, `produces`, `enforces` and `mutates` signatures; exact Entity
identity/field compilation; shared typed value binding; Rule v8 and factory v12
composition; Event source/construction; existing bound atomic-action providers;
and the current CLI completion frontier. Historical providers supplied design
evidence, not proof that this compiler executes atomically.

The non-blocking implementation choice was explicit checked compiler inputs
before an emitter, instead of reinterpreting typed v1. It preserves compatibility
at the cost of a separate opt-in binding artifact. No owner decision or
operational effect was required. Construction continues independently of later
installation, admission, publication and runtime-adoption work.

Exact eight-file scope: the new action compiler and test, the package test list,
the action definition and ontology scaffold, this report, CLI-COMPLETION and
STATUS. Definitions and the agent-facing candidate ontology preceded code.

Direct context digest:
`156fb55a40b857d03f86affd21e78da144f99630a4a8d6b5c888fc92f8ef65d2`.
Route receipt:
`d28f3214da570e445e0bcee069f9846312345e8dcb4e9cfb4eb06a670cd35a98`.
Exact effect assessment was structurally admissible, with no additional owner
gate; decision:
`e7cd0e2180ff5e37eca6c9b0419f0f4c74f319f587b4a1e2961e16b1adf9bef0`.
Existing user construction authorization applies; authority effect remains none.

ARE continuation decision
`d32b9161b7ce5264ea3b712afdd309bd5241d3f5e08da88c4481c5e3a24a120d`
selects configured Operation generation using these checked bindings. The option
is structurally admissible with no additional owner gate; its next exact write
envelope still has to be declared. This prerequisite is complete, not the full
CLI goal. All eight scoped files pass the trailing-whitespace check.

Next runnable construction: consume these checked bindings in configured
Operation generation and test live reads, guards, validated writes, atomic
state/outbox handling and explicit rejected/failed/indeterminate outcomes.

## Exact implementation identities

All 24 recorded predecessor Policy/Event identities outside the package manifest
remain byte-identical. The package delta is exactly one new test-list entry.

| Source | SHA-256 |
| --- | --- |
| `impl/cli/src/typed-operation/action-bindings.ts` | `e2b48a69a94b22c4638348b8c4b1039d3bd2b52893abb4b9795e8ee514236bf2` |
| `impl/cli/test/typed-operation/action-bindings.test.ts` | `639503e162957d64115832dc5932f331b24bd4c3a1ef6e84b813e9d3ade87006` |
| `impl/cli/package.json` | `e537dd459705d010f532560aec05bde7d833686114da5d494c4d91e58b38990e` |
| `operation-action-contract.json` | `a28978131d9bd677293bc2a13cbdb2f09182cbe30201abd64b27670969c440b8` |
| `../ontology/operation-action-candidate.json` | `f8df8fd17f84ad1c5644cce1f08d33d28c69ce2a4ea4d3b8362833db168525b1` |
