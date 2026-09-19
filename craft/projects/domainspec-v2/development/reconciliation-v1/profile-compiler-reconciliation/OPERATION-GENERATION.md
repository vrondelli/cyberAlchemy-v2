# Configured executable Operation generation

Date: 2026-09-09. PCR-06 product construction. Authority effect: none.

## Product frontier

`planConfiguredOperations` now compiles registered
[action bindings](OPERATION-ACTION-BINDINGS.md) into native TypeScript async
functions. The generated action reads through an explicit transaction port,
evaluates declared Rules, validates owned domain values, constructs Events,
prepares one immutable state/outbox batch and awaits an explicit commit outcome.
It is no longer only a checked-input descriptor or a no-effect substitute.

This opt-in compiler candidate does not change public CLI entry points, legacy
typed Operation v1, source parsing, frozen profiles or default generators. The
selected factory v12 input contract remains explicit, including required base
validator bindings and exact Value Object invariant coverage. No validator is
invented, and no extension is automatically adopted. The full working-CLI
outcome remains in [CLI-COMPLETION.md](CLI-COMPLETION.md).

## Generated product

Each selected Operation has two files under
`features/<feature>/src/application/operations`:

- `<operation>.provider.ts` exports the async `execute` arrow and typed inputs,
  results, transaction requests, write/Event intents and dependency contracts.
- `<operation>.ts` exports one frozen descriptor-bound `operation<Name>`
  callable and its public types.

The plan includes its generated Rule v8, factory v12, Enum/component and Event
dependencies. Same-path dependencies must have identical content; differing
content is an artifact collision. All source, action, field-model, dependency
plan and provider identities are preserved in the returned plan and descriptor.
The planner returns immutable source artifacts and performs no transaction or
filesystem publication.

The action accepts typed raw data. Core inputs are copied and normalized before
the first suspension; Event constructor inputs occupy separate captured slots.
After a transaction begins, subsequent caller mutation cannot change the action's
parameters, write values, Event inputs or success result. Capture rejects
accessors, coercion hooks, hidden/symbol fields, malformed arrays, cycles and
excessive size/depth without invoking ordinary getters. Arbitrary hostile
Proxy/realm isolation is not claimed.

## Execution semantics

The generated order is:

1. Capture and normalize input data; capture explicit clock dependencies.
2. Begin a transaction and read each declared Entity by its typed identity key.
3. Check returned identity, then evaluate all enforcing Rules in binding order.
4. Prepare each declared write and validate its Entity/Value Object ownership
   and selected base Rules through the generated factories.
5. Construct each declared Event occurrence once, using its supplied input and
   explicit clock where required.
6. Normalize and validate the success value through the selected owned-value
   providers before commit.
7. Submit one frozen write/Event batch, await the terminal receipt, and return
   an explicit outcome.

Write values remain typed immutable raw-data snapshots in the transaction batch.
Owned factory construction is the validation boundary, not an implicit database
record declaration. Nested values are converted to the correct owned providers
before their parent is constructed. Entity identity, Value Object equality,
plain Enum cases, named/inline sum payloads, optional absence, list occurrences,
set membership and full-width UInt64 values remain distinct.

Set inputs must already have unique members. An explicit `to_set` expression is
the conversion that removes repeated list values; normalization does not silently
reinterpret a malformed set as a list. Factory extension validation remains
separate from base validation. No extension is chosen by this action selection.

No Entity write edge is invented. `reads`, `creates`, `produces` and `enforces`
retain the canonical relationships checked by the prerequisite. `mutates`
remains UI Binding to Operation. Repeated Event concept targets retain separate
effect slots and occurrences. Delete, Event-only and source-empty write/effect
sets are implemented without manufacturing writes or dropping declared effects.

The result and writes are separate explicit value expressions. A Calculation or
Mapping is not invoked secretly. A read result is not substituted for a supplied
replacement merely because both have the same Entity type.

## Transaction dependency and outcomes

The generated port requires `begin`, read-only `read`, precommit `rollback`,
and one atomic `commit(batch)`. The provider owns isolation, conflict handling,
state/outbox atomicity, resource release and any durability guarantee.

| Outcome | Meaning |
| --- | --- |
| `committed` | The provider returned a valid committed receipt; includes the prepared immutable success value. |
| `rejected` | A declared Rule rejected the action or the provider explicitly rejected the entire commit. |
| `failed` | Input, dependency, read, identity, owned-value, Event or result preparation failed before commit. |
| `indeterminate` | Commit was attempted but its terminal outcome is unknown or its receipt is invalid. |

Precommit rejection/failure attempts one rollback. Cleanup failure is exposed as
`cleanupFailed`, not hidden. Once commit has been attempted, the action neither
rolls back nor retries. A thrown commit can mean either no commit or a lost
acknowledgement after commit, so neither case is falsely labeled a known rollback.
A success value cannot be returned before commit settles. The source failure
continuation remains on unsuccessful outcomes.

Event construction is not publication. An earlier Event's explicit clock may
have been called if a later preparation fails; this does not publish or persist
that Event. No delivery loop, automatic retry, deduplication registry or
distributed exactly-once claim is added.

The native tests use an in-memory reference provider with draft state/outbox
commit and optimistic revision checks. They verify the generated caller under
that contract, including rejection of a later write and a stale concurrent read.
This is not proof of production database durability or admission of an adapter.
Deploying a store or adopting a runtime is separate operational work and does
not block local compiler construction.

## Verification

Final focused suite: **10/10 PASS**, zero failures/skips, **30.17 seconds**.
Source typecheck and frozen catalog/relationship/integration-profile checks pass.
The final 30-file shared regression passes **353/353**, zero failures/skips, in
**351.27 seconds**, with two test workers. The exact temporary workspace
dependency link was removed after terminal completion; the retained dependency
mirror and pre-existing CLI link were not changed.
Final source typecheck and frozen checks pass after cleanup. All eleven scoped
files pass the trailing-whitespace check.

Tests compile emitted JavaScript and declarations with pinned TypeScript 7.0.2
and execute the generated modules. They cover:

- committed changes and two distinct Event occurrences;
- declared Rule rejection and source-sensitive Rule/Event behavior;
- missing, wrong-identity and failed reads;
- invalid Entity, nested Value Object, sum-payload and returned-value rejection;
- explicit clocks, pre-await capture, delayed settlement and inert hostile input;
- commit rejection, unknown/malformed receipts and exceptions before/after the
  reference store applied a batch, with no automatic retry or postcommit rollback;
- atomic second-write rejection and optimistic concurrent-call conflicts;
- composite Value Object identity keys, full-width UInt64, optional values,
  list duplicates, set uniqueness and named/inline sums;
- delete, Event-only and guarded-read variants;
- native readonly input/batch types, identity-key types, exact Event integer
  outputs, explicit commit receipts and result narrowing.

The independent native AST observer reads authored action bindings and original
node files, not the generator's semantic declarations. It checks the bound
callable, awaited transaction calls, checkpoint order, identity checks, declared
Rule arguments, write/Event bindings, owned validation sites, precommit result
preparation, uncertainty handling and descriptor/source identities. It rejects
nine native-compiling mutations even when provider and descriptor hashes are
refreshed. Separate fresh modules demonstrate changed behavior for omitted
guards, same-type write substitution and removed nested-value validation.

The observer's independent expression reconstruction currently covers path and
literal bindings, rejecting unsupported expression forms. Shared structured-value
lowering has prior evidence for wider expressions; this observer is not claimed
as complete conformance evidence for every possible expression or provider.
Broader source/native conformance and the complete cross-language matrix remain
required by the full PCR plan.

An early mutation changed its native type but not its batch value and therefore
failed TypeScript compilation; it was corrected to change both so the semantic
observer could be tested. A nested set fixture initially contained duplicate
members and correctly failed input validation. The positive fixture now uses
distinct members and retains an explicit duplicate-set rejection test. Neither
failure was hidden by weakening the generator's type or input checks.

## Context, scope and continuation

Task-session with context-builder ran locally, without subagents or runtime
handoff. The prior unit was verified progress. The selected construction task
was executable Operation generation, preserving all PCR-06..14 requirements.
No blocker-level owner decision was required. Experiment-harness work is not
applicable to this compiler task.

Controlling context: current CLI ledger and PCR Operation role; checked action
contract and compiler; exact field model; generated Rule/value-expression,
factory/owned-value and Event interfaces; the TypeScript Operation profile;
the existing financial-settlement bound-action provider; and native generation,
declaration and independent-observer conventions. Only selected dependency
scaffolds are relied on; unrelated ontology epochs are not routing gates.

The eleven-file envelope contains three Operation generation sources, one test,
one observer, the package test list, the definition and ontology scaffold, and
this report plus CLI-COMPLETION and STATUS. Definitions and ontology scaffolding
preceded implementation. No existing source grammar, generator implementation,
canonical relationship, frozen profile, default or previous test assertion was
changed. All 28 recorded predecessor identities outside the package manifest
remain unchanged. The package delta adds exactly the Operation test entry.

ARE request: `ds-cli-continuation-20260909-043`, route
`CA2-ROUTE-IMPLEMENT`. Route receipt:
`6a73b92851e752a3b032b7aec8d01c34a8f18f203eb5cea4b5fa76c6c47737a6`.
Direct context digest:
`ac39ac566ad39a7f569036a22cc34c83b647d7a3fc146fc495ef326cdc4f4f28`.
Exact effect decision:
`50b011702f81527c1eb0eb2800f81fffab15bbf0735e41abd45a9b25e0d01fae`.
The envelope was structurally admissible with no additional owner gate. Existing
user construction authorization applies; no admission, publication, release,
default cutover or runtime adoption is granted.

Remaining construction: State Machine, Workflow and Interface generation under
their DSR-011/016/017 and field-model dependencies; then shared public CLI
planning, Python/Rust parity, complete composition/mutation evidence,
compatibility and clean installed-package verification. These remain product
requirements, not optional operational residue.

ARE continuation decision
`3f7b3532d4b3273a0fc36813372ea01b88cd5ea791592b13110454e2a8898f71`
selects State Machine source reconciliation and generation. The option is
structurally admissible with no additional owner gate; the next exact write
envelope remains to be declared. This bounded Operation unit is complete; the
full CLI goal remains active.

## Exact implementation identities

| Source | SHA-256 |
| --- | --- |
| `impl/cli/src/generation/configured-operations.ts` | `496a2015d5ce7362004565ac8197e3468bf9ec19f22c0f8f362897378350c723` |
| `impl/cli/src/generation/configured-operation-source.ts` | `943adfdfa84638d4378d3acb876a79150bb407784e377b2fb4f3a21cd147c97c` |
| `impl/cli/src/generation/configured-operation-owned.ts` | `76deb009cfec372f3a424d6c235305674b5a74e73ccc09904c3caa81bc9d8aec` |
| `impl/cli/test/generation/configured-operations.test.ts` | `1a7affa810d40f372b65c5ffe6a97bcc28e74913b8d470f08a914b4354f8cea1` |
| `impl/cli/tools/observe-configured-operations.mjs` | `499e6adef04113cfc2b354a5756e0708d03545b38c475b9e08941981bc24fc35` |
| `impl/cli/package.json` | `42e0e987dfb4fcbc479574a915f91a63c44b9e48abbc589942756fec4867f5ad` |
| `development/reconciliation-v1/profile-compiler-reconciliation/operation-generation-contract.json` | `0c5119558515283157e574deab19d937a54d32d967bc9ce7ec5cbb470fc4d6e2` |
| `development/reconciliation-v1/ontology/operation-generation-candidate.json` | `eac40ed8803824003bdabaf39e975a1c2e5c51814529b579e2019794d34a1381` |
