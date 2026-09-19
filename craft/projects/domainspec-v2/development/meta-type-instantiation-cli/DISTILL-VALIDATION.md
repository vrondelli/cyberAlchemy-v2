# Distill validation — meta-type instantiation CLI

- Target context: turn the admitted 13-type/39-row baseline into a CLI that can
  instantiate implementations in other projects.
- Objective/output: select the smallest coherent first vertical and produce an
  implementation-layering artifact plus Work Pack.
- Mode: Standard; one proposal track, two rounds, local Proposer/Balancer role
  simulation because no governed multi-agent dispatch was confirmed.
- Verdict: pass for plan scope and L0 selection.

## Role trace

Round 1 Proposer selected an all-type catalog plus generic generator. Balancer
raised `scope-overreach`: it would mix 39 generators, relationship semantics and
external-write safety before proving any one output. Reconciliation reduced L0
to one TypeScript Entity while retaining a catalog interface that can later
cover all rows.

Round 2 Proposer placed generation directly in the existing CLI command.
Balancer raised `contract-contradiction` and `external-effect-safety`: the
current foundation contract permits only `lint`/`receipt` and `writes: none`,
and a writer needs containment, symlink, overwrite and atomicity guarantees.
Reconciliation preserved candidate-1 and inserted one versioned contract SWU,
then separated pure planning from guarded publication and observation.

## Optimization point

The smallest coherent unit is: select one Entity node, bind the exact frozen
TypeScript realization, plan its files, publish to a new empty target, and
verify the result. Removing catalog binding loses the user's frozen-baseline
requirement; removing publication or observation no longer proves a CLI that
creates a usable target. Adding another type or language does not unlock the
first decision and is deferred.

## Recomposition proof

The L0 catalog selector, artifact plan, publisher and receipt are the same
interfaces consumed by L1's other 38 rows. L2 adds relationship and behavior
observers to the receipt rather than replacing generation. L3 reuses those
receipts for ongoing conformance. L4 packages the already proven surface.

## Technique trace

- Abstraction-level guard: kept L0 at one end-to-end generated type.
- Recomposition proof: passed through shared catalog/plan/publisher/receipt
  interfaces.
- Evolution profile: confirmed 13 types, three languages and repeated external
  project integrations; a closed generator registry is justified.
- Boundary-object check: the frozen baseline manifest is the shared object
  between implementation evidence, generation and later conformance.
- Premortem: most likely failure is a generator silently using moving repository
  files; guardrail is mandatory baseline digest and per-row digest binding.
- Frame expiry: rerun Distill if the CLI stops generating files, permits updates
  to non-empty targets, or changes the 13-by-3 denominator.
- Evidence emission: not configured; no runtime-event authority is claimed.

Next route: select and execute `SWU-MTCLI-002`, then freshly select
`SWU-MTCLI-003` after closeout.
