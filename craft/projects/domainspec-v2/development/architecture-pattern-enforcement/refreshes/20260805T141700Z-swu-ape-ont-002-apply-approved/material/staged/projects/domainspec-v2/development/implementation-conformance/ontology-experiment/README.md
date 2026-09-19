# Architecture Property Ontology Experiment

Status: corrected candidate experiment; non-authoritative

Date: 2026-07-31

New to ontologies? Start with [A Beginner's Guide to the Architecture
Ontology](BEGINNER-GUIDE.md). It explains the model through one concrete Rule,
shows how to navigate the canvas, and separates canonical meaning, candidate
architecture, observed evidence, and enforcement.

## Purpose

Test whether the implementation-conformance package can load an ontology and
use it to understand an architecture's properties.

In this model, the ontology answers:

1. Which DomainSpec meta-types exist, and which are active, candidate,
   deferred, or superseded?
2. Which active meta-types have candidate architecture realizations, profile
   coverage without a realization, or explicit unsupported status?
3. What kind of architecture element is this?
4. Which properties and relations are valid for that kind?
5. Which constraints does the selected architecture profile place on them?
6. How does TypeScript, Python, or Rust project source into those properties?
7. Which expected and observed values disagree?

This supersedes the first version of the experiment, which centered the
business/system evidence bridge. That was a useful boundary analysis, but it
was not the ontology-driven architecture model requested.

## Execution Model

```text
canonical DS-D1 registry
  24 staged meta-types + superseded Saga tombstone
          |
          v
non-authoritative meta-type projection
  explicit coverage + reciprocal candidate alignments
          |
          v
architecture ontology
  concept types + property definitions + relation definitions + operators
          |
          v
architecture profile
  portable constraints + language-specific constraints
          |
          v
language projection
  code/AST/module graph -> observed typed property graph
          |
          v
constraint evaluator
  expected property vs observed property -> explainable finding
```

The evaluator does not hardcode “Rule files use arrows” as package logic. It
loads that assertion from the selected TypeScript profile:

```json
{
  "applies_to": ["architecture.RuleImplementation"],
  "property_id": "callable.form",
  "operator": "equals",
  "expected": "arrow-function"
}
```

Python instead expects `function-definition`; Rust expects `function-item`.
The portable profile knows only that a Rule has one exact binding, one primary
callable, and boolean return semantics.

## Artifacts

| Artifact | Purpose |
| --- | --- |
| [BEGINNER-GUIDE.md](BEGINNER-GUIDE.md) | Detailed plain-language source: end-to-end Rule example, canvas tour, authority boundaries, FAQs, and safe extension path. |
| [BEGINNER-GUIDE.html](BEGINNER-GUIDE.html) | Dependency-free browser reader that renders the beginner guide beside the interactive canvas. |
| [architecture-ontology-view.html](architecture-ontology-view.html) | Meaning-first pan/zoom canvas with click-open Explore and Details drawers for canonical meta-types, architecture types, profiles, observed facts, and findings. |
| [domain-meta-types.projection.json](domain-meta-types.projection.json) | Digest-bound, non-authoritative DS-D1 inventory and explicit implementation-coverage projection. |
| [ontology.json](ontology.json) | Architecture types, 17 property definitions, relations, operators, and language projections. |
| [ONTOLOGY-MAP.md](ONTOLOGY-MAP.md) | Human-readable architecture meta-model. |
| [PROPERTY-EVALUATION-MODEL.md](PROPERTY-EVALUATION-MODEL.md) | How the package queries and evaluates ontology properties. |
| [profiles/base-domain.profile.json](profiles/base-domain.profile.json) | Portable constraints shared by all languages. |
| [profiles/typescript-strict.profile.json](profiles/typescript-strict.profile.json) | TypeScript placement, export, arrow, and direct-edge properties. |
| [profiles/python-strict.profile.json](profiles/python-strict.profile.json) | Python module, callable, naming, and direct-edge properties. |
| [profiles/rust-strict.profile.json](profiles/rust-strict.profile.json) | Rust module, callable, visibility, and direct-edge properties. |
| [examples/typescript-observed-facts.json](examples/typescript-observed-facts.json) | Example fact graph containing conforming and violating architecture elements. |
| [examples/typescript-evaluation.expected.json](examples/typescript-evaluation.expected.json) | Expected deterministic findings. |
| [validate-ontology.mjs](validate-ontology.mjs) | Dependency-free ontology validator and sample evaluator. |
| [TRACEABILITY-AND-DRIFT.md](TRACEABILITY-AND-DRIFT.md) | Remaining design blind spots. |
| [VALIDATION-REPORT.md](VALIDATION-REPORT.md) | Executed test receipt. |

## Demonstrated Result

The evaluator loaded the composed TypeScript profile, evaluated 12 constraints
as 30 assertions, and produced exactly eight expected findings for the broken
`LegacyLimitRule` and its non-direct dependency. The conforming Rule and
Operation passed their applicable assertions.

The meta-type projection also preserves all 24 staged DS-D1 labels and the
superseded Saga tombstone. Every one of the 13 active backend types has an
explicit coverage disposition: five reciprocal candidate alignments, two
profiled-but-unmapped types, and six explicitly unsupported types. Candidate
and deferred UI labels remain visible without becoming active or supported.

This is an executable ontology test over supplied facts. It is not yet a
source-code adapter: the example observed graph is hand-authored. The next
implementation step is a TypeScript adapter that extracts the same fact shape
from real AST and module-resolution evidence.
