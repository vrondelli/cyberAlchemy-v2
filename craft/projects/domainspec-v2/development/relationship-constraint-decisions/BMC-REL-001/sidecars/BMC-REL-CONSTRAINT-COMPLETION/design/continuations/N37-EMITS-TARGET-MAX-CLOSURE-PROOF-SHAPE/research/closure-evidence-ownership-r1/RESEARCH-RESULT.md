# N37 closure-evidence ownership research result

## Outcome Brief

The repository contains the right architectural separation, but no admitted end-to-end producer for the N37 evidence envelope. The result is `blocked-no-admitted-closure-evidence-producer`; it is not a Decision Gate and does not form N38.

The layered case is:

1. DomainSpec owns the meaning of the N37 proof contract.
2. A consuming project owns the declared eligible Entity/Event population and placement facts.
3. The minted-project compiler can own generated graph/source-manifest provenance.
4. A relationship evaluator must own the `emits.target_max=1` verdict and receipt.
5. Items 3 and 4 are not currently admitted together for `emits`, and the required directional-closure attestation is absent.

## Why the existing compiler is insufficient

The `complete-backend-criteria` profile includes `emits`, but is candidate-only with `release_admission: not-granted`. The active experimental profile omits `emits`. The compiler's `assertDeclaredMultiplicity` enforces only registry signatures with `multiplicity === one_to_one`; canonical `emits` is `one_to_many`, so this code cannot prove the separately selected target-side maximum of one. Inferring that maximum from the compatibility token would violate the decision boundary.

The generated source manifest binds graph identities to paths and digests. It does not assert N37's boundary kind, complete eligible Entity and Event populations/placement, complete incoming `emits` adjacency for every eligible Event, snapshot identity, or staleness rule.

## Boundary and next route

No user decision is justified yet. The smallest next work is a bounded Define/Design contract for a DomainSpec-local closure-evidence envelope and evaluator receipt, using the existing minted-project graph/source-manifest only as a non-authoritative projection precedent. That future contract must name its owner and producer, define completeness and staleness, and obtain separate admission before any packet projection or enforcement.

## Claim ceiling

This research proves only that the current repository lacks an admitted producer/evaluator for the selected N37 evidence. It does not select representation, add a packet facet, admit the candidate profile, implement an evaluator, accept or project numeric bounds, change canonical definitions, reopen D06, or authorize implementation, promotion, publication, release, deployment, or production use.
