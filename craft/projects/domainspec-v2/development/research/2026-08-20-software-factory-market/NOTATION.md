# Notation Bridge

Status: `closed-local-research`

This study uses no mathematical notation that requires a formal derivation. Its
important notation is evidential: labels and inequalities prevent unlike product
events from being treated as equivalent proof.

## Claim Labels

| Label | Meaning in this tower |
| --- | --- |
| `[current]` | Bound to the 2026-08-20 local bytes and selectors listed in `findings.md`. |
| `[documented]` | Stated in an inspected official provider source; the product was not executed. |
| `[vendor-reported]` | Provider-owned telemetry, claim, or survey; not independent market share or causal evidence. |
| `[independently observed]` | Evidence independent of the compared product provider, with its sampling limits preserved. |
| `[inferred]` | A synthesis constrained by cited evidence, not a source statement. |
| `[proposed]` | A bounded route or experiment with no implementation authority. |
| `[blocked]` | An explicit local blocker or reviewer KILL applies. |
| `[unknown]` | Not established by the inspected corpus; never evidence of absence. |

## Non-Equivalence Chain

```text
session completed
  != tests green
  != pull request merged
  != semantic conformance
  != owner acceptance
  != lifecycle closure
  != promotion authorized
```

Each transition needs its own owner and evidence. A provider lifecycle event may
be useful input to a governed receipt, but it is not automatically the receipt or
the authority decision.

## Final Operating-Model Symbols

The audited findings normalize the final operating model as:

```text
A = typed DomainSpec kernel
B = replaceable Arcanum execution projection
C = later non-authoritative product facade
D = integrated autonomous v2 controller (blocked)

recommended composition = A + B + later C
```

The initial hypothesis table in `TOWER.md` used different branch letters. Its
explicit normalization map preserves the hypotheses without pretending that the
letters themselves were stable concepts.

## Decision Verbs

- `GO`: a bounded current capability or experiment is supported at its stated ceiling.
- `DEFER`: the candidate has a named owner but lacks a required witness or gate.
- `KILL`: the present claim has no non-vacuous witness or collapses a definition/owner.
- `BLOCK`: do not adopt the architecture in the current design.

None of these verbs is implementation, promotion, publication, or release
authorization.
