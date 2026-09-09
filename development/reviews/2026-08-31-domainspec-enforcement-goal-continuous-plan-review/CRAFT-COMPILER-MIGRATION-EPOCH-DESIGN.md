# Craft Compiler and Path Migration Epoch

Status: planning candidate  
Work item: `ARC-SWU-04` under `CGC-G20`  
Selected route: `CA2-ROUTE-PLAN`  
Authority effect: none

## Product purpose

Craft is the selected product name for DomainSpec v2, but the compiler package,
direct consumers, and two live construction records still identify the legacy
`projects/domainspec-v2` path. Closing that mismatch is necessary so the product
can eventually prove one continuous chain from authored intent to implementation
evidence. It is not an Arcanum retirement task, and a path replacement by itself
would not establish Product ownership, ontology admission, conformance, or Goal
achievement.

## Current evidence

- The currently referenced compiler package is eight clean files under
  `projects/domainspec-v2/impl/tools/minted-project`.
- An eight-file byte-identical copy exists under
  `cyberAlchemy-v2/implementation/domainspec-v2/impl/tools/minted-project`.
  Source parity is not compiler-output determinism or conformance.
- The earlier `MIG-B-STAGED-SUCCESSOR` decision authorized additive
  materialization, candidate rebinding, and successor-baseline preparation. It
  explicitly did not admit the successor baseline or switch authority.
- Its selected source-inventory digest is
  `377362acdbaa687839389790d92f1e6e5be9352cdcaf460f081daca12d13114d`,
  while the current inventory file hashes to
  `cbe34e5bd723a75153d7f9ce7817ff971d71e370eb9e0dc5c764db2ed15850c7`.
  The predecessor epoch therefore cannot be promoted or silently refreshed.
- `BASELINE-V11-CANDIDATE-009` remains `candidate-unadmitted`, explicitly
  unvalidated, with no authority switch.
- Twelve executable source surfaces directly import or bind the compiler API;
  generated ontologies, versioned candidates, development history, and local
  indexes form separate classes and must not be bulk-rewritten.
- The direct-reference discovery set contains 404 paths. The SHA-256 of the
  sorted newline-delimited path list is
  `8d7da1f3d3da10afe5dba5e33698999343e52295c1f55e7dd54869f1af925d81`.
- The legacy DomainSpec tree currently has 23 modified and five untracked
  paths. The compiler package itself and the existing copied package have no
  Git-status overlap, but a new source epoch must still wait for an owner-frozen
  dependency set.

## Dependency classes

| Class | Count | Disposition |
|---|---:|---|
| Compiler source files containing a searched symbol | 3 | The complete compiler package is eight files and must be frozen as one unit. |
| Other executable consumers under the legacy implementation | 9 | Validate against both paths; rebind only in an accepted successor epoch. |
| Legacy development, research, and historical evidence | 54 | Retain; never use search-and-replace as migration. |
| Legacy normative or project documents | 3 | Resolve through Product and architecture owners. |
| MIG-B successor and versioned candidate material | 209 | Treat as candidate/history until a current-pointer owner decision. |
| Other CyberAlchemy private active, generated, or versioned surfaces | 61 | Split source consumers, bindings, generated outputs, and snapshots before mutation. |
| Candidate review or migration history | 56 | Retain as evidence. |
| Local indexes or handoffs | 8 | Rebuild or retain according to their owner; never treat as authority. |
| Other | 1 | Owner-classify before any migration. |

The twelve direct executable surfaces outside versioned DomainSpec successor
copies are recorded exactly in the machine candidate. Their presence is a
consumer inventory, not proof that every surface is currently authoritative.

## Target-path decision

The current evidence supports three distinct choices; none is selected here:

1. keep the legacy package authoritative and add a private Craft compatibility
   facade;
2. adopt the already materialized
   `cyberAlchemy-v2/implementation/domainspec-v2` package as an intermediate
   successor, preserving the old product name in the physical path;
3. create a Craft-named successor root with an exact compatibility adapter and
   a newly reviewed authority switch.

The Craft identity decision says the product is the same product renamed, but
physical and authority migration remain pending. The Product/architecture owner
must select one immutable target before implementation. The prior MIG-B route
cannot be stretched into a Craft-named relocation.

## D65 migration sequence

1. **P0 — freeze.** Resolve active writers and freeze an exact source package,
   consumer manifest, inventory digest, and migration epoch.
2. **P1 — definitions and capability.** Accept the Craft/DomainSpec lineage and
   adopt the Product Capability that owns deterministic compilation and
   migration safety.
3. **P2 — business ontology.** Admit the compiler, source epoch, consumer,
   generated projection, compatibility adapter, binding, and authority-switch
   records with selector-level dependencies.
4. **P3 — authored source.** Select the exact DomainSpec profile/source for the
   compiler capability; do not infer it from copied TypeScript.
5. **P4 — deterministic compilation.** Run two isolated builds from the frozen
   source and selected successor and compare graph, source manifest, human view,
   build receipt, and system ontology bytes or an owner-approved semantic
   equivalence rule.
6. **P5 — exact binding.** Create a new `ConstructionBinding` epoch naming the
   selected source, compiler, views, generated graph, system ontology, and one
   owner-accepted implementation baseline.
7. **P6 — consumer rebind.** Rebind one explicitly owned executable consumer at
   a time, regenerate derived outputs, and retain a tested compatibility path.
8. **P7 — conformance.** Obtain independent positive, negative-mutation,
   stale-source, missing-target, ambiguity, and no-private-to-public-leak
   evidence.
9. **P8 — adoption.** Ask the owner to admit the exact successor baseline and
   separately switch authority. Old-root retirement is a later destructive gate
   allowed only after the live-consumer denominator is zero.

Every dependent stage is `not_evaluable` until its predecessor is admitted. A
copied package, passing schema, focused build, or refreshed digest cannot advance
the sequence.

## Required owner decisions

- Product/architecture owner: select the immutable target-path option.
- DomainSpec/Craft compiler owner: freeze the complete eight-file compiler
  package and its public API.
- Consumer owners: classify the twelve direct executable surfaces and approve
  their individual rebind order.
- Business-ontology owner: admit the capability-local dependency model.
- ConstructionBinding owner: select one new binding epoch without editing the
  legacy evidence in place.
- Independent conformance owner: review determinism, negative mutants,
  compatibility, and non-leak evidence.
- Authority owner: admit the baseline and switch authority as separate acts.

## Integration with the continuous Goal

This epoch is the concrete path-debt slice of `W7`, but its construction claims
must still traverse `W1 -> W2 -> W3 -> W5 -> W6`. It does not delay the primary
approval-gated `CGC-G22` review; while that approval remains open, the next safe
read-only downroute is `ARC-SWU-05`, the public/private non-leak audit design.

## Claim ceiling

This design classifies the current compiler lineage and specifies a future
migration epoch. It does not select a target path, freeze the dirty source tree,
adopt a Product Capability, admit an ontology or DomainSpec source, validate or
admit the V11 candidate, create or replace a `ConstructionBinding`, rebind a
consumer, switch authority, retire the legacy path, mutate Arcanum, publish,
release, deploy, or prove the Goal achieved.
