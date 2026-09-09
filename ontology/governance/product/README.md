# Governance Business Product Ontology

Status: candidate
Visibility: private
Ontology type: business-domain
Branch: business
Authority effect: none
Enforcement effect: none

This package defines Governance as a product for turning principles, constraints,
policies, and owner decisions into explicit, scoped, challengeable, and operable
governance for work, artifacts, agents, and systems. It also covers the evidence
and owned feedback needed to understand and improve governance itself.

The product is not defined by its standalone module, a task lifecycle, the
seven-refresh case, hashing, or one future runtime. Those are architecture,
evidence, integrity, or realization concerns inside the wider product.

## Product Thesis

Governance should:

1. state what is governed and why;
2. compose applicable rules and policies without hiding conflicts;
3. make authority and owner decisions bounded and visible;
4. validate and enforce only through explicit adopted bindings;
5. preserve evidence, observation, explanation, and claim ceilings;
6. expose effectiveness, drift, friction, and missing evidence; and
7. evolve through evidence-backed proposals and responsible owner decisions.

```text
principle / axiom
    -> invariant and governance contract
    -> applicable rule or policy
    -> bounded authority and owner decision
    -> validator, gate, or enforcement binding
    -> result and evidence
    -> observation and reflection
    -> owner-governed improvement
```

This is a typed product loop, not one mandatory linear workflow. An evaluation
may stop at `not_evaluable`; a decision may defer; observation may remain
non-blocking; and a control may have validation mode `none-yet`.

## Source Basis

The model is grounded in four repository source families:

- DomainSpec v1 axioms, constitutions, attenuation rules, and the earlier
  governance product framing;
- CyberAlchemy v2 product meaning, authority kinds, promotion model, discipline
  model, and canonical definitions;
- Arcanum constitution, discipline, decision-gate, observation, reflection, and
  task-session contracts, plus current counterevidence that Governance Flow is
  disabled; and
- DomainSpec v2 meta-types for authority, axioms, invariants, definitions,
  validation, layering, and drift.

The source registry contains immutable import hashes only as provenance for this
candidate. It does not impose live byte hashing, refresh transitions, or
repository-wide enforcement.

## Current Runnable Evidence

The package now cites a candidate no-effect Rust interpreter that gives
Governance Program, Governance Request, and Governance Fact Set concrete data
representations and returns deterministic verdicts. Its tests cover invalid or
conflicting facts and demonstrate that clause order does not turn missing
authority evidence into denial.

This narrows the runtime evidence gap, but it is not an accepted system-runtime
ontology, a formal business-system bridge, a real fact verifier, an integration,
or enforcement. Exact source hashes record import provenance only; they are not
lifecycle clocks and do not require ontology refreshes whenever source bytes
change.

## Business Vocabulary

The package owns 43 business nodes across these roles:

- one product and one governed-work domain;
- five actors;
- five recurring governance problems;
- one product thesis;
- seven enduring capabilities;
- five product outputs;
- three business outcomes;
- nine business rules; and
- six product measures.

There are 11 relation types and 68 relation instances.

## Enduring Capabilities

1. **Define And Compose Governance** — express axioms, invariants, governance
   rules, policies, constitutions, disciplines, contracts, scopes, precedence,
   and conflicts.
2. **Route Authority And Decisions** — identify the responsible owner, decision
   kind, authority ceiling, admissible options, delegation, deferral, override,
   and escalation.
3. **Evaluate Governance Fitness** — test whether governance is justified,
   proportionate, coherent, applicable, observable, and executable.
4. **Validate And Enforce Applicable Governance** — bind adopted governance to
   validators, gates, or enforcement points without treating declaration as
   execution.
5. **Observe, Audit, And Explain Governance** — preserve evidence, findings,
   missing-evidence states, causal explanations, privacy boundaries, and claim
   ceilings.
6. **Evolve Governance From Evidence** — propose, review, adopt, correct, retire,
   or attenuate governance through owned decisions.
7. **Operate The Governance Portfolio** — manage coverage, ownership, versions,
   conflicts, health, and cross-capability consistency.

## Product Rules

1. **Governance Must Name Its Basis**.
2. **Authority Must Be Explicit And Bounded**.
3. **Only Adopted Applicable Governance May Enforce**.
4. **Declaration, Evaluation, Decision, And Enforcement Must Not Collapse**.
5. **Enforceable Governance Must Be Runnable**.
6. **Observation Must Remain Independent From Decision Authority**.
7. **Governance Must Serve Governed Work**.
8. **Integrity Evidence Must Not Become Semantic Authority**.
9. **Governance Evolution Requires An Owner And Evidence**.

These rules are candidate product semantics. They are not active repository
rules and confer no authority.

## Measures

The product measures governance coverage, control effectiveness, authority
legibility, governance friction, refresh churn, and governance learning.
Refresh count is one possible friction indicator; it is not the center of the
product. Hash frequency is likewise an integrity-cost signal, not governance
meaning.

## Standalone Boundary

The package is self-contained so its vocabulary can be developed and validated
without activating governance elsewhere. It links to CyberAlchemy v2 through
selector-scoped source references and authority meanings. It does not redefine
CyberAlchemy v2, DomainSpec, or Arcanum terms, and no public Arcanum bytes are
changed by this package.

## Package Files

- `profile.json` declares the business-domain ontology profile.
- `sources.json` records selector-scoped source provenance.
- `nodes.json` contains the product vocabulary.
- `relations.json` contains typed business relations.
- `residue.json` records what should remain true under stress.
- `schemas/` constrains the package shape.
- `scripts/validate.py` performs deterministic candidate-local checks.

## Validate

```bash
python3 cyberAlchemy-v2/ontology/governance/product/scripts/validate.py
```

Validation checks the candidate representation only. It does not activate a
rule, evaluate repository work, grant authority, or enforce a policy.

## Claim Ceiling

This is a candidate business product ontology. It supplies vocabulary and
traceable design evidence only. It is not adopted governance, runtime
enforcement, promotion, publication, or deployment authority.
