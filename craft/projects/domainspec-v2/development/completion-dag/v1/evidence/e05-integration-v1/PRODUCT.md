# Product proposed for approval

**DomainSpec → EVF owns-reachability integration**, candidate
`DSV2-E05-OWNS-REACHABILITY-001`.

This is a repository-local compiler adapter and independent evidence consumer.
It answers one question: does a selected Entity reach another Entity through one
or more explicitly authored `owns` edges in a compiled DomainSpec project?

For example, `A owns B` and `B owns C` establish that A reaches C. Removing
`B owns C` makes that claim fail. A query from A to itself needs a real nonempty
cycle; the consumer does not count a zero-length path as success.

## What the candidate does

1. Checks and invokes the exact previously approved DomainSpec CLI 1.0.0 package,
   retaining the compiled graph, certificate and source identities.
2. Selects every Entity and every explicit owns edge across the project. Tuple
   identities preserve feature boundaries and all original edge provenance.
3. Uses the pinned portable EVF 0.4.0 kit and Souffle for a positive audit plus a
   control that removes every incoming edge to the query target. Each case runs
   twice in the contained native protocol.
4. Transfers hash-bound evidence to a separate process. Its independently
   implemented consumer reconstructs reachability and checks source identity,
   graph correspondence, positive evidence, negative control, native evidence
   integrity and a separately selected consumer-source review.
5. Reports PASS only when all six conditions pass. Counterexamples, stale or
   contradictory evidence BLOCK. Missing evidence, unavailable execution or a
   missing independent review remain not_evaluable, unless a separate known
   failure already requires BLOCK.

The bound is one query over the whole compiled project's **1–64 Entity nodes**.
There is no truncation to fit that limit. The provider for this product slice is
Souffle. Legal ownership, access control and runtime behavior are not inferred
from the name of the owns relationship.

## Exact implementation and evidence

The selected implementation is `DSV2-E03-OWNS-REACHABILITY-003`, under
`e03-reachability-v3`. The CLI entry points are adapter.py and consume.py; they
operate within this repository layout and use the explicit dependency paths in
the preserved E02 lock. This approval is for that bounded local candidate; a
portable installation or published CLI integration is not part of this delivery.

E01 contains the definition and fixture intent. E02 contains the design profile,
compiled prototypes and contracts. Its historical status labels describe the
design epoch; the v3 source manifest and completed E04 receipt identify the actual
tested implementation. The manifest distinguishes those roles explicitly.

E04 establishes all 18 declared fixture outcomes. Its final closure ran 24 fresh
consumer processes. Positive, cycle, 64-node and exact replay cases pass all six
conditions. The independent reviewer confirmed 21 focused scenarios, 15 supplied
replays and 4,608 graph/query oracle cases. Three evidence-validation findings were
fixed in successor candidates; the earlier BLOCK reviews remain preserved.

Five positive native audits and the deliberately broken native run are retained
E04 evidence. Later consumer repairs received fresh offline validation and source
review. E05 rechecks byte currency and final product fit; it does not represent
those retained provider runs as new native executions or claim current host
runtime currency. `candidate-manifest.json` binds the product description, exact
implementation, design/dependency inputs, archives, tests and historical evidence.

## Approval boundary

An approval would mean: **this exact tested candidate satisfies the bounded
compiler-to-EVF owns-reachability integration scope above**. It would complete
E05 and the M-EVIDENCE product milestone, once the explicit decision is recorded
against this manifest's SHA-256. It does not follow from the earlier Stable 1.0
compiler approval, the EVF package reference, a test PASS or a status field.

This decision does not approve the EVF package generally, all DomainSpec v2 work,
Auth conformance, UI adoption, durable recovery, migration, multiple providers,
TLC stability, whole-compiler correctness, hostile-host evidence authenticity,
cross-host portability, production operation, release or deployment. Publication,
activation and external effects require separate exact decisions.

## Remaining work and owners

The current construction frontier is E05 independent product review and your
manifest-bound product decision. R00, U00 and L00 remain independently runnable.
Operational residue remains with its owners: O01 Repository/release owner for
compiler release preparation; O06 portable EVF owner for distribution publication;
EVF/TLC owner for the unrelated stability issue. A future live execution owner
must recheck its exact tools and runtime before running another native audit.
These operational tasks do not block this bounded product decision.
