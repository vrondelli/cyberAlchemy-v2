# Bounded assurance report template

## 1. Decision summary

- Property and version:
- Implementation digest:
- Result: counterexample / no counterexample within bounds / inconclusive /
  conflicting evidence
- Repair status: not applicable / proposed / verified within bounds / rejected
- Author/reviewer relationship:
- Intended decision and claim ceiling:

## 2. Property and authority

State the owner-approved rule, its meaning source, its observable success and
failure conditions, and every excluded interpretation. Identify who may approve
meaning, repair, product admission and deployment.

## 3. Frozen implementation and bounds

List exact source, binary, toolchain, environment, command, case, state,
resource and model-checking identities. State why the denominator is complete
for the declared attempt and where coverage ends.

## 4. Evidence-pipeline controls

Report denominator, oracle, provenance, raw-evidence and execution controls.
For each, state the introduced fault and the observed non-pass. Record any
survivor or unevaluable control as a limitation or blocker.

## 5. Subject result

Derive the typed result from raw observations. Include counterexample input and
trace when present. A no-counterexample result must say “within the declared
bounds” and must not be described as proof of the general property.

## 6. Defect explanation

For a confirmed counterexample, describe the violated property, causal defect,
affected implementation boundary, observed consequence and alternative
explanations rejected by evidence. Separate product defects from test or
evidence-pipeline defects.

## 7. Repair and retest

Identify the exact patch, why it addresses the cause, and every changed file.
Report the original counterexample replay, complete regression denominator,
neutral controls, mutation controls, source stability and any new failures.

## 8. Independent replay

Name the reviewer, access timing, environment, fresh commands and reconstructed
result. State AGREE, DISAGREE or INCONCLUSIVE. Preserve corrections and disclose
shared-host, shared-tool or prior-evidence limitations.

## 9. Residual risk

List unevaluated inputs, states, concurrency, integrations, environments,
compilers, deployment conditions and assumptions. State what evidence would be
required to narrow each residual risk.

## 10. Evidence index

Link the signed or digest-bound manifest, raw logs, normalized results, repair,
retest, reviewer report and data-destruction record.

## 11. Open Questions

List unresolved semantic, technical, independence, legal and operational
questions with an owner and required decision date.

