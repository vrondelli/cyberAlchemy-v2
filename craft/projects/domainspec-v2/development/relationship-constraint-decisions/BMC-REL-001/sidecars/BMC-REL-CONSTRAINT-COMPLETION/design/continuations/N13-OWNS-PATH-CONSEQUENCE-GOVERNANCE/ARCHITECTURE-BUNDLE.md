# N13 Six-View Architecture Bundle

Decision: `BMC-REL-NONNUMERIC-13-OWNS-PATH-CONSEQUENCE-GOVERNANCE`
Selection: `null`
Authority: `authority_effect: none`

## 1. Context View

N13 concerns an acyclic path of two or more canonical `owns` edges that all carry
one admitted D29 dimension. It asks how later path behavior is governed, not what
that behavior is.

```mermaid
flowchart LR
  P[Same-dimension owns path] --> G{N13 governance gate}
  G -. A later .-> U[One future behavior gate for all dimensions]
  G -. B later .-> D[One future behavior gate per dimension]
```

## 2. High-Level Structure View

The path classifier preserves canonical direct facts, exact dimension identity, N06
acyclicity, and N07 mixed-dimension separation. A governance partition then selects
only the scope of future behavior authority. No transitive result exists yet.

## 3. Low-Level Components View

1. `DirectOwnsPath` recognizes path length at least two over distinct-position Entities.
2. `DimensionGuard` requires every edge to carry the same exact active D29 ID.
3. `PriorTopologyGuard` preserves N04 self-edge and N06 same-dimension cycle rejection.
4. `GovernancePartition` conditionally creates one later gate or dimension-local gates.
5. `ResidueLedger` retains behavior, mixed-dimension, provenance, and representation.

These are design responsibilities, not authorized fields or implementation components.

## 4. Workflow Process View

```mermaid
flowchart TD
  I[Receive canonical owns path] --> S{All edges same admitted dimension?}
  S -->|no| X[Outside N13]
  S -->|yes| C{Acyclic under N06?}
  C -->|no| R[Preserve N06 rejection]
  C -->|yes| G{N13 selected?}
  G -->|no| B[BLOCK]
  G -. A later .-> U[One future behavior gate]
  G -. B later .-> P[Per-dimension future gates]
```

## 5. Decision Flow View

- A uses one future path-consequence rule for every current and later admitted D29 dimension. It is simpler and consistent, but couples independent semantic axes.
- B governs future behavior independently per admitted dimension. It preserves D29 separation, but adds owner gates and registry-evolution work.
- C defers and keeps dependent Design blocked.
- D stops without selecting a governance partition.

Recommendation: B. D29 makes the dimensions pairwise non-overlapping, and no exact
source generalizes N05 cycle uniformity to transitivity or path consequences.

## 6. Dependency Interface View

| Dependency | Input | Output | Boundary |
|---|---|---|---|
| N12 | exact A cycle-proof threshold | preserved closure evidence | no path behavior inferred |
| D29 | exact active dimension IDs | path dimension guard | no transitivity or coupling inferred |
| D23 | finite path-consequence vocabulary | identifies consequential axis | no general closure |
| N13 gate | A/B/defer/stop | one owner choice later | currently unselected |

Claim ceiling: this bundle defines only the next governance-shape gate. It does not
select path behavior, create derived or canonical edges, accept or mutate the packet,
authorize implementation, or make the owner choice.
