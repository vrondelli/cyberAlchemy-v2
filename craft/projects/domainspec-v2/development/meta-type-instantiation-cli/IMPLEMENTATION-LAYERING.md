# Meta-type instantiation CLI — implementation layering

Baseline: `domainspec-meta-types-current-implemented@2`
Baseline digest: `10c29c2a4feb5039b6c90dcd7e2d44024757b4dd2414f9c0383c82387ec6e836`

## L0 — one exact external instantiation

Decision question: after this layer, do we know that DomainSpec can turn one
typed project node into one safe, reproducible implementation in another
project?

- Minimum working unit: `domainspec-v2 instantiate <project-root> --node
  <feature-id>:<node-id> --language typescript --target-root
  <new-empty-directory>` for one Entity.
- Included: frozen catalog loading, closed Entity input decoding, an artifact
  plan containing relative paths/bytes/digests, containment and symlink checks,
  atomic no-overwrite publication, a receipt bound to the source manifest and
  baseline digest, and post-write observation.
- Deferred: the other 38 realization rows, relationships beyond those required
  by Entity, updates to non-empty targets, package publication, release and
  production claims.
- Operator-visible outcome: one external project contains a generated Entity
  whose files and receipt can be independently re-read and verified.
- Risk reduced: proves the missing generation/writer seam without widening to
  every type or language.
- Exit evidence: focused tests cover the happy path, traversal, symlink,
  overwrite, unknown type/language, changed baseline and changed output.
- Promotion decision: proceed only when two isolated runs produce equivalent
  plans and receipts apart from their explicit output locations.

## L1 — complete 13-by-3 generation

Decision question: after this layer, do we know that every admitted backend
meta type can be instantiated through the same contract in all three languages?

- Minimum working unit: add generators until every one of the 39 frozen rows is
  reachable through one closed catalog and one receipt contract.
- Included: closed body schemas, per-row generator identities, deterministic
  file plans, cross-language fixtures and aggregate coverage.
- Deferred: relationship graph enforcement and behavioral target observation.
- Exit evidence: exact 13-type/39-row coverage and hostile missing-generator
  checks through the ordinary CLI test command.
- Non-regression: L0 atomicity, containment, no-overwrite and receipt bindings
  remain unchanged.

## L2 — relationships and Operation semantics

Decision question: after this layer, do we know that generated behavior carries
the declared relationships and effects rather than only the correct file shape?

- Minimum working unit: materialize Operation's Rule, Event and Workflow edges
  and validate read/write/effect declarations, guard ordering, atomic
  state-and-outbox behavior and failure continuation.
- Included: exact relationship decoding, generated observers, hostile effect and
  continuation mutations, and relationship-bound receipts.
- Deferred: release packaging and migration of existing targets.
- Exit evidence: all Operation hostile controls fail for the intended reason and
  the positive generated project passes structural and semantic observation.
- Non-regression: all L0/L1 generation and safety guarantees remain true.

## L3 — target conformance surface

Decision question: after this layer, do we know that an independently modified
target still implements the exact baseline selected at generation time?

- Minimum working unit: `lint` and `receipt` consume the generation receipt and
  re-observe the target against the frozen baseline.
- Included: digest drift, source-shape drift, relationship drift, behavioral
  drift and undeclared-effect diagnostics.
- Exit evidence: positive replay plus causal mutants for every enforced class.
- Non-regression: generation remains deterministic and cannot silently refresh
  a target to a newer baseline.

## L4 — repeatable package boundary

Decision question: after this layer, do we know that the CLI can be built and
used from a clean supported environment without relying on the monorepo?

- Minimum working unit: a private clean-root package build with an immutable
  embedded baseline/catalog and an isolated end-to-end generated-project run.
- Included: versioned package contract, clean-root build, runtime matrix and
  reproducible package inventory.
- Deferred: public publication, deployment and production support.
- Exit evidence: two clean-root runs and independent package inventory review.

Recommended next layer: L0. The first pending unit is the versioned candidate-2
CLI contract followed immediately by the TypeScript Entity vertical; neither
unit reopens the frozen meta-type selections.
