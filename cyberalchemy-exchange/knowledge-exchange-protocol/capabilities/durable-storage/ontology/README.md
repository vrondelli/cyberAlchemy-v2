# Durable Storage Business Ontology

Status: authored candidate  
Ontology: `CA2-ONTOLOGY-KEP-DURABLE-STORAGE`  
Type: `business-domain`  
Authority effect: none

This package models the adopted reusable Durable Storage Product Capability:

```text
encrypted material
  -> immutable durable object
  -> qualified byte identity
  -> policy-bound write observation
  -> verified retrieval or typed failure
  -> bounded evidence
```

Responsibility remains split:

```text
business ontology
  -> owns generic storage meaning and proof obligations
consumer instantiation
  -> supplies consumer semantic values and specializations
implementation binding
  -> supplies provider and runtime realization identity
```

The ontology is provider-neutral. It does not select infrastructure, accept
implicit policy defaults, claim availability beyond observations, or authorize
DomainSpec, implementation, publication, deployment, or network activity.

Run `python3 validate.py` from this directory or invoke the path from the
repository root. A PASS proves package coherence only; admission is a separate
exact-digest owner decision.
