# N28 Six-View Architecture Bundle

Decision: `BMC-REL-NONNUMERIC-28-BELONGS-TO-CLASSIFICATION-PATH-CONSEQUENCE-BEHAVIOR`
Selection: `null`
Authority: `authority_effect: none`

## 1. Context View

N28 concerns an acyclic path of two or more canonical `belongs-to` facts that all
carry exact active D30 membership kind `classification`. It asks whether
classification consequences have only direct effects or also a non-authoritative
path-reachability consequence.

```mermaid
flowchart LR
  P[Same-kind classification path] --> G{N28 behavior gate}
  G -. A later .-> D[Direct classification consequences only]
  G -. B later .-> R[Derived classification reachability consequence]
```

## 2. High-Level Structure View

The classifier preserves the canonical direct facts and exact `classification` kind.
The consequence policy then either stops at direct facts or exposes derived
reachability as a non-authoritative semantic result. Neither route creates a
canonical edge or an untyped membership result.

`home-assignment` and mixed-kind paths remain outside this classification-only gate.

## 3. Low-Level Components View

1. `ClassificationPathClassifier` recognizes an acyclic path of length at least two
   whose every fact carries exact kind `classification`.
2. `ExactKindGuard` rejects kind collapse and routes any mixed-kind path outside N28.
3. `DirectFactBoundary` keeps canonical authorship on the direct `belongs-to` facts.
4. `ClassificationConsequencePolicy` conditionally returns direct-only consequence
   or non-authoritative derived reachability.
5. `ResidueLedger` retains home-assignment behavior, evidence completeness, naming,
   provenance, representation, and runtime behavior.

These are Design responsibilities, not authorized schema fields or implementation
components.

## 4. Workflow Process View

```mermaid
flowchart TD
  I[Receive canonical belongs-to path] --> K{Every fact is classification?}
  K -->|no| X[Outside N28]
  K -->|yes| C{Acyclic path?}
  C -->|no| X2[Outside this path-consequence gate]
  C -->|yes| G{N28 selected?}
  G -->|no| B[BLOCK]
  G -. A later .-> D[Use direct classification facts only]
  G -. B later .-> P[Expose derived classification reachability consequence]
```

## 5. Decision Flow View

- A keeps classification consequences on explicitly authored direct facts. It
  preserves D30's direct meaning and minimizes new validation obligations, but does
  not expose a first-to-last classification result across the path.
- B derives a non-authoritative classification reachability consequence over an
  acyclic exact-kind path. It gives D23's relationship-chain axis a
  classification-specific effect, but creates a new semantic layer whose
  completeness, naming, provenance, and representation remain later decisions.
- C defers and keeps classification path behavior unresolved.
- D stops without selecting classification path behavior.

Recommendation: A. D30 defines direct classification and explicitly warns against
inferring transitivity or closure; A therefore preserves the strongest exact current
evidence. D23 keeps B admissible as a deliberate owner-selected path consequence,
but does not make it the default.

## 6. Dependency Interface View

| Dependency | Input | Output | Boundary |
|---|---|---|---|
| N27 B | per-kind governance | classification-local gate | no behavior inferred |
| classification clarification | exact active kind ID | first target fixed | no N28 option selected |
| D30 | direct classifier meaning | direct semantic baseline | no inferred transitivity or closure |
| D23 | finite relationship-chain consequence vocabulary | makes B consequential and admissible | no category law or general closure |
| canonical card and packet | direct `belongs-to` authority and unresolved residue | preserves authored fact boundary | no packet or canonical mutation |
| N28 gate | A/B/defer/stop | one owner choice later | currently unselected |

Claim ceiling: this bundle defines only the classification-specific
path-consequence gate. It does not select an option, create canonical edges, decide
home-assignment or mixed-kind behavior, decide derived-result representation or
evidence completeness, accept or mutate the packet, authorize implementation,
promote, publish, or make the owner choice.
