# A Beginner's Guide to the Architecture Ontology

Status: explanatory companion to a corrected candidate experiment; non-authoritative

Date: 2026-07-31

## The Short Version

Imagine that a software repository is a building.

- DomainSpec says what kinds of rooms the building needs and what each room
  means: a Rule, Operation, Query, Interface, State Machine, and so on.
- The architecture ontology describes the construction details we can inspect:
  where a realization lives, what it exports, what callable form it uses, and
  which other realization it depends on.
- An architecture profile is the local building code. A TypeScript profile can
  require an arrow function without pretending that every Rule in every
  language must be an arrow function.
- A language adapter is the inspector. It reads source code and reports typed
  observations.
- The evaluator compares the building code with the inspection report and
  produces findings.

The ontology is the shared vocabulary that makes those steps agree about what
they are talking about. It is not the source-code parser, linter, or final
authority by itself.

## Why This Exists

A rule such as “put every Rule in `src/domain/rules/`” sounds simple until a
tool has to enforce it. The tool still needs answers to questions such as:

- What makes something a Rule rather than a Calculation or Policy?
- Does one file represent one domain concept or several?
- Is the folder rule portable, or only a TypeScript convention?
- Does importing through an index count as a direct dependency?
- Who decides that a source symbol realizes a particular DomainSpec concept?
- What should happen when the parser cannot understand a macro or dynamic
  import?

If each linter answers these questions independently, the architecture becomes
a collection of unrelated checks. This experiment instead represents the
meaning, observable properties, expected values, and findings as connected
data.

That lets a future implementation ask generic questions:

```text
What properties apply to this kind of architecture element?
What does the selected profile expect for those properties?
What did the language adapter observe?
Which expected and observed values disagree?
Why is that disagreement important?
```

## What “Ontology” Means Here

In this package, an ontology is an agreed, machine-readable vocabulary for:

1. the kinds of things that may exist;
2. the properties that may describe each kind;
3. the relationships that may connect them;
4. the meanings and boundaries attached to those terms.

It is closer to a precise map legend than to a database of every fact. The
legend says that a blue line means a river and a dashed line means a trail. A
particular map uses that legend to describe actual rivers and trails.

Likewise, `ontology.json` says that `source.path` is a property of an
architecture element and that `architecture.depends_on` is a directed relation.
The example observation file describes particular elements and dependencies.

### What it is not

The ontology is not:

- a claim that every concept is already implemented;
- a language parser or module resolver;
- a hardcoded TypeScript style guide;
- proof that static source shape produces correct runtime behavior;
- permission to create or promote canonical DomainSpec types;
- a release, deployment, or production-readiness verdict.

## “Type” Has Several Meanings

Much of the early confusion comes from using the word *type* for different
layers. They are related, but they are not interchangeable.

| Layer | Example | Question it answers |
| --- | --- | --- |
| Ontology Vault routing branch | `system` | Which ontology family should receive this material? |
| DomainSpec semantic meta-type | `DS-D1.7 Rule` | What does this domain concept mean? |
| Architecture concept type | `architecture.RuleImplementation` | What inspectable implementation shape may realize it? |
| Property value type | boolean, integer, enum, string | What kind of value may a property carry? |
| Observed instance | `implementation.payment.MaxAmountRule` | What did we observe in this particular repository? |

The Ontology Vault branch routes and governs the ontology package. It is not a
business or architecture node that must appear on the canvas. A DomainSpec
meta-type describes semantic intent. An architecture concept type describes an
inspectable code realization. An observed instance is evidence about one
piece of code.

Keeping those layers separate prevents a common mistake: discovering an arrow
function in source code does not, by itself, create or prove an admitted
DomainSpec Rule.

## The Five Layers of the Experiment

```text
1. Canonical meaning
   DomainSpec DS-D1 registry
            |
            v
2. Local coverage view
   digest-bound, non-authoritative meta-type projection
            |
            v
3. Inspectable architecture vocabulary
   concept types + properties + relations + operators
            |
            v
4. Expected and observed values
   selected profile + language observation projection
            |
            v
5. Explanation
   expected value compared with observed value -> finding
```

### 1. Canonical meaning

The [canonical DS-D1 registry](../../../definitions/meta-types/meta-types.yml)
owns the identity, name, criterion, and maturity of DomainSpec meta-types. Its
[human-readable cards](../../../definitions/meta-types/meta-types.md) explain
those distinctions in prose. For example, they define a Rule as a boolean
guard and distinguish it from a Calculation, which returns a value, and a
Policy, which selects a strategy.

This experiment reads that registry. It does not have authority to rewrite it.

### 2. Local coverage view

`domain-meta-types.projection.json` is a checked read model of the canonical
registry. It answers a narrower question: what does this architecture
experiment currently do with every DS-D1 label?

Every active backend meta-type receives an explicit disposition. A type may be
candidate-mapped, profiled but not mapped, or unsupported. Candidate and
deferred UI labels are retained as not admitted. The superseded Saga identifier
is retained as history.

This explicit accounting is important. “Unsupported” is honest evidence;
silently omitting a type would make the graph look more complete than it is.

### 3. Inspectable architecture vocabulary

`ontology.json` defines candidate architecture concepts such as
`RuleImplementation`, properties such as `callable.form`, and relations such
as `depends_on`.

The central hierarchy is:

```text
ArchitectureElement
├── DomainConceptImplementation
│   ├── RuleImplementation
│   ├── OperationImplementation
│   ├── QueryImplementation
│   ├── StateMachineImplementation
│   └── InterfaceImplementation
└── AdapterImplementation
```

Inheritance means that a property applicable to every
`DomainConceptImplementation` also applies to Rule, Operation, Query, State
Machine, and Interface implementations.

### 4. Expected and observed values

Profiles contain expectations. Observation projections contain facts.

For example, a TypeScript profile may expect:

```text
callable.form = arrow-function
source.path matches src/domain/rules/<kebab>.ts
symbol.public_callable_count = 1
```

An observation projection may report:

```text
callable.form = function-declaration
source.path = src/shared/legacy_rule.ts
symbol.public_callable_count = 2
```

The ontology defines what those property names and values mean. The profile
chooses the expected values. The adapter supplies the observed values.

### 5. Explanation

The evaluator applies generic operators such as `required`, `equals`,
`matches`, and `one_of`. A finding records the constraint, subject, property,
expected value, observed value, and severity.

A finding therefore means “the supplied observation disagrees with the
selected profile.” It does not automatically mean the code is semantically
wrong, unsafe at runtime, or forbidden by canonical DomainSpec authority.

## One Rule, End to End

Suppose the domain contains `payment.MaxAmountRule`.

### Step 1: establish semantic identity

An owner-resolved binding says the concept is a DomainSpec Rule. Its semantic
meaning is “a boolean guard that blocks or allows.” This identity must not be
guessed merely because a function returns `true` or `false`.

### Step 2: choose a candidate realization type

The local coverage projection aligns `DS-D1.7 Rule` with
`architecture.RuleImplementation`. The alignment is a candidate: it supports
experimentation, but it does not change canonical formation or admission.

### Step 3: resolve the profile

The selected TypeScript profile extends the portable base profile.

The portable profile expects facts that make sense across languages:

- one exact concept binding;
- one primary callable;
- boolean return semantics;
- an admitted helper policy.

The TypeScript child profile adds language-specific expectations:

- a kebab-case `.ts` path under `src/domain/rules/`;
- exactly one exported callable;
- an arrow-function primary callable.

Python expects a function definition. Rust expects a function item. Therefore
“arrow-only” is a TypeScript profile choice, not an eternal truth about Rules.

### Step 4: observe source code

A future TypeScript adapter will read the AST and module graph, then emit only
typed properties defined by the ontology. It must report unsupported or
indeterminate constructs explicitly; it must never invent a passing value.

The current example observation is hand-authored. No real source adapter has
been implemented yet.

### Step 5: evaluate and explain

The generic evaluator compares every applicable expectation with the supplied
facts. In the deliberately broken example, it reports placement, binding,
cardinality, naming, export, callable-form, and dependency-resolution
violations. The conforming Rule and Operation pass their applicable checks.

## Why Some Meta-Types Do Not Have Architecture Nodes

The canvas now preserves the complete staged DS-D1 inventory, but it does not
pretend that the implementation model covers everything.

The inventory contains:

- 13 active backend meta-types;
- 9 candidate UI meta-types;
- 2 deferred UI meta-types;
- 1 superseded Saga tombstone.

That is 24 currently staged labels plus one retained historical record.

The 13 active backend types have these explicit implementation dispositions:

| Disposition | Meta-types | Meaning |
| --- | --- | --- |
| Candidate-mapped | Operation, Query, Rule, Interface, State Machine | A reciprocal candidate architecture realization exists. |
| Profiled-unmapped | Calculation, Event | Profiles mention source classes, but no reciprocal architecture realization type exists yet. |
| Unsupported | Entity, Value Object, Enum, Policy, Workflow, Mapping | The experiment has not designed an admitted realization model for them. |

The UI candidates—Page, Layout, Component, View Model, Hook, Form, Action,
Guard, and Binding—remain visible but not active. Adapter and State Indicator
remain deferred. Saga remains superseded, and its stable identifier is not
reused.

One naming trap deserves special attention: the deferred DomainSpec
`DS-D1.24 Adapter` is not mapped to `architecture.AdapterImplementation`.
The matching English label is insufficient evidence that they mean the same
thing.

## Three Status Systems, Not One Ladder

The word “status” appears in three independent systems:

1. **Canonical maturity** describes the DomainSpec registry: active,
   candidate, deferred, or superseded.
2. **Implementation coverage** describes this experiment: candidate-mapped,
   profiled-unmapped, unsupported, not-admitted, or superseded.
3. **Evaluation outcome** describes supplied facts: an assertion passes or
   produces a finding.

These are not interchangeable. `Entity` is an active DomainSpec meta-type and
is also unsupported by this implementation experiment. That does not make
Entity invalid; it means this package lacks an explicit realization contract.
A candidate UI type can be visible while remaining not admitted. A finding can
exist even when both the semantic type and architecture profile are valid.

## How to Read the Canvas

Open `architecture-ontology-view.html` through the local preview server. The
canvas provides five lenses over the same experiment.

### Lens 1: DomainSpec meta-types

Start here. Use the maturity filter to compare:

- **Active**: the 13 supported-registry backend meanings;
- **UI**: candidate and deferred labels that are not active;
- **Staged**: all 24 current labels;
- **History**: the superseded Saga tombstone.

Click a node to see its canonical ID, maturity, criterion, implementation
coverage, owner route, review trigger, and authority boundary.

### Lens 2: Architecture types

This shows the candidate vocabulary for inspectable implementations. Parent
and child connections explain which properties are inherited. A
`RuleImplementation` is a `DomainConceptImplementation`, which is an
`ArchitectureElement`.

### Lens 3: Profile properties

This shows expectations loaded from the portable and language-specific
profiles. Switch between TypeScript, Python, and Rust to see which constraints
are shared and which belong to one language.

### Lens 4: Observed facts

This shows the supplied instance data: particular implementation elements,
their typed properties, and their relations. In the current experiment these
facts come from a fixture, not from live source parsing.

### Lens 5: Violations

This shows evaluator findings. A violation connects a profile expectation to
an observed disagreement. Open Details to inspect the exact expected and
observed values.

### Controls

- Click **Explore** or press `N` to open the navigation drawer.
- Press `1` through `5` to switch lenses.
- Click a node or focus it and press `Enter` to open Details.
- Drag a node to reposition it.
- Drag empty space to pan.
- Use the wheel or `+` and `-` controls to zoom.
- Press `F` to fit the current graph.
- Press `/` to focus search.
- Press `Esc` to close help, close drawers, or clear selection.

The short sentence inside a node is orientation copy. The Details drawer is
where the exact contract, evidence, ownership, and forbidden inference live.

## Properties, Profiles, and Relations

### Property families

| Family | Example properties | What they describe |
| --- | --- | --- |
| Placement | `source.language`, `source.path`, `source.filename_case` | Where an element lives and which language convention applies. |
| Binding | `source.primary_concept_count`, `binding.concept_id`, `binding.current` | Whether source realizes one exact, current semantic concept. |
| Source shape | `symbol.primary_callable_count`, `symbol.public_callable_count`, `callable.form` | Entry-point and public/export form. |
| Behavior | `callable.return_semantics`, `callable.helper_policy` | Behavioral category and helper placement. |
| Dependency | `dependency.resolution`, `dependency.direction` | Exact import target and layer direction. |
| State | `state.representation`, `state.exhaustive`, `transition.negative_fixture_present` | Static state shape and negative transition evidence. |
| Interface | `interface.versioned` | Whether a boundary binds an explicit contract version. |

Each property definition records where it applies, its value type, its
semantics, its observation stage, its owner route, and what must not be
inferred from it.

### Relations

- `architecture.depends_on` records a code or module dependency.
- `architecture.guards` connects a Rule implementation to an Operation or
  State Machine implementation it guards.
- `architecture.exposes` connects an Interface implementation to an Operation
  or Query implementation it exposes.
- `architecture.implements_interface` connects an Adapter implementation to an
  Interface implementation.

These are architecture relations. They do not automatically establish
canonical DomainSpec semantic edges.

For example, an Operation may structurally depend on a Rule because it imports
the Rule. Semantically, the Rule guards the Operation. The two edges point in
different directions and answer different questions.

## Authority: What May Be Concluded

The safest way to use the package is to follow this claim ladder:

| Evidence | Allowed conclusion | Forbidden shortcut |
| --- | --- | --- |
| Canonical DS-D1 source | This meta-type identity and maturity are registered. | Every registered type has an implementation model. |
| Local coverage projection | This experiment has explicitly mapped, profiled, or rejected coverage. | The projection changes canonical status. |
| Candidate architecture ontology | These properties and relations can be tested as a model. | The model is admitted or production-ready. |
| Candidate profile | This profile expects these values. | The expectation is universal across projects or languages. |
| Observation fixture | These facts were supplied to the evaluator. | A real parser extracted them from current source. |
| Deterministic finding | Expected and supplied observed values disagree. | Runtime behavior is incorrect or unsafe. |

All ontology, projection, profile, observation, and evaluation artifacts in
this experiment have `authority_effect: none`. They can describe, test, and
explain. They cannot promote a type, approve a profile, or trigger a lifecycle
action without the named external owner gate.

## Common Questions

### Is this just a more complicated linter configuration?

No. A linter configuration usually lists checks. This model also defines what
the checked objects mean, which properties are valid for them, how profiles
compose, what evidence produced a value, and what conclusions are forbidden.
A linter can be one consumer of the model.

### Does the ontology enforce folder structure?

The ontology defines `source.path`. A profile supplies the expected path
pattern. An adapter observes the actual path. The evaluator compares them.
Enforcement is the composition of all four parts, not an action performed by
the ontology alone.

### Does the ontology force TypeScript arrow functions everywhere?

No. The TypeScript strict profile requires an arrow function for its candidate
Rule realization. Python and Rust use different callable forms. Another
admitted project profile could make a different explicit choice.

### Can a file contain helper functions?

The portable model exposes `callable.helper_policy`. A profile may forbid
helpers, allow private helpers, or require them to live in separate source
units. This makes composability policy explicit instead of hiding it in a
one-off lint rule.

### If code looks like a Rule, is it a DomainSpec Rule?

No. Source shape can corroborate a declared binding, but it cannot mint
semantic identity. The owner-resolved `binding.concept_id` and current digest
chain are separate evidence.

### Why keep unsupported and superseded types on the graph?

Because absence is ambiguous. An explicit unsupported record says “we know
about this type and have not modeled its realization.” A superseded tombstone
preserves history and prevents unsafe identifier reuse.

### Why is the sample verdict a failure when validation passed?

The sample is intentionally broken. Validation passes because the evaluator
reproduces exactly the eight expected findings. The ontology verdict is pass;
the sample architecture verdict is fail-as-expected.

### Does this already inspect real TypeScript, Python, or Rust repositories?

No. The language projections are contracts. The current observed facts are a
fixture. The next useful implementation slice is a TypeScript AST and module
resolution adapter that emits the same fact shape from real source code.

## Compact Glossary

| Term | Plain-language meaning |
| --- | --- |
| Ontology | The shared vocabulary of kinds, properties, relations, and boundaries. |
| Meta-type | A canonical kind of DomainSpec concept, such as Rule or Operation. |
| Architecture concept type | A candidate kind of inspectable implementation realization. |
| Property | A named, typed question about a node or relation. |
| Relation | A typed, directed connection between architecture elements. |
| Profile | A selected set of expected property values for a language or project. |
| Projection | A bounded translation or read model made for a declared use. |
| Observation | A typed fact supplied by an adapter or fixture. |
| Constraint | One expected value plus the operator used to test it. |
| Finding | An explainable disagreement between an expectation and supplied evidence. |
| Candidate alignment | A testable correspondence that has not gained canonical authority. |
| Authority effect | Whether an artifact may change governed state; it is `none` here. |
| Tombstone | A retained historical identity that must not be silently reused. |

## How to Extend the Model Safely

Adding support for another meta-type is more than drawing another node.

1. Confirm the canonical DS-D1 identity and maturity. Any canonical change
   belongs to `definitions-governance`, not this experiment.
2. Define the candidate architecture realization and its forbidden collapse.
3. Record a reciprocal candidate mapping in the local coverage projection.
4. Define observable properties with value types, applicability, semantics,
   observation stages, owners, and forbidden inferences.
5. Add portable expectations only when they truly cross languages.
6. Put syntax and layout choices in language or project profiles.
7. Implement a native adapter that emits typed observed or unsupported
   evidence with source and tool digests.
8. Add discriminating positive and negative fixtures.
9. Run the deterministic validator and browser checks.
10. Route any promotion or lifecycle action through its named owner gate.

Do not infer a mapping from matching names. Do not turn missing evidence into a
pass. Do not place TypeScript syntax rules in the portable ontology. Do not let
an implementation observation create semantic authority.

## A Ten-Minute Learning Path

If this is your first encounter with the package:

1. Read **The Short Version** and **“Type” Has Several Meanings** above.
2. Open the canvas in the DomainSpec meta-types lens.
3. Inspect `Rule`, then compare it with `Calculation` and `Policy`.
4. Switch to Architecture types and inspect `RuleImplementation`.
5. Switch to Profile properties and compare TypeScript with Python or Rust.
6. Switch to Observed facts and inspect `LegacyLimitRule`.
7. Switch to Violations and open one finding.
8. Return to **Authority: What May Be Concluded** before using the result in a
   decision.

After that path, the essential distinction should be clear:

```text
DomainSpec says what the concept means.
The architecture ontology says what can be inspected.
A profile says what this context expects.
An adapter says what it observed.
The evaluator explains the difference.
An external owner decides what happens next.
```

## Current Boundary and Best Next Step

The experiment currently proves that a generic evaluator can load the
digest-bound DS-D1 projection, require explicit coverage for all active
meta-types, compose portable and language profiles, and reproduce deterministic
findings over supplied facts.

It does not prove real-source extraction. The narrowest next step is:

```text
real TypeScript fixture
  -> TypeScript AST + module resolution
  -> typed observation projection
  -> existing generic evaluator
  -> the same expected findings
```

That step will test whether the vocabulary is not only coherent on paper, but
also extractable and useful against real code.
