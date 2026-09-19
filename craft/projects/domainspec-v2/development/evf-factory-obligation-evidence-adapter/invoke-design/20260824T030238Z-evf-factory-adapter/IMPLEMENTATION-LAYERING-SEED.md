# Implementation Layering Seed

Status: Design seed only. This is not a full Plan layering artifact.

| Layer | Decision question | Minimum evidence | Deferred |
| --- | --- | --- | --- |
| L0 contract | Can exact EVF obligation identity map to one closed factory request identity without inventing semantics? | accepted exact input/binding schema and positive/mismatch schema fixtures | provider execution |
| L1 evidence join | Can one verified factory receipt/currentness handle bind back to the same obligation and preserve the narrowest ceiling? | accepted output schema plus stale, request/lock/provider, accounting, and wider-ceiling negative fixtures | live TLC |
| L2 provider integration | Can the registered TLA/TLC provider's total verdict map through the adapter without lifecycle duplication? | provider registry/version, total taxonomy, expected-red and unknown-result fixtures, factory verify/replay evidence | corpora breadth and implementation trace |
| L3 consumer handoff | Can EVF expose one immutable bounded evidence handle to its consumer? | exact accepted EVF output handle and independent consumer receipt where required | release, deployment, production |

## Promotion rules

- L0 does not prove factory evidence consumption.
- L1 does not prove a TLA provider exists or runs.
- L2 remains bounded model evidence, not implementation conformance.
- L3 does not grant release, ontology, publication, deployment, or production authority.

## Planning gap

Normal Invoke Plan is deferred until the EVF owner accepts exact adapter schemas and negative fixtures, the factory owner accepts the verification/currentness handle, the provider owner accepts the result taxonomy mapping, and the primary owner assigns the protected roles.
