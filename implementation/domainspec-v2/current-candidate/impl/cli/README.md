# `@domainspec-v2/cli`

This directory contains the canonical private DomainSpec v2 foundation CLI.
It embeds the immutable `domainspec-meta-types-current-implemented@10` catalog,
selects exactly one of
its 39 realization rows, and exposes four command forms:

```text
domainspec-v2 add operation <source-project-root> --feature <feature> --name <operation> --description <text> --guard <guard> --failure-continuation <continuation> [--reads <csv>] [--writes <csv>] [--effects <csv>]
domainspec-v2 instantiate <source-project-root> --node <feature>:<node> --language <typescript|python|rust> --target-root <absolute-new-root>
domainspec-v2 instantiate <source-project-root> --node <feature>:<node> --language <typescript|python|rust> --target-root <absolute-new-root> --integration-profile provider-neutral-v1 --integration-binding-set <binding-set-id>
domainspec-v2 lint <source-or-instantiated-target-root>
domainspec-v2 receipt <source-or-instantiated-target-root>
```

`add operation` authors one closed `domainspec.node/v1` Operation in an
existing validated source project. The feature and name are lowercase
kebab-case identities; the language profiles derive their filenames and
function symbols from that single node identity. Descriptions, guards, and
failure continuations are required rather than inferred. Omitted read, write,
or effect options become explicit empty sets. The command stages and validates
the complete prospective project, rejects existing nodes and concurrent
authoring, writes the new node while it is still unreferenced, and atomically
replaces the feature index as the visibility boundary. Its result includes the
recomputed source-manifest digest. This slice does not create projects,
relationships, generated implementations, or runtime providers.

`instantiate` decodes one of the 13 closed backend meta types, plans one
deterministic language artifact, and publishes the artifact plus a
baseline-bound receipt through a single atomic directory rename. It never
updates an existing target. `lint` and `receipt` independently re-read an
instantiated target, reproduce the expected generator output for the selected
frozen row, and reject undeclared files or semantic drift.

The optional system-integration pair is explicit and closed: both options must
be present or both absent. The CLI reads
`integrations/<binding-set-id>.json` from the source project, validates the
provider-neutral D45-D49 contract family, binds its source/profile/language and
architecture digests into the receipt, and emits one additional contract at
`src/domainspec/system-integration/<language>/<binding-set-id>.<extension>`.
DomainSpec accepts the target project's opaque adapter and resource references;
it does not select SQLite, another database, a framework, or a dependency
container. Generated contracts preserve
`runtime_guarantees_observed: false`: provider runtime behavior requires a
separate observation layer and is outside this candidate slice.

Relationship inputs are validated project-wide against a digest-bound generated
projection of all 31 canonical signatures. The decoder rejects invalid endpoint
types and placement, deprecated aliases, authored generated views, selected
duplicate propositions, and the explicit `creates` one-to-one obligations before
it plans any target. Operation generators keep instrumentation in an injected
outer wrapper around the pure state/outbox core; Workflow generators require an
explicit composition-root compensation callable, emit a five-state forward-recovery
plan, and preserve the selected realization's `compensation_execution: false` ceiling.
Every forward and recovery step must be connected through the canonical
`Workflow --[orchestrates]--> Operation` relationship. Explicit compensation
dependencies use `operation:depends-on:operation`; absent dependencies fall back
to reverse completed-step order. A separately owned executor preflights every
Operation binding and deterministic idempotency key before the first invocation.

The package is not released, published, registered, deployed, or production
ready. The root export is the curated instantiation/conformance API; the
architecture-conformance proof runner remains internal to `@domainspec-v2/impl`
and is not used as a code generator.

The supported target environment is Linux x64 in the repository Node toolchain
container with Node.js `v26.8.1` and npm `11.19.0`. The development workspace
uses the same container with pnpm `10.34.5`; this private CLI package has its
own npm `11.19.0` lock and package boundary. Clean-package validation packs the
compiled output into an isolated temporary consumer and compares two generated
targets byte for byte. These checks are implementation evidence only; they do
not publish, release, deploy, or claim production readiness.
