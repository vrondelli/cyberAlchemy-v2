# Governed local definitions — no promotion

## DNG-compatible ordered encoder adapter (local proposal)

- **Status:** `future-work`, local-only; not a canonical definition or runtime contract.
- **Formal shape:** `A: (R, P, S) -> (G^t0, O^[t1:tK], X, Y)`, where `R` is a
  frozen record set, `P` a declared projection/order policy, `S` provenance and
  split metadata, `X` model tensors, and `Y` task labels.
- **Meaning:** an adapter can create a DNG-like event stream only when every
  event means a declared computational/projection stage. It does not create or
  endorse semantic relations.
- **Intuition:** the adapter is a customs checkpoint: data can enter only with
  schema, provenance, and a stated reason for each ordering decision.
- **Anti-misuse:** do not set timestamps equal to “more abstract concepts,” do
  not convert a candidate edge into a label without review, and do not let
  authority status serve as a hidden predictive feature.

## Representation symmetry contract (local proposal)

- **Status:** `future-work`, local-only.
- **Formal shape:** name a group `Gamma`, its action on input tensors/events,
  expected action on outputs, and transformations that are invalid rather than
  symmetric.
- **Meaning:** a DNG-style equivariance argument is meaningful only after
  `Gamma` is written for the target representation.
- **Intuition:** shuffling anonymous hidden neurons is unlike shuffling stable
  references whose identifiers and endpoints have contractual meaning.
- **Anti-misuse:** never use “GNNs are permutation equivariant” to erase edge
  direction, predicate type, provenance, source order, or record identity.

## Evidence-bound ontology evaluation target (local proposal)

- **Status:** `future-work`, local-only.
- **Formal shape:** `E = (task, gold, split, metric, baselines, controls,
  review, authority_effect:none)`.
- **Meaning:** any learned score can at most be a candidate/proposal until a
  named review path handles it.
- **Intuition:** model output is a testable instrument reading, not an ontology
  mutation.
- **Anti-misuse:** accuracy/Kendall tau from weight-space studies is not an
  ontology quality metric.
