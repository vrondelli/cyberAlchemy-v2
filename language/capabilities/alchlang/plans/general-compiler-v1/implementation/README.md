# AlchLang CLI

AlchLang source files describe the 13 DomainSpec backend types, bounded logic,
typed contracts, actions, events, and explicit effect boundaries. Canonical source uses the
`.alch` suffix and plain UTF-8 text without Markdown fences.

> Development status: this CLI is currently run from the repository checkout.
> No package-registry installation is documented.

## DomainSpec 1.0.0 integration

AlchLang now binds to `@domainspec-v2/cli@1.0.0`. The upstream package and
executable retain their `v2` names; `1.0.0` is the compiler product version.
AlchLang's own `0.4.0-candidate.0` version is independent.

Build the current DomainSpec CLI before using the bridge (Node 26.8.1):

```bash
# From the repository root:
npm --prefix projects/domainspec-v2/impl/cli run build
```

From this AlchLang implementation directory, after `npm run build`:

```bash
node dist/cli.js domainspec --version
node dist/cli.js domainspec capabilities
node dist/cli.js domainspec lint "$(realpath ../domainspec)"
node dist/cli.js domainspec compile "$(realpath ../domainspec)" \
  --target /absolute/existing-directory/new-certificate.json
```

When this package is installed locally, `alchlang domainspec …` provides the
same command. The historical `domainspec` executable alias remains compatible.
Set `ALCHLANG_DOMAINSPEC_PACKAGE_ROOT` to the absolute directory of an exact
installed/built 1.0.0 package outside the checkout. The optional peer dependency
records that exact version; ordinary AlchLang commands do not require it.

The adapter checks both package identity/version and the built public API and
CLI version, then uses the public package entry. Missing, old or mismatched
builds fail explicitly. Supported compiler commands retain DomainSpec's argument
validation, certificates and exit codes. Compilation targets must be new absolute
paths. The bridge also supports build/verify, instantiate/instantiate-project,
verify-project, formalize/check and certify/check; it excludes experimental
runtime and recipe operations.

The input to `domainspec compile` is a DomainSpec project directory. The new
explicit target profile lowers supported `.alch` declarations into that format:

```bash
node dist/cli.js check examples/domainspec-order.alch --profile domainspec-1.0.0
node dist/cli.js emit-domainspec examples/domainspec-order.alch --out /tmp/order-project
node dist/cli.js build examples/domainspec-order.alch --backend domainspec --language typescript --out /tmp/order-build
```

Each output directory must be new, with an existing real parent directory.
The default binding file is `<source>.domainspec.json`; `--bindings` selects another.
The [example bindings](examples/domainspec-order.alch.domainspec.json) show the
required source SHA-256, declared owner, explicit ontology selectors and meanings,
record property metadata, Entity identity and Value Object invariant references.
Changed source bytes require updated bindings.

The first profile supports String/Bool records, identifier fields, bounded Boolean
rules, exactly representable input-free UInt64 constants, concrete mappings and
ordered policies selecting those constants. Unsupported types, constructs,
relationships and incomplete bindings reject explicitly. It does not support the
full UInt64 range or all thirteen backend kinds. Ordinary `build` and `check`
now use the DomainSpec backend. The previous local carrier compiler requires
`--backend local-compat`; unsupported DomainSpec input never switches to it
implicitly. Specialized function/event/host profiles retain their own explicit
dispatch. See [compilation reconciliation](docs/COMPILATION-RECONCILIATION.md).

Build output includes `project/`, `generated/`, the checked TypeScript entry
`domain.ts`, source and binding snapshots, trace, compiler inventory, certificate
and a SHA-256 manifest. `domain.ts` exports `evaluateMapping(id, facts)` and
`selectPolicy(id, facts)` using source identifiers; selection returns the target
identifier without executing it. Compile this entry with the generated TypeScript
for use in an application. Build verification checks upstream generated artifacts;
our parity tests separately typecheck and execute the generated TypeScript.

Generation occurs in a temporary sibling directory. The destination is claimed
exclusively and `manifest.json` is installed last as its completion marker;
consumers must not treat an incomplete directory as a finished build. Existing
directories are never overwritten. Failed staging is removed.

### Exact UInt64 commerce profile

The opt-in `domainspec-1.0.0-exact-uint64-v1` profile adds queries, integer
records, parameterized UInt64 arithmetic and numeric policies. It requires a
local DomainSpec build advertising `domainspec.typescript-exact-uint64/v1`;
the 1.0.0 version label alone is insufficient. Rebuild the bound CLI first.

```bash
node dist/cli.js check examples/typed-backend.alch --profile domainspec-1.0.0-exact-uint64-v1 --bindings ../extensions/domainspec-exact-uint64-v1/typed-commerce.bindings.json
node dist/cli.js build examples/typed-backend.alch --backend domainspec --language typescript --profile domainspec-1.0.0-exact-uint64-v1 --bindings ../extensions/domainspec-exact-uint64-v1/typed-commerce.bindings.json --out /tmp/commerce-exact
```

The existing commerce source is unchanged. Its binding sidecar explicitly selects
the new profile. The generated `domain.ts` also exports `evaluateQuery(id, rows,
parameters)` and `evaluateCalculation(id, inputs)`. Calculation results are bigint;
inputs accept bigint, safe integer Numbers or canonical unsigned decimal strings.
Integer record and policy inputs accept bigint or nonnegative safe integer Numbers.
Unsafe Numbers reject; calculations enforce the full UInt64 range and their
rounding/error contract. Query and Mapping outputs preserve supplied numeric
representation, and predicates preserve source equality/comparison semantics.

Queries use one sort key, stable ties, filtering before limiting, explicit
projection and missing-field failures. Overlapping row/parameter names and
multiple sort keys reject. Numeric predicate/default literals must be safe
integers; full UInt64 calculation literals use exact base-2^32 decomposition.
General Rule lowering retains its String/Bool predicate subset. Effects and the
remaining backend kinds are outside this profile.

The upstream generated receipt binds the realization profile. Upstream verification
requires the same `--realization-profile domainspec.typescript-exact-uint64/v1`.
A compile-only project certificate does not itself select a numeric realization;
use the profile-aware AlchLang build or explicit upstream build option.

See the [exact-profile candidate](../extensions/domainspec-exact-uint64-v1/README.md).
The older [application trial](../extensions/domainspec-application-trial-v1/README.md)
continues to describe the unchanged original profile's rejection.

See the [implementation and test record](../extensions/domainspec-lowering-v1/README.md)
for the compiler self-model successor, construction status and claim limits.

Start with the [AlchLang tutorial](docs/TUTORIAL.md). Use the
[language reference](docs/LANGUAGE.md) for declaration-level syntax.
Before authoring Rules, Policies, Invariants, Query conditions, or State Machine
guards, consult the [FormalClaim and sorted first-order logic reference](docs/FORMAL-CLAIMS.md).
It separates the selected FormalClaim-bound target model from the older
`sfol-v1` compatibility parser still described by the current language guide.
For generated public GET/POST routes and typed native operation bindings, use
[public route assembly](SERVICE.md), the explicit `public-routes-v1` assembly mode.

Use [multi-entry services](docs/MULTI-ENTRY-SERVICES.md) when one `.alch`
assembly must expose two or more already compiled declarative functions without
an implicit default entry point.

The [documentation frontend](docs-app/README.md) provides a responsive React
presentation with section navigation, search, and copyable examples.

## Semantic contract profile

`semantic-contract-v1` is a bounded candidate profile for semantics that must be
declared in Alch rather than decided by host code. It supports first-class
`axiom`, `intrinsic`, `invariant`, `governed-by`, and `validation` blocks. It
does not define `law`: canonical Axiom, Invariant, and Constitution concepts
already separate premises, must-hold conditions, and owner-scoped governance.

```bash
node dist/cli.js check ../extensions/semantic-contract-v1/semantic-prelude.alch
node dist/cli.js ontology ../extensions/semantic-contract-v1/semantic-prelude.alch
node dist/cli.js build ../extensions/semantic-contract-v1/semantic-prelude.alch --out /tmp/alch-semantic-prelude
```

Builds traverse Alch source, a compiler-local ontology, a Craft project, the
bound DomainSpec compiler, runtime projection, and finite fixture validation.
The generated evidence does not prove the invariants universally or adopt the
referenced Constitution; it retains `authority_effect: none`. See the
[extension contract](../extensions/semantic-contract-v1/README.md).

From this directory:

```bash
node --version
npm test
npm run typecheck
npm run build
node dist/cli.js check examples/typed-backend.alch --backend local-compat
node dist/cli.js check examples/backend-types.alch --backend local-compat
node dist/cli.js build examples/typed-backend.alch --backend local-compat --out generated/typed-commerce
```

### Installable package boundary

The development checkout retains one full regression surface, but release
artifacts are split by required runtime:

| Package | Command | Contents and prerequisites |
| --- | --- | --- |
| `@cyberalchemy/alchlang` | `alchlang` | Core parser, ontology and Node/TypeScript compilation. No Cargo templates or local-host modules. |
| `@cyberalchemy/alchlang-rust` | `alchlang-rust` | Optional Rust generation and conformance. Cargo is required only when this command builds or traces a native target. |
| `@cyberalchemy/alchlang-local-host` | `alchlang-local-host` | Experimental repository-bound hosting and provisioning. Includes the Rust layer; Ansible/Bubblewrap remain profile-selected operational prerequisites. |

Build the three local candidate archives with `npm run pack:release`. This
creates package artifacts only; it does not publish or install them. The core
command rejects `rust-http` and host profiles with an error naming the required
optional command. The Rust command likewise rejects local-host profiles.

Use `npm run bootstrap:rust` only before working with the Rust or local-host
packages. It is not part of core AlchLang installation or core validation.

`bootstrap:rust` uses the repository-native toolchain to fetch only the
checksum-bound dependency graph in
`src/event-templates/rust-runtime/Cargo.lock`. Generated event and semantic
hosts copy that lockfile and compile with `cargo build --offline --locked`.
Run the bootstrap once on a new machine or after clearing Cargo's cache; normal
tests and builds remain offline and fail closed when a locked crate is absent.

`examples/backend-types.alch` exercises Entity, Value Object, Enum, Operation,
Query, Calculation, Rule, Policy, Workflow, Interface, Event, Mapping, and
State Machine in one source. The compiler emits TypeScript contracts;
TypeScript/Python/Rust realization parity belongs to the separate DomainSpec 1.0.0
instantiation CLI and is not claimed by this package.

Generated artifacts are declaration-sensitive. An Entity-only source emits
`domain.types.ts`, `domain.schema.ts`, and `domain.graph.json`. Event, state
machine, action/operation, workflow, interface, example, typed-backend, effect,
traceability, and unsupported-residue files appear only when their corresponding
plan collections contain data.

Run the focused alchLang output/meta-type test from the repository root:

```bash
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl -- \
  node --import tsx --test \
  ../../../cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/implementation/test/meta-type-output.test.ts
```

Run DomainSpec's independent 26-case, 156-swap, 13-node formation test:

```bash
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl -- \
  node --import tsx --test tools/tests/formation-golden-corpus.test.ts
```

Run a guarded action with an explicit local adapter:

```bash
node dist/cli.js run examples/customer-approval.alch ReleaseCredit \
  --actor CreditOperator \
  --facts '{"customerId":"c-1","riskScore":600,"status":"approved","amount":100}' \
  --grant credit-release-authority \
  --adapter memory
```

Run the SQLite transactional Outbox example with an explicit infrastructure
request:

```bash
node dist/cli.js run examples/outbox-operation.alch CommitOrderWithOutbox \
  --actor OrderService \
  --facts '{"operationId":"operation-1","orderId":"order-1","status":"pending","outboxMessageId":"message-1","occurredAt":"2026-09-03T12:00:00.000Z","payload":{"kind":"order-committed"}}' \
  --grant order-transaction-authority \
  --binding sqlite-transactional-outbox \
  --database ./outbox.sqlite \
  --effect-request-file examples/outbox-request.json

node dist/cli.js outbox pending --database ./outbox.sqlite
node dist/cli.js outbox dispatch --database ./outbox.sqlite --transport stdout \
  --worker-id local-worker
```

The SQLite provider records state and Outbox work in one transaction. Message
dispatch is a separate command. HTTP dispatch is opt-in and requires the
endpoint origin to match both `--allow-origin` and
`--confirm-network-dispatch`.

Discover registered operation patterns with:

```bash
node dist/cli.js patterns
node dist/cli.js patterns --available
node dist/cli.js patterns --blocked
node dist/cli.js pattern transactional-outbox
```

Legacy `.md` containers remain readable when they contain exactly one fenced
`alchlang` block. Use `.alch` for new and maintained source files.

### Medusa quantity-price application

The [quantity-price module](../extensions/medusa-quantity-price-v1/README.md)
models inclusive USD base-price tiers and exact subtotals through the DomainSpec
1.0.0 exact UInt64 target. Run `node ../extensions/medusa-quantity-price-v1/demo.mjs`
for a generated application example. Its local tests and optional pinned Medusa
PostgreSQL oracle distinguish bounded query parity from full shop integration.
See the module README for current evidence, contract limits, and open questions.

### Complete HTTP functions in one `.alch` file

The opt-in [function profile](docs/FUNCTIONS.md) expresses input/output schemas,
inline ontology bindings, integration configuration, conversions, branching and
an authenticated HTTP endpoint in the source file. Build the
[complete pricing function](../extensions/serverless-function-v1/quantity-price.alch)
with `node dist/cli.js build ../extensions/serverless-function-v1/quantity-price.alch --out /tmp/new-price-function`.
The generated bundle exports a handler and a Node launcher. No authored JavaScript
adapter or JSON sidecar is required. See the function guide for tests and limits.

## Declarative read-only functions

The opt-in `declarative-function-v1` profile lowers typed Mapping, Query and Rule declarations through DomainSpec code generation, with the integration and endpoint in the same `.alch` source. See [the guide](docs/DECLARATIVE-FUNCTIONS.md) and [quantity-price example](../extensions/declarative-function-v1/quantity-price.alch). It is a candidate contract extension; factory automation remains deferred.

## Derived ontology and explanations

Declarative functions now derive ontology bindings from their declarations. Optional meanings and identity overrides preserve authored semantics. Use `alchlang ontology <file.alch>` or `alchlang explain <file.alch> <declaration>` to inspect the validated model with source evidence. See [the ontology guide](docs/ONTOLOGY.md) and [simplified pricing source](../extensions/derived-ontology-v1/quantity-price.alch).

## Explain a local invocation

`alchlang trace <file.alch> --input <input.json>` executes a declarative function using supplied snapshots and returns source-linked observations. Generated bundles also export `invokeWithTrace`. Ordinary HTTP responses stay unchanged. See [the invocation trace guide](docs/INVOCATION-TRACES.md).

## Unified DomainSpec project build

Declarative functions now include behavior, typed core references, integration configuration and derived ontology in one DomainSpec project certificate and standard build/verify path. See [the unified project guide](docs/UNIFIED-PROJECT.md) and [current pricing candidate](../extensions/unified-project-v1/README.md).

## Native Rust target

Build the same declarative function with `--target rust-http`, or declare `target rust-http` and `runtime rust>=1.94` in its endpoint. The output includes a native executable, Cargo library, integration boundary and local traces. See [the Rust guide](docs/RUST-FUNCTIONS.md) and [the Rust pricing source](../extensions/rust-function-v1/quantity-price.alch).

## Portable Node/Rust conformance

`portability node-rust-v1` selects the common value, ordering, date, pattern and integration semantics. `check --target rust-http` catches unsupported source before generation; `conformance` compares both generated targets against fixtures. See [Portable conformance](docs/PORTABLE-CONFORMANCE.md) and the shipping-options example in `../extensions/portable-conformance-v1`.

## Typed module composition

Portable functions can import boundary types and call another generated function with `module-local` or `module-http` bindings. See [Module composition](docs/MODULE-COMPOSITION.md) for the checkout example, import closure, trace scope and limits.

## Guarded module calls

`bind shipping from ShippingPrice when HasPrice` invokes a module only when its
Boolean guard holds. DomainSpec checks output availability and generates both Node
and Rust behavior. See [guarded bindings](docs/GUARDED-BINDINGS.md) for the complete contract and examples.

## Module input mappings

`input ShippingInput` selects a typed Mapping that constructs an imported module
argument from the request and earlier binding outputs. See [module input mappings](docs/MODULE-INPUT-MAPPINGS.md)
for typing, guarded availability, runtime validation and open questions.

## Event bindings prototype

The [event-function-v1 profile](../extensions/event-bindings-v1/README.md) compiles
declarative channels and delivery/observation policies into existing DomainSpec
TypeScript and Rust binding contracts. Its order example and local fault tests
are linked there, together with runtime limitations and open questions.

## Generated event execution

[event-execution-v1](../extensions/event-execution-v1/README.md) adds standalone
Node and Rust invocation handlers with shared durable SQLite transactions, Alch
actor/grant/SFOL checks, declared mappings, outbox leases, and ORODI observations.
It documents the trusted-host interface and local-only execution claim.
# Local deployment authoring

The [local-host-v1 profile](../extensions/local-host-v1/README.md) adds an authored
deployment block, reuses RWO–Ansible temporary provisioning, and generates a
loopback HTTP host for the Rust event handler. `check` and `build` accept this
profile. Operator credentials are environment-supplied. This is a trusted local
prototype, not public hosting or a tenant sandbox.

The [event delivery and isolation successor](../extensions/local-host-events-v1/README.md)
adds optional `events local` and `isolation bubblewrap` deployment bindings,
operator-granted consumer delivery, and tested local filesystem/environment/network
separation. Public listeners remain disabled.

The [local control-plane candidate](../extensions/local-control-plane-v1/README.md) lets two operator-configured tenants upload complete Alch files and consume isolated Rust revisions through one loopback server. It reuses this compiler and the existing RWO/Ansible event host. See its DAG, tests, limitations and open questions before operating the prototype.

The [asynchronous build successor](../extensions/async-control-plane-v1/README.md) returns a queued revision immediately and compiles on a bounded background worker, allowing existing functions to remain callable. See its polling API, tenant scheduling, recovery contract and open questions.

The [compatible upgrade successor](../extensions/compatible-upgrades-v1/README.md) preserves function-owned state, outbox and inbox across revisions with an identical compiled business/runtime contract. It adds drained handoff, rollback with current data, eager delivery recovery and v1/v2 Alch examples. Wider compatibility and migrations remain explicit open questions.

The [additive state migration successor](../extensions/state-migrations-v1/README.md) adds `local-host-migration-v1`: a source-contract-bound Alch declaration compiled into a DomainSpec Mapping, snapshot rehearsal, preserved receipts and an atomic switch to a new storage generation. Cross-schema rollback requires an inverse contract and is rejected in this slice. See the complete [Alch example](../extensions/state-migrations-v1/orders-v2.alch), recovery tests and open questions.

The [ontology-derived schema successor](../extensions/ontology-schema-v1/README.md) adds `ontology-host-v1`. Declare an optional scalar default once on the entity; the typed host ontology drives fact/state schemas and DomainSpec migration mappers. A preparation endpoint pins the selected baseline and rejects stale activation plans. See the complete [v1](../extensions/ontology-schema-v1/orders-v1.alch) and [v2](../extensions/ontology-schema-v1/orders-v2.alch) examples.

The [semantic correction successor](../extensions/semantic-corrections-v1/README.md) adds `semantic-host-v1`: separate command/state/event/projection records, persisted transitions, DomainSpec-generated mappings, imported system types, enforced local delivery policies and explicit snapshot migration. Use its [order example](../extensions/semantic-corrections-v1/orders.alch) for the corrected semantics. Earlier host profiles retain their historical behavior; see the source-bound review reproductions before reusing them.

## Generated function application layout

Function builds use DomainSpec's `domainspec.application-layout/v1` contract.
Rebuild the compatible DomainSpec package before building AlchLang functions.
Older packages without the exported layout contract fail with
`DOMAINSPEC_APPLICATION_LAYOUT_BUILD_REQUIRED`.

```text
<output>/
  app/function/           Generated behavior, entry and launcher (or Rust crate)
  domain/typescript/src/  Generated TypeScript and API wrapper
  domain/typescript/lib/  Compiled JavaScript (Node target)
  domain/rust/src/        Generated Rust domain code (Rust target)
  runtime/               Boundary/tracing support or function/runtime.rs
  modules/<alias>/        Imported bundles using the same structure
  provenance/function/   Full source, ontology, model and composition metadata
  provenance/lowering/   Exact lowered compiler inputs
  evidence/              Build receipt, composition trace and lowering evidence
  bin/alch-function      Native executable (Rust target)
  package.json           Node package with start script (Node target)
  deployment.json        Target-specific entry and launcher paths
  manifest.json          Final inventory and content digests
```

Node applications start with `npm start` from their output directory; the
manifest declares `app/function/server.mjs`. Rust applications execute
`bin/alch-function`. Trace and conformance commands resolve these paths through
the shared compiler contract. Imported modules retain independent manifests.
Moving the complete bundle preserves its relative imports. Generated source and
compiled JavaScript have separate roles; duplicate composition and Rust source
copies are no longer retained. Lowering snapshots are exact compiler inputs, not
another application implementation. Build staging is removed on completion.

This changes new function bundles, not existing bundles, host/event profiles or
accepted archives. Open questions and product decision status are tracked in
`projects/domainspec-v2/development/output-layout/v1/DESIGN.md` at repository root.

Outbound provider composition: [OUTBOUND.md](OUTBOUND.md).

Generated response stream lifecycle: [STREAMS.md](STREAMS.md).

[Request custody profile](CUSTODY.md).
