# AlchLang Typed Backend Definitions

Status: candidate; pending language-owner review

This is the canonical definition surface for the proposed AlchLang typed
backend language extension. It specializes the active DomainSpec v2 meanings
of `DS-D1.5 Query`, `DS-D1.6 Calculation`, `DS-D1.13 Mapping`, and
`DS-D1.8 Policy`; it does not redefine or promote those upstream terms.

All declarative conditions in this extension share the bounded `sfol-v1`
semantic kernel defined below. `Predicate` is retained only as a contextual
name for an SFOL formula; it is not a second expression language.

## ALCH-TB-D0 · Typed Backend Evaluation

Formal voice:

Let `C` be a closed typed contract, `I` an immutable input value, `O` a typed
output, and `E` a causal error. Typed backend evaluation is the deterministic
partial function

```text
evaluate_C : I -> Result<O, E>
```

For byte-identical `C` and value-identical `I`, evaluation returns the same
`O` or the same error class. `evaluate_C` cannot mutate domain state, emit an
event, execute a selected operation, acquire authority, read an undeclared
provider, or interpret executable source text. References, types, operators,
ordering, defaults, and fallbacks must be declared by `C`.

Notation:

- `C` — the closed authored typed contract.
- `I` — caller-supplied immutable rows, fields, or scalar parameters.
- `O` — the value produced solely from `C` and `I`.
- `E` — a stable causal rejection, never a partially successful result.

Plain-language voice: typed backend evaluation is a sealed recipe. The recipe
and its supplied ingredients determine the result; names and prose do not add
hidden behavior.

Domain-context voice: this is the shared semantic boundary that later AlchLang
parser, carrier, compiler, and TypeScript generator work must preserve. The
current action runtime is not an implicit evaluator for these constructs.

Failure semantics: malformed contracts, unsupported operators, unresolved
references, missing required inputs, incompatible value types, and arithmetic
domain errors reject before any output is treated as successful. Evaluation
has no rollback obligation because it performs no mutation.

Authority ceiling: a successful evaluation proves only a local deterministic
value result. It grants no data-access, operation-execution, effect, admission,
publication, release, deployment, or production authority.

## ALCH-TB-D1 · Typed Query

Upstream identity: `DS-D1.5 Query`.

Formal voice:

For a declared row source `S`, input parameters `I`, predicate `F`, ordering
`O`, positive limit `L`, and nonempty unique projection `P`, a Typed Query is

```text
Q_C(rows_S, params_I) = project_P(limit_L(order_O(filter_F(rows_S, params_I))))
```

`F`, `O`, and `L` may be explicitly absent. The output is an immutable sequence
whose records contain exactly the fields in `P`. When ordering is absent, the
input sequence order is preserved. The source selector identifies semantic
provenance; it does not itself fetch data or authorize provider access.

Plain-language voice: a Typed Query asks a precise read-only question of rows
the caller already supplied, then filters, sorts, limits, and shapes the answer
exactly as declared.

Domain-context voice: AlchLang will expose this as an explicit language
construct rather than disguising a read as an action. Its source must close
through the DomainSpec `reads` relationship, and any real database access must
remain behind a separately selected and authorized provider binding.

Failure semantics: compilation rejects an absent typed contract, unresolved
source or field, duplicate or empty projection, invalid ordering, non-positive
limit, undeclared predicate input, or incompatible comparison. Runtime
evaluation rejects missing projected/filter/order values or type-incompatible
predicate operands and returns no partial answer.

Authority ceiling: a Typed Query is read-only and provider-neutral. It cannot
mutate state, emit events, execute effects, infer credentials, or authorize
access to the declared source.

## ALCH-TB-D2 · Typed Calculation

Upstream identity: `DS-D1.6 Calculation`.

Formal voice:

For unique declared scalar inputs `I`, an expression tree `E`, and division
rounding policy `R` in `{floor, ceil, reject}`, a Typed Calculation is

```text
C_(E,R) : Inputs<I, UInt64> -> Result<UInt64, CalculationError>
```

`E` contains only unsigned integer literals, declared input references, and
`add`, `subtract`, `multiply`, or `divide`. Arithmetic is checked in the
`UInt64` domain. Subtraction below zero, addition or multiplication above
`2^64 - 1`, and division by zero reject. Inexact division floors, ceils, or
rejects exactly as `R` declares.

Plain-language voice: a Typed Calculation is a named, side-effect-free numeric
formula with explicit inputs and an explicit rule for division.

Domain-context voice: AlchLang will lower this expression tree directly; it may
not accept a JavaScript, Python, SQL, or Rust expression string. The same
contract must produce equivalent results and error classes in every supported
target language.

Failure semantics: compilation rejects non-`UInt64` inputs/results, unknown
inputs, unsupported expression nodes, excessive nesting, or an invalid
rounding policy. Runtime evaluation rejects missing inputs, negative or
out-of-range values, underflow, overflow, division by zero, and inexact
division under `reject`, with no result value.

Authority ceiling: a Typed Calculation derives one value only. It cannot read
ambient state, select or execute an operation, mutate state, emit an event, or
perform an external effect.

## ALCH-TB-D3 · Typed Mapping

Upstream identity: `DS-D1.13 Mapping`.

Formal voice:

For declared source shape `S`, target shape `T`, ordered unique target-field
clauses `M`, and totality flag `total`, a Typed Mapping is

```text
M_C : Record<S> -> Result<Record<T_declared>, MappingError>
```

Each clause chooses a declared source field when present, otherwise its typed
default when present. If neither supplies a value, a total mapping rejects and
a partial mapping omits that target field. The output contains only declared
target fields; source fields not named by a clause do not pass through.

Plain-language voice: a Typed Mapping copies or defaults explicitly named
fields into a new shape. Total mappings promise every declared target field;
partial mappings may leave declared fields absent.

Domain-context voice: AlchLang will represent shape conversion separately from
an Interface boundary or an action. Source and target selectors must close
through DomainSpec `maps` relationships, while boundary transport remains a
different capability.

Failure semantics: compilation rejects unresolved source/target selectors,
empty clauses, duplicate targets, unknown fields, untyped defaults, defaults
that disagree with the target type, or a clause with neither source nor
default. Runtime evaluation rejects a missing field required by a total
mapping and returns no partial target.

Authority ceiling: a Typed Mapping constructs a value. It cannot persist the
target, call an interface, mutate its source, infer fields, or perform effects.

## ALCH-TB-D4 · Typed Policy

Upstream identity: `DS-D1.8 Policy`.

Formal voice:

For unique typed inputs `I`, an ordered nonempty sequence of guarded target
cases `[(P1,T1), ..., (Pn,Tn)]`, and declared default target `Td`, a Typed Policy
is

```text
P_C(inputs_I) = first Ti whose Pi(inputs_I) = true, otherwise Td
```

Predicates use the closed typed backend predicate algebra: typed equality,
ordered comparison of compatible scalar operands, nonempty `all`/`any`, and
`not`. A Policy returns exactly one declared target selector. It selects a
strategy; it does not evaluate or execute that target.

Plain-language voice: a Typed Policy checks choices in authored order and
names the first matching strategy, falling back to an explicit default.

Domain-context voice: AlchLang will keep policy selection distinct from Rule
approval and Action execution. Every case/default target must close through
DomainSpec `applies` relationships to a Calculation or Operation before code
generation.

Failure semantics: compilation rejects missing or duplicate targets, an empty
case list, unresolved case/default targets, undeclared inputs, unsupported
predicate nodes, excessive nesting, or incompatible operands. Runtime
evaluation rejects missing or invalid inputs and returns no selected target.

Authority ceiling: selection is not authorization. A Typed Policy cannot
execute the selected target, bypass its Rule/permission/authority checks,
mutate state, emit events, or perform an external effect.

## Shared predicate boundary

Equality requires compatible declared scalar types. Ordered comparison requires
compatible orderable scalar types; targets must not silently coerce strings
into numbers or numbers into strings. `all` and `any` require at least one term,
and recursion depth is bounded. Predicate nodes are data, never executable
language strings.

## ALCH-TB-D5 · Bounded SFOL Kernel

Formal voice:

The AlchLang `sfol-v1` kernel contains typed terms `T` and typed formulas `F`.
Terms are declared references, typed literals, or allowlisted total arithmetic
applications. Formulas are typed comparisons, membership relations, presence
tests, and finite compositions through `and`, `or`, and `not`:

```text
T ::= declared-reference | typed-literal | allowlisted-term(T...)
F ::= compare(T,T) | membership(T,T) | presence(T) | not(F) | and(F,F) | or(F,F)
```

A Rule is a named `F`; Query filters, Permission conditions, transition guards,
Action conditions, and Policy cases consume the same `F`. A Calculation is a
named bounded `T`. Every reference and operand type closes during compilation.

Plain-language voice: AlchLang has one small logic. The place where a formula
is used changes its role, but not its meaning.

Domain-context voice: `sfol-v1` is the AlchLang textual profile for the current
quantifier-free executable subset of the source-bound DomainSpec SFOL model.
The compiled carrier must keep exact term/formula identity and may grow only by
an explicit successor profile; it must not silently claim the full upstream
DS-SFOL language.

Failure semantics: an unknown logic profile, unresolved reference, incompatible
operand, unsupported operator, malformed arity, or excessive depth rejects the
whole compilation. No ambient values, provider calls, or executable source
strings may complete a formula.

Authority ceiling: an SFOL formula establishes only its Boolean result for the
exact supplied finite values. It does not prove universal truth,
authorize an action, perform an effect, or establish runtime conformance.

## ALCH-TB-D6 · Operational Realization Boundary

Formal voice:

For declarative meaning `F`, intended effect contract `E`, Integration Binding
`B`, runtime provider `R`, observation `O`, and ORODI evaluation `V`, the
successor relation is explicit and non-collapsing:

```text
F -> E -> B -> R -> O -> V
```

No edge implies its successor, and no artifact at one stage is evidence that a
later stage occurred.

Plain-language voice: SFOL says what should be true; effects say what may
happen; bindings say how infrastructure responsibilities are formed; runtimes
do the work; ORODI judges the resulting operational evidence.

Domain-context voice: SFOL owns declarative truth conditions. Action and Effect
contracts own intended behavior. Integration Bindings form explicit
infrastructure responsibilities. Registered architecture patterns and runtime
providers own concrete execution. ORODI consumes bound runtime observations and
evaluates operational evidence.

Failure semantics: a missing or ambiguous binding, unavailable pattern,
unselected runtime provider, missing observation, or incomplete ORODI evidence
causes its dependent stage to be not evaluable or rejected. No stage may infer
the missing predecessor from names or proximity.

Authority ceiling: a binding does not execute, a runtime observation is not an
ORODI verdict, an ORODI verdict is not owner acceptance, and no validation or
evaluation authorizes deployment or another external effect.

`ORODI` is the accepted acronym; `ORDI` is not an alias.

## Construction boundary

These definitions complete only the canonical-definition stage of the local
CAV2-D65 successor. Product Capability, business ontology, DomainSpec authored
source, parser/carrier/compiler lowering, concrete generated implementation,
binding, and independent conformance remain separate successor nodes.
