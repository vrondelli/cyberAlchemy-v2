# CyberAlchemy v2 Language Runtime System Ontology

Status: private candidate; not implemented; authority effect none.

This package translates the Language Runtime product-ontology candidates into a typed
DomainSpec-v2 system graph. Its stable identity is `cav2.language-runtime.system.v1` and its selected
ontology type is `system-runtime`.

The CyberAlchemy v2 Language Project owner owns this package. The separate system-design and
implementation owner remains unresolved; creating this candidate does not select that owner.

The product bridge explains **why** the runtime should exist and what it must preserve. This package
explains **what system meanings and relationships would have to exist** for the first runtime slice.
Neither package is source code or an accepted Runtime Contract.

## Three layers kept separate

```text
business/product meaning
  cyberAlchemy-v2/language/runtime/ontology/
            |
            | candidate product-to-system mappings
            v
typed system meaning
  cyberAlchemy-v2/language/runtime/system-ontology/
            |
            | future accepted Runtime Contract and implementation bindings
            v
code, tests, observations, and EVF evidence
  not created by this package
```

The bridge uses `formalized_by`, `constrained_by`, and `supports_candidate`. It deliberately does not use
`implemented_by`, `realized_by`, `conforms_to`, or `equivalent_to`.

## DomainSpec-v2 use

Every node uses an active backend DS-D1 kind and the exact candidate formation shape:

- structural: Entity, Value Object, Enum;
- behavioral: Operation, Query, Calculation, Rule, Workflow;
- connective: Event, Interface, Mapping;
- lifecycle: State Machine.

Every graph edge is checked against the exact current DS-D8 relationship registry, including endpoint
kinds and same-feature scope. The graph does not invent a `Component` type for the kernel and does not use
the still-candidate DomainSpec UI types.

`complete-backend-criteria@2` and its formation projection remain candidates. DomainSpec compiler
conformance is `not_evaluable` and release admission is `not-granted`.

## System model

The pure core is:

```text
EvaluateSessionTransition : LanguageSessionState x LanguageSessionCommand
                         -> Rejected
                          | NextState x (LanguageQuestionView | NoActiveQuestion)
```

The graph separates that calculation from effects:

- `LanguageSession` owns identity-bearing Questions, Answers, Commands, and Definition Pack Candidates;
- `LanguageSessionState`, `LanguageQuestionView`, preview, review binding, revision, and authority envelope
  are equality-by-fields values;
- `OpenLanguageQuestion`, `RecordLanguageAnswer`, and `ChangeQuestionDisposition` represent explicit state
  changes;
- `PersistSessionTransition` owns the bounded one-process, one-writer compare-and-replace edge;
- `BuildCandidatePreview` is pure;
- `ReviewCandidatePreview` records exact review;
- `MaterializeDefinitionPackCandidate` is guarded by exact review and required-concept visibility;
- repository and kernel interfaces remain internal and transport-neutral;
- past-fact events feed the candidate Session lifecycle.

The first persistence frame is local validated JSON with one process and one writer. It makes no claim
about crash, power-loss, filesystem, hardware, database, distributed, or concurrent-writer durability.
It also leaves retention, redaction, deletion, source allowlisting, and privacy behavior unresolved.
Before chat integration, the Runtime Contract must preserve provenance and distinguish explicit answers
from inferred context; this graph does not silently choose those policies.

## Product bridge

[`product-bridge.json`](product-bridge.json) maps the product system nodes, rules, and outcomes to the
DomainSpec graph. It includes all eight subjects defined by the product package:

- Resumable Language Session Kernel;
- Language Session Command;
- Language Question View;
- Review Before Candidate Emission;
- Atomic Single-Writer Language Session Store;
- Language Runtime Contract Candidate;
- Definition Pack Candidate;
- First Language Runtime Experiment Frame.

The mapping keeps the Runtime Contract and Experiment as external owner-controlled artifacts. The graph
only identifies their candidate subjects.

## Prior Define ontology

[`reuse-map.json`](reuse-map.json) compares this graph with the broader
`cyberAlchemy-v2/define/system-ontology/` package. Strong and partial reuse candidates are explicit, but no
identity is reused and no equivalence is asserted. This preserves the open decision: Language Runtime may
remain Language-specific, become Define, or later be adopted by Define.

The prior package currently reports its own source-health blockers. Its graph is evidence for reuse, not a
PASS inherited by this package.

## Package files

| File | Role |
| --- | --- |
| `profile.json` | Stable candidate identity, ownership, DomainSpec binding, and claim ceiling. |
| `sources.json` | Exact product, DomainSpec, schema, and prior-system source digests. |
| `nodes.json` | DS-D1-typed system nodes and candidate formation bodies. |
| `relations.json` | DS-D8-admitted system relationships. |
| `product-bridge.json` | Product meaning to typed-system traceability. |
| `reuse-map.json` | Non-equivalent reuse analysis against the prior Define system graph. |
| `residue.json` | Owner, contract, conformance, implementation, transport, experiment, and frame limits. |
| `views/*.json` | Closed core and product-bridge projections. |
| `schemas/language-runtime-system-ontology.schema.json` | Closed agent-input and package record shapes. |
| `scripts/validate.py` | Deterministic schema, source, DS-D1, DS-D8, closure, bridge, reuse, and ceiling checks. |
| `tests/test_negative_mutations.py` | Hostile mutations that must fail closed before a receipt is trusted. |
| `receipts/` | Append-only validation results; not ontology state. |

## Validate

From the repository root:

```text
python3 cyberAlchemy-v2/language/runtime/system-ontology/scripts/validate.py
```

Run the fail-closed mutation suite:

```text
python3 cyberAlchemy-v2/language/runtime/system-ontology/tests/test_negative_mutations.py
```

After a current receipt exists:

```text
python3 cyberAlchemy-v2/language/runtime/system-ontology/scripts/validate.py --require-receipt
```

## Claim ceiling

A passing package validation supports only a private, source-current, structurally typed candidate and its
traceability projection. It does not establish canonical definitions, an accepted Runtime Contract,
DomainSpec compiler/runtime conformance, implementation, working persistence, restart continuity, CLI/chat
synchronization, an accepted Definition Pack, an experiment result, execution, publication, release,
deployment, or any external effect.
