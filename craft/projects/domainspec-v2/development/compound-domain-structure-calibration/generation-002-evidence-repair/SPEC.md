---
artifact_id: CDSC2-SPEC-v0.1
status: approved-planning-baseline
authority: development-evidence-only
parent_generation: generation:sha256:2ff6a0109e08f188388d580125ab6b185b4ff5f198300cb6bd5db0d9fe31349f
discovery_source: ../runs/SWU-CDSC-007/AUDIT.md
---

# Generation 2 Evidence Repair Specification

## Intent

Repair the two evidence gaps that forced F3 to
`INSUFFICIENT-EVIDENCE` in generation 1, then append and independently replay a
successor calibration generation. The repair tests the existing residual
rubric; it does not define or promote `Page` or any compound domain kind.

## Problem

Generation 1 established deterministic treatment of its frozen inputs but did
not observe either preregistered F3 substitution:

1. a permitted step-screen replacement preserving its interaction contract;
2. a breaking bypass of the guard result before navigation is committed.

The direct receipt validator also accepted descriptive category labels outside
the frozen schema enums. Generation-1 integration checks caught and corrected
those receipts, but a future generation needs a versioned parity preflight
instead of relying on late integration detection.

## Objective

Produce generation 2 from:

- unchanged accepted F1 and F2 receipts/results;
- one new F3 receipt backed by two isolated mutation observations;
- a schema-parity preflight that rejects enum drift before evaluation;
- one successor suite envelope whose predecessor is generation 1;
- one independent replay and authority audit.

## Experimental Boundary

The experiment runs only in a source-derived isolated harness inside this
development package. The harness models the bounded F3 coordination surface:

- step-to-screen selection and screen interaction contract;
- `guardStep`-constrained navigation commitment;
- observable selected step, rendered-screen key, guard decision, and notice.

Savvy remains read-only. A baseline-equivalence witness must match frozen source
digests and preregistered vectors before mutation results are admissible.

## Mutations

### M1 Permitted Screen Substitution

Replace the isolated step-9 screen adapter with a different implementation
that preserves the `onNext` and `onBack` interaction contract.

Admissible preserving observation:

- requested and committed step remain `9`;
- selected screen key remains `9`;
- `onNext` and `onBack` route to the same successor/predecessor decisions as
  baseline;
- guard behavior and notice remain unchanged.

Visual equality, component identity, and framework portability are not tested.

### M2 Breaking Guard Bypass

Mutate the isolated navigation commit so it writes the requested step instead
of `guardStep(...).step`.

Admissible breaking observation:

- at least one unauthenticated or premature request that baseline redirects is
  committed by the mutant;
- the baseline and mutant decisions differ on the same frozen vector;
- the changed consequence is attributed only to the bypassed guard result.

## Outcomes

The existing four fixture outcomes and three suite verdicts remain unchanged.
Generation 2 may still defer or fail. Evidence repair does not presuppose
`RESIDUAL-SUPPORTED` or `CALIBRATION-PASS`.

## Acceptance Criteria

| ID | Criterion |
| --- | --- |
| `AC-CDSC2-01` | Generation-1 receipts, results, index entry, and audit remain byte-unchanged. |
| `AC-CDSC2-02` | Savvy and GoldenQuill have no task-caused diff. |
| `AC-CDSC2-03` | The versioned preflight rejects every explanation kind and observable class outside the frozen schema enums. |
| `AC-CDSC2-04` | The harness manifest pins all source selectors, digests, vectors, mutation IDs, and observable fields before mutation execution. |
| `AC-CDSC2-05` | Baseline equivalence passes before either mutation observation is admitted. |
| `AC-CDSC2-06` | M1 records supported, refuted, or indeterminate evidence without coercion. |
| `AC-CDSC2-07` | M2 records supported, refuted, or indeterminate evidence without coercion. |
| `AC-CDSC2-08` | The new F3 receipt cites immutable harness run handles and preserves all uncertainty. |
| `AC-CDSC2-09` | The successor suite envelope names generation 1 as predecessor and the generation index appends exactly one entry. |
| `AC-CDSC2-10` | Independent replay reproduces generation-2 semantic bytes and handles. |
| `AC-CDSC2-11` | No artifact claims identity, irreducibility, portability, pattern admission, replication, authority, activation, or promotion. |

## Invariants

- A harness equivalence witness proves only fidelity to the bounded modeled
  decisions.
- A preserving substitution does not establish identity or a new type.
- A breaking substitution does not establish irreducibility by itself.
- F1 and F2 evidence is reused by stable handle, not rewritten.
- Generation 1 is immutable and remains independently replayable.
- Missing, disputed, or failed fidelity evidence remains insufficient.
- Suite outcomes route research only; no branch routes canonical promotion.

## Scope

In scope: parity preflight, successor-generation support, source-derived harness,
baseline vectors, two mutation runs, F3 receipt repair, generation-2 evaluation,
append-only index update, replay, audit, and observability.

Out of scope: live Savvy mutation, browser/UI visual claims, new F1/F2 evidence,
new DS-D1 definitions, DS-D8 changes, pattern admission, cross-domain
replication, candidate promotion, and canonical publication.
