# Invoke Result: Ontology Candidate-Graph Prototype

Date: 2026-07-26
Dispatch: `dispatch.ocgp.invoke-define-design.2026-07-26`
Modes: Define + Design
Overall status: flag

## Outcome

A governed private Define and Design package now specifies the smallest
defensible prototype target:

> an ontology-oriented candidate-graph validation and inspection prototype

It uses a candidate-only JSON carrier, a closed finite policy over the four
Evidence kinds, deterministic dispositions and projections, isolated immutable
run evidence, and tested write isolation. It does not specify a canonical
ontology, admitted `specializes` meaning, promotion runtime, or production
system.

## Phase Status

| Phase | Status | Evidence |
| --- | --- | --- |
| Context | pass | `CONTEXT-PACK.md`; current Inventory synthesis selected without mutation |
| Define | pass | `define/SPEC.md` plus domain, operation, query, interface, state, event, mapping, glossary, layering, and transport contracts |
| Design denominator | pass | 13 signals, 6 authored N/A concerns, 0 unbound signals, 23 inspected selectors, receipt digest `0868886bdb29e49c230ab7e0ea55bbb1683909b3d1f51c8bcfe98e12d74cc5c2` |
| Design selection | pass | fixed point, `design-validator-pass`, result digest `016a202266bb963f8c078d449389d55307338a8125b80e9255ec59c0e15c0f9d` |
| Poker Team adjacent runtime | pass, bounded | 2 financial-settlement test files and 11 tests passed; O13 mismatch remains unresolved |
| Distill | pass-for-design | two-round Standard reduction and recomposition |
| Owner gate | open | human ontology/architecture review is required before Plan |
| Runtime | not run | no implementation or prototype command exists |

Overall status is `flag`, not `pass`, because the design owner gate remains
open. This is expected at the end of Define + Design.

## Primary Artifacts

- Define: `define/SPEC.md`
- Architecture: `design/ARCHITECTURE.md`
- Worked example: `design/EXAMPLE.md`
- UX contract: `design/UX-PLAN.md`
- Validation contracts: `design/VALIDATION-CONTRACTS.md`
- Exact scope: `design/DESIGN-SCOPE-MANIFEST.json`
- Denominator receipt: `design/DESIGN-DENOMINATOR-RECEIPT.json`
- Selection result: `design/DESIGN-SELECTION-RESULT.json`
- Distill: `design/DISTILL-VALIDATION.md`
- Design transport: `design/DESIGN-TRANSPORT.md`

## Selected Architecture Outputs

The validator required:

- baseline six-view architecture;
- authority/trust;
- state/event;
- persistence/concurrency;
- integration/versioning;
- quality/determinism;
- UX plan;
- validation contracts.

The validator rejected no signal and produced no diagnostic.

## Example Result

The concrete example uses Poker Team financial-settlement evidence:

```text
F1  O13 type mismatches remain; pipeline verdict FLAG
└─ derives-from R1  Static observability audit
   └─ derives-from D1  O13 declares two Gauge instruments

D2  Backend registers both instruments as Histogram
└─ contradicts D1
```

Expected grounding closure is exactly `F1 -> R1 -> D1`; the contradiction is
visible but non-composing, and its repair remains with Poker Team's
finance/backend observability owners. The separate candidate
`C-SPECIALIZES-D2-D1` is `policy-indeterminate` with
`POLICY_OWNER_UNBOUND` and `authority_effect: none`.

The existing settlement execution and preview tests currently pass 11/11.
That adjacent runtime evidence does not resolve the Gauge/Histogram mismatch
and does not execute the ontology prototype.

## Techniques and Distill

The route applied sequence, bounded frame handoff, concrete path evidence,
six-view x-ray, authority split, state-namespace fencing, artifact-contract
bridging, SCU/SWU reduction, recomposition proof, validation loop, receipt
handoff, and residue preservation. `design/DISTILL-VALIDATION.md` confirms that
removing graph, policy, projection, evidence, or authority separation would
make the unit insufficient.

## Layering

Future Plan should cover L0-L2 as the minimum workable unit:

1. finite evaluator and fixture bank;
2. canonical create-only run bundle and deterministic receipt;
3. denied-write capability plus protected-input digest attestation.

The static HTML inspection surface is L3. IOLM integration is a later adapter
and separate product work unit.

## Unresolved Gaps

- implementation language and package location;
- enacted prototype schemas and diagnostic registry;
- executable fixtures and validators;
- current runtime determinism and isolation evidence;
- named human report acceptance;
- owner review of this Design;
- separate semantic owner/policy for `specializes`;
- any promotion, publication, or bounded-prototype label.

## Next Route

After explicit ontology/architecture owner acceptance, the normal next route is
Invoke Plan for L0-L2 only. Task Session must not infer a work unit from this
Design.
