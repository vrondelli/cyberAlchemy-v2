# Property Evaluation Model

## Meaning Of “Understand The Architecture”

The enforcement package understands an architecture when it can perform these
operations without hardcoding a particular project layout:

```text
propertiesFor(type)
relationsAllowedFrom(type)
constraintsFor(profile, type)
projectionFor(language, property)
evaluate(expected, observed)
explain(finding)
```

For `architecture.RuleImplementation` under the TypeScript strict profile, the
resolved view includes inherited portable constraints plus TypeScript-specific
ones:

| Property | Expected value | Origin |
| --- | --- | --- |
| `source.primary_concept_count` | `1` | portable profile |
| `binding.concept_id` | present | portable profile |
| `binding.current` | `true` | portable profile |
| `symbol.primary_callable_count` | `1` | portable profile |
| `callable.helper_policy` | one admitted policy | portable profile |
| `callable.return_semantics` | `boolean` | portable Rule property |
| `source.path` | `src/domain/rules/<kebab>.ts` | TypeScript profile |
| `source.filename_case` | `kebab-case` | TypeScript profile |
| `symbol.public_callable_count` | `1` | TypeScript profile |
| `callable.form` | `arrow-function` | TypeScript profile |

## Profile Composition

The three language profiles extend `architecture.base-domain`:

```text
architecture.base-domain
├── architecture.typescript-strict
├── architecture.python-strict
└── architecture.rust-strict
```

The shared profile declares portable architecture properties. Child profiles
declare only language realizations:

| Property | TypeScript | Python | Rust |
| --- | --- | --- | --- |
| Rule filename | kebab-case `.ts` | snake_case `.py` | snake_case `.rs` |
| Rule callable form | arrow function | function definition | function item |
| public/exported primary callable | exactly one | exactly one public-by-profile callable | exactly one public item |
| Operation -> Rule dependency | direct leaf | direct leaf | direct leaf |

This exposes that `arrow-only` is not an ontology truth about Rule. It is one
constraint in one architecture profile.

## Observation Contract

A language adapter emits an `ObservationProjection` containing typed elements
and relations. For example:

```json
{
  "element_id": "implementation.payment.MaxAmountRule",
  "type": "architecture.RuleImplementation",
  "properties": {
    "source.path": "src/domain/rules/max-amount-rule.ts",
    "binding.concept_id": "payment.MaxAmountRule",
    "symbol.public_callable_count": 1,
    "callable.form": "arrow-function"
  }
}
```

Adapters may emit only properties defined by the ontology and applicable to
the element or relation type. Unknown or indeterminate constructs must become
typed `unsupported` evidence in the future product contract; they must not be
invented as passing property values.

## Evaluation Contract

The current prototype supports four generic operators:

- `required`;
- `equals`;
- `matches` for string/regex properties;
- `one_of` for enumerated profile choices.

The evaluator resolves profile inheritance, finds all matching nodes or
relations by type inheritance, and emits a finding with:

- constraint ID;
- subject ID;
- property ID;
- expected value;
- observed value;
- severity.

The broken TypeScript sample intentionally violates eight expectations,
including source placement, exact binding, export cardinality, arrow-only form,
and direct dependency resolution. The expected findings are checked byte for
byte by `validate-ontology.mjs`.

## Future Engine Boundary

```text
OntologyRegistry
  load concept/property/relation definitions

ProfileResolver
  compose portable + language + project profiles

LanguageProjectionAdapter
  extract digest-bound observed facts from source/tool evidence

ConstraintEvaluator
  compare typed expected and observed values

FindingExplainer
  retain property semantics, origin profile, raw evidence ref, and owner route
```

The core evaluator can remain language-independent. Only the projection
adapters should understand TypeScript AST, Python AST/import behavior, or Rust
module/compiler semantics.
