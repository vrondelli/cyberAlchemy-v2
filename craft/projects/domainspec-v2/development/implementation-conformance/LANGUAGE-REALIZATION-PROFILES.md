# Initial Language Realization Profiles

These are Design candidates, not admitted profiles or implemented packages.
They translate the portable implementation-conformance contracts into bounded
TypeScript, Python, and Rust realizations without pretending the languages have
identical module or export semantics.

## Package Family, Not One Polyglot Runtime

The proposed package is one governance and protocol boundary with separable
implementation artifacts:

```text
implementation-conformance-contracts
  profile, binding, native-bundle, finding, runtime-contract, receipt schemas

implementation-conformance-core
  pure exact reconciliation and deterministic normalization
  implementation host not selected by Design

implementation-conformance-adapter-typescript
implementation-conformance-adapter-python
implementation-conformance-adapter-rust
  project-owned native evidence adapters

implementation-conformance-fixtures
  cross-language golden inputs, mutants, and expected normalized meanings
```

This is a logical package family. A future owner must choose whether the core
has one host implementation with versioned adapter envelopes or multiple native
implementations checked against the same golden contracts. Design rejects a
network control plane, hidden process runner, or unproven three-way parity.

## Portable Source-Class Model

| Canonical meta-type / role | Candidate source class | Portable contract | What the folder cannot prove |
| --- | --- | --- | --- |
| Rule | `domain/rules/` | exactly one admitted binding and callable entry point per canonical Rule | semantic identity, formation, or admission |
| State Machine | `domain/state-machines/` | binding to canonical State Machine plus exhaustive native representation | runtime transition correctness or effect delivery |
| Event | `domain/events/` | binding to canonical Event identity and admitted edge | actual publication/delivery |
| Calculation | `domain/calculations/` or profile-selected pure application location | deterministic callable and declared dependencies | purity without behavioral evidence |
| Operation | `application/operations/` or `application/use-cases/` | binding to canonical Operation and selected Rule edge policy | new `UseCase` ontology kind |
| Query | `application/queries/` | binding to canonical Query and read-side contract | data-source correctness |
| Interface | `application/interfaces/` or `application/ports/` | versioned contract and direction | adapter correctness |
| adapter/infrastructure | `adapters/` | implements an admitted Interface and depends inward | semantic admission |
| generated projection | `generated/` | source/generator/config/output/tool digests | authority or freshness without reconciliation |
| tests/runtime fixtures | `tests/` | named witness and raw evidence reference | production behavior |

Folder names classify source under a selected profile. The code tag and
`ImplementationBinding` reconciliation own identity.

## One Rule Per File And One Export

The portable invariant is:

```text
one admitted canonical Rule
  -> exactly one admitted ImplementationBinding
  -> exactly one primary callable entry point
```

An initial strict profile may additionally select
`one-primary-bound-concept-per-source-unit`. That is deliberately weaker and
more portable than “the file exports only one symbol”:

| Language | Strict starter convention | Helpers |
| --- | --- | --- |
| TypeScript | one Rule file, one exported bound Rule callable; optional `arrow-only` style | non-exported helpers allowed if profile permits |
| Python | one Rule module, one bound public callable; optional `__all__` lint convention | underscore/private-by-convention helpers allowed; Python has no equivalent export privacy proof |
| Rust | one Rule module file, one bound public callable | private helper items allowed; module visibility remains native Rust semantics |

Arrow functions are a TypeScript profile choice enforced by TypeScript tooling.
There is no Python or Rust semantic equivalent, so arrow-only is never a
portable implementation-conformance law.

## How An Operation Imports A Rule

### Candidate direct-leaf profile

TypeScript:

```ts
import { canApprove } from "../../domain/rules/can-approve";
```

Python:

```python
from domain.rules.can_approve import can_approve
```

Rust:

```rust
use crate::domain::rules::can_approve::can_approve;
```

The source graph must resolve the imported symbol to the exact bound Rule leaf.
An index/barrel/re-export does not satisfy this policy merely because it reaches
the same function.

### Public-index alternative

The v1 pattern library requires public API re-exports and forbids importing a
module's internals. That conflicts with the direct-leaf policy. The initial
profile must therefore carry an explicit `edge_policy`:

```text
direct-rule-leaf
public-index-with-exact-target-evidence
```

The second value is not automatically admitted. Its owner must define how an
index edge proves the exact Rule target without turning a barrel into identity.
No adapter may choose between policies implicitly.

## How A State Machine Is Represented

The canonical State Machine remains the existing DomainSpec concept. A language
realization supplies three distinct artifacts:

1. an exhaustive native state representation;
2. a bound transition-selection implementation whose guards point to exact Rule
   bindings;
3. an application-owned `StateMachineRuntimeContract` with named valid and
   invalid fixtures plus effect intent.

```text
canonical State Machine id/profile digest
  -> admitted states and transitions
  -> native exhaustive state type
  -> transition selector and Rule guard bindings
  -> valid fixture: draft + eligible -> approved + OrderApproved intent
  -> invalid fixture: approved + eligible -> DSV2-TRANSITION-NOT-ALLOWED
```

Formation proves only that canonical transitions exist. Compiler
exhaustiveness, source topology, guard result, state transition result, effect
intent, durable state, and effect delivery remain separate evidence classes.

## TypeScript Starter Profile

| Concern | Candidate contract |
| --- | --- |
| filename | kebab-case profile convention; never identity |
| Rule callable | one exported bound callable; `arrow-only` optional profile flag |
| source shape | ESLint custom rule using typescript-eslint supported extension surface |
| topology | dependency-cruiser bound to tsconfig/project/config digests |
| type/exhaustiveness | `tsc` plus `never` pattern evidence |
| runtime | existing project test harness supplies result bundle |
| unsupported until resolved | computed imports, unresolved path aliases/project references/conditional exports/decorators/generated barrels |

## Python Starter Profile

| Concern | Candidate contract |
| --- | --- |
| filename | snake_case profile convention; never identity |
| Rule callable | one bound public function; normal `def`, not lambda-only |
| source shape | bounded CPython `ast.parse`/`NodeVisitor` over explicit `Import` and `ImportFrom` nodes |
| topology | Import Linter contracts; mypy is not topology |
| type/exhaustiveness | mypy plus `assert_never` evidence |
| runtime | existing project test harness supplies result bundle |
| unsupported until resolved | namespace packages, import hooks, `__getattr__`, monkey patching, runtime module construction, indeterminate relative resolution |

Ruff remains formatter/lint evidence. It is not selected as a DomainSpec plugin
host.

## Rust Starter Profile

| Concern | Candidate contract |
| --- | --- |
| filename/module | snake_case native convention; never identity |
| Rule callable | one bound public function in a module; normal `fn` |
| source shape/topology | Cargo package graph plus bounded explicit macro-free `mod`/`use` resolution |
| type/exhaustiveness | rustc exhaustive `match` evidence |
| style | rustfmt/Clippy evidence |
| runtime | existing project test harness supplies result bundle |
| blocking unsupported | `cfg`, `#[path]`, procedural/declarative macros, build-generated modules, ambiguous re-exports, dynamic linking/loading |

Cargo metadata describes packages, not intra-crate source edges.

## Structural Enforcement Stack

| Rung | Question | Evidence owner | Package action |
| --- | --- | --- | --- |
| lexical/style | does source follow the selected language convention? | formatter/linter | attach native result; never infer semantics |
| source shape | is the required bound callable/export/module form present? | bounded language adapter | emit exact shape finding or unsupported |
| source topology | do directness, direction, cycle, orphan, and unresolved laws hold? | language graph plus Architecture-Pattern Enforcement | preserve owner finding and normalize |
| native type | is the implementation type-correct and exhaustive? | compiler/type checker | attach native result |
| DomainSpec formation/admission | is the canonical concept valid and admitted? | existing DomainSpec owners | resolve read-only input |
| binding reconciliation | does canonical identity resolve to one current source entry? | this package over owner projections | exact comparison only |
| runtime behavior | do named valid/invalid outcomes hold? | application harness | compare supplied evidence |
| authority | may evidence change what governs? | external owner route | never decide |

## Composability Contract

Composability is established only by the conjunction of:

- admitted canonical kinds and relationship signatures;
- exact implementation bindings and current digests;
- explicit interface versions;
- selected layer direction and Rule-edge policy;
- no forbidden, cyclic, unresolved, orphan, or indeterminate required edges;
- native type/exhaustiveness evidence;
- runtime evidence only for claims that select it;
- generated freshness and evidence non-authority.

Neither folder shape, one export, filename, nor arrow syntax is sufficient.
