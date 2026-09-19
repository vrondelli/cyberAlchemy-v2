# DomainSpec Methodology Profile

Status: active
Version: 0.1.0
Owner: mars-research-scientist

This profile is the canonical methodology contract for DomainSpec research.

## Method Stack

| Layer | Method | Role in DomainSpec Research |
|---|---|---|
| Empirical design | Wohlin et al. (2012) | experiment protocol structure and validity discipline |
| Measurement framing | GQM (Basili) | map goals -> questions -> metrics for each claim |
| Case-study triangulation | Runeson and Host | cross-experiment convergence and divergence handling |
| Evidence interpretation | structured claim adjudication rubric | convert results into claim status updates |

## Tier Policy

| Tier | Mandatory Analysis | Optional Analysis | Typical Use |
|---|---|---|---|
| foundation | integrity, descriptive stats, success criteria, claim adjudication | subgroup, sensitivity, triangulation, deep threat analysis | early directional validation |
| full | all ten analysis steps | none | publication-critical and high-impact claims |

Tier selection rule:
- Use `full` for experiments that directly affect publication claim status or introduce ontology/governance changes.
- Use `foundation` only when the expected outcome is directional and no immediate claim-status upgrade is planned.

## Statistical and Adjudication Defaults

- Proportion estimates: Wilson 95% confidence interval.
- Mean comparisons (small N): bootstrap confidence intervals with explicit sample assumptions.
- Determinism checks: exact match + agreement metric (for example Jaccard or kappa, depending on unit).
- Effect reporting: always include observed value, threshold, effect size, and confidence interval when applicable.

Claim evidence ratings:
- strong
- moderate
- weak
- insufficient
- contradicted

Status labels:
- supported
- partially supported
- insufficient evidence
- contradicted

## Validity Threat Policy

Every completed run must explicitly discuss all four categories:
- internal validity
- external validity
- construct validity
- conclusion validity

A run cannot upgrade claim strength if threat assessment is missing or unresolved for critical risks.

## Reproducibility Contract

Each run row must include at least:
- experiment_id
- run_id
- timestamp
- model
- model_temperature
- system_prompt_hash
- domainspec_version
- operator

Additional experiment-specific fields are allowed, but canonical metadata is required for all runs.

## Protocol Coupling Rules

- Every experiment protocol must reference this methodology profile.
- Any deviation from this profile must be documented in the protocol under a "Method Deviation" section.
- Deviations require explicit rationale, impact assessment, and approval before execution.

## Gate Coupling

- G1 is blocked when methodology profile linkage is missing.
- G4 is blocked when reproducibility metadata is incomplete.

## Related Artifacts

- `protocols/DOMAINSPEC-PROTOCOL-CHECKLIST.md`
- `results/DOMAINSPEC-EVIDENCE-STATUS.md`
- `claims/CLAIMS.md`
