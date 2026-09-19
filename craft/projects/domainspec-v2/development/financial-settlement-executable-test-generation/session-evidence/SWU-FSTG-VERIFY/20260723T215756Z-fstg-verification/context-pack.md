# SWU-FSTG-VERIFY Context Pack

- Mode: standard, strict
- Coverage: 7/7 obligations
- Authority: private, internal, owner `projects/domainspec-v2`

## Controlling Constraints

This is a closure-only verification unit. The expected-red meta-harness must
observe exactly 52 generated structural cases, 51 passing cases, and only
`edge-instance-conformance@1::financial-settlement.edge.007.maps` failing.
The raw generated suite is therefore intentionally red; the verifier is green
only for that exact result.

Complete-profile BTE verification, the full engine regression suite, a targeted
TypeScript check, generated report parsing, and scoped whitespace checks must
all pass. Structural counts remain separate from the behavioral report of 79
total obligations, 12 assertions, one property, and 67 gaps.

No source correction, public Arcanum mutation, release, promotion, or production
change is authorized by this session.

## Mutation Boundary

No implementation mutation is expected. Tests or scripts may be repaired only
if a newly observed failure is BTE-owned and remains inside the declared work
scope. Any source-owned red remains residue.
