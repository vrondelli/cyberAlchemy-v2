# Canonical-Current Manifest Design

Status: planning candidate  
Work item: `ARC-SWU-06` under `CGC-G20`  
Selected route: `CA2-ROUTE-PLAN`  
Authority effect: none

## Product purpose

Craft cannot provide a trustworthy DomainSpec-governed construction chain while
agents can mistake a directory named `current-candidate`, the largest numbered
candidate, or a passing focused check for the Product's current source. The
Product Thesis requires intent to remain connected to reality through exact
evidence. This control makes that connection inspectable without letting a
manifest choose Product meaning or authority.

The current-pointer problem is distinct from Arcanum technical debt. It is
DomainSpec-to-Craft lineage and migration-evidence debt. Public Arcanum neither
created nor owns the selected migration epoch, the private candidates, or the
future Craft Definition Snapshot.

## Five meanings that must not collapse

1. **Authority-current** means an owner decision still assigns a role to a
   path. It does not say that every byte beneath the path is frozen or valid.
2. **Worktree-current** means a complete declared denominator matches the live
   worktree at one captured revision. A partial digest check cannot prove it.
3. **Latest-produced** means only that an artifact has the latest recorded
   production timestamp in one series.
4. **Historical-exact** means a frozen manifest still matches every declared
   output byte and contains no unaccounted member in its exact root.
5. **Canonical-current** means an owner-selected immutable artifact satisfies
   exact source, identity, predecessor, admission, and consumer-closure
   requirements for one declared role.

No state implies another. In particular, a path containing the word `current`
is not a selector.

## Current result

The only safe current statements are:

- The migration decision still names `projects/domainspec-v2` as the active
  source until a separate authority switch. That is an authority-role fact,
  not an exact-byte currentness claim.
- `CAV2-CRAFT-MIG-B-ORDER-001` revision 2 is the current planning control for
  migration structure. Its validator passes, its authority effect is none, and
  it explicitly forbids numbered candidates as the migration control loop.
- `BASELINE-V11-CANDIDATE-V9-MANIFEST.json` is the latest numbered candidate
  evidence only. It is unvalidated, unadmitted, and forbidden as a migration
  source.
- `cyberAlchemy-v2/craft` does not exist. The planned Craft Definition Snapshot
  therefore does not exist.
- No exact content artifact is currently eligible for a `canonical-current`
  selector in the first Craft vertical.

## Complete source-currentness check

The captured source manifest declares 10,956 entries at
`2026-08-31T02:01:05Z`. A fresh check against the same rule—Git tracked plus
non-ignored untracked files—found 11,063 current entries:

| Result | Count |
|---|---:|
| Manifest entries whose bytes remain equal | 10,916 |
| Declared entries whose bytes changed | 36 |
| New current entries absent from the manifest | 111 |
| Declared files removed | 0 |
| Previously missing files that appeared | 0 |

`build-inventory.mjs --check` reports generated-file drift. The existing
preparation validator still passes because it checks six selected source
digests, not the full inventory denominator. Its PASS remains useful and
bounded; it cannot establish source-currentness.

## Versioned-epoch integrity

The bounded discovery surface contains 24,560 files across 58 roots in the
families `source-snapshot`, `imported-source`, `rebound-candidate`,
`current-candidate`, and `current-candidate-v2` through `-v9`.

The internal canonical digest of every MIG-B stage manifest still reproduces.
The output bytes do not:

- materialization: 63 of 2,416 declared targets differ;
- rebound: 63 of 2,416 declared targets differ;
- each numbered candidate V1 through V9: 63 declared targets differ;
- the repeated distribution is implementation 44, architecture 3, authority
  4, research 12, product 0, ontology 0;
- V8 additionally contains 92 unmanifested `impl/cli/dist/**` build outputs.

For representative paths, the worktree and committed Git blob agree while the
stage manifest differs. This is committed manifest-to-output drift, not merely
an uncommitted writer. The old manifests remain valid evidence of what they
claimed; their current materialized trees no longer prove those claims.

No historical manifest or tree may be silently refreshed. The repair route is
append-only: preserve the old manifest, record the exact observed postimage,
identify the producing transition or classify it as unknown, and create a new
epoch only after owner review.

## Selector contract

A future `canonical-current` selector must bind:

- one Product and Project identity;
- one exact semantic role;
- one owner decision and immutable decision digest;
- one artifact ID, path, complete member denominator, and content digest;
- its admitted D65 predecessor chain;
- its supersedes/superseded-by relation without rewriting history;
- one independent consumer that rejects missing, stale, ambiguous, latest-only,
  candidate-only, and name-only resolution;
- a challenge and recomposition route.

When zero or more than one eligible artifact exists, resolution returns
`NOT_EVALUABLE`; it never chooses the highest version number.

## D65 integration

This manifest does not add a construction stage. It protects the identities
already required by D65:

1. restore append-only traceability for the drifted historical epochs;
2. accept the canonical definitions through their owner route;
3. freeze and owner-select one exact Craft Definition Snapshot;
4. bind the Product Capability, business ontology, DomainSpec source, compiled
   graph, system ontology, implementation, and conformance to that selected
   identity in order;
5. prove one independent consumer resolves only the exact selected artifact.

Until steps 1–3 close, Product Capability and DomainSpec source successors stay
blocked or `not_evaluable`. The current Python ontology runtime is irrelevant to
this selection and cannot grant admission.

## Owner-routed gaps

- `CGC-G33`: migration-evidence owners must restore append-only exact traceability
  for materialization, rebound, V1–V9, and the V8 extra-output residue.
- `CGC-G34`: definitions, Craft Product/Project, and DomainSpec owners must freeze
  and select one immutable Craft Definition Snapshot after canonical definitions
  are accepted.
- `CGC-G35`: an independent consumer must prove fail-closed resolution of the
  selected identity after an exact implementation baseline exists.

## Claim ceiling

This design identifies the current migration-control plan, proves that the full
source snapshot and all numbered MIG-B output epochs are not exact-current, and
defines the future selector contract. It does not rewrite evidence, select or
admit a Definition Snapshot, adopt a Product Capability, admit ontology or
DomainSpec source, validate V9, create a ConstructionBinding, switch authority,
implement a resolver, publish, release, deploy, or prove the Goal achieved.
