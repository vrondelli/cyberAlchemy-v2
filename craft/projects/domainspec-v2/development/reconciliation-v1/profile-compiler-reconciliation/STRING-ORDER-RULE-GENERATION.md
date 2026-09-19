# String ordering Rule generation

Date: 2026-09-09. PCR-06 opt-in Rule v2 candidate, authorized by user “next”.
Authority effect: none. No default cutover, admission, publication, release,
AlchLang change or canonical contract mutation.

## Implemented scope

The [candidate contract](string-order-rule-contract.json) selects
`domainspec.configured-rules-selection/v2-candidate`. The configured TypeScript
Rule generator now realizes the existing checked `lt` operator for direct
String parameters and String literals. It composes with existing `all`, `any`,
`not`, `eq` and declared `rule_ref` expressions.

This closes one representational gap between the unchanged
[typed Rule contract](../../../impl/cli/src/typed-operation/contracts.ts) and the
configured generator. It does not expand the typed contract or claim full Rule,
metatype or language completion.

## Generated behavior

A checked expression such as:

~~~json
{
  "op": "lt",
  "left": {"op": "path", "root": "lower", "properties": []},
  "right": {"op": "path", "root": "upper", "properties": []}
}
~~~

generates a direct Boolean expression:

~~~ts
return (p0 < p1);
~~~

Ordering is the ECMAScript relational comparison of the unchanged String values.
For two Strings this is lexicographic UTF-16 code-unit ordering. It is not locale
collation, Unicode normalization, natural-number ordering or case folding.
Generated input guards still require exact own data properties with String
values, so numeric, Boolean and coercible-object inputs reject before evaluation.

The v2 contract is an exact raw source input. Changed, missing or extra contract
bytes reject before a plan is returned. Selection order remains canonical and
module relocation changes paths without changing source bodies.

## Boundaries

- `lt` requires direct String operands. Bool ordering remains invalid in the
  checked closure and is rejected explicitly by v2.
- UInt64 ordering is not enabled: the configured Rule generator still accepts
  only String/Bool parameters, and full numeric realization is separate.
- Named/property paths, collections, quantifiers, set equality, containment and
  sum inspection remain unsupported by this selection.
- Declared Rule references remain exact closure dependencies with complete
  parameter binding and type checks. No policy condition or inline expression is
  inferred to be a Rule.
- v1 remains the factory-selected Rule generator. Existing v1 selections and
  emitted bytes are unchanged; v2 must be chosen explicitly.
- The generated function remains a direct arrow function, not a class or generic
  AST interpreter.

## Verification

Focused validation: **5/5 PASS**, no skips, in 16.02 seconds. Full CLI typecheck
PASS, including 39 catalog rows, 31 relationship signatures and five integration
definitions across three languages. Native observer source is unchanged.

Full selected regression: **122/122 PASS**, no skips, in 298.10 seconds
(five added tests plus the preceding 117). Report source digests, links and
scoped whitespace checks PASS. Task-session result: **PASS for this bounded
slice**.

The tests cover opt-in selection and contract drift; v1 preservation; deterministic
root ordering; direct and Boolean-composed String ordering; declared Rule-reference
composition; exact code-unit behavior for case, numeric-looking strings, combining
and precomposed Unicode, emoji and empty strings; no coercion or normalization;
and fail-closed Bool, mismatched literal, property and collection expressions.

Three native-compiling semantic mutants reverse the operands, add equality, or
replace code-unit ordering with locale comparison. Each disagrees with an
independent expected result. Generated TypeScript and JavaScript are compiled
using the existing locked TypeScript 7.0.2 container with network disabled and a
read-only root. No compiler was installed.

## Exact sources and preservation

| Source | SHA-256 |
| --- | --- |
| configured-rules.ts | 2a4d2ddb16d00ae41300a8c9629dba0726dd064311370faf6e468fec8870122a |
| configured-rules.test.ts | 9d797e3d4337c85555eee85c33b9d28ddac5def6628017d58607237a4decca66 |
| string-order-rule-contract.json | dbd1052e7aa56cc689d8598a067631322cf534867d45ebcb77b02ab58c81a658 |

The checked Rule contract and closure validator, configured factories, factory
v1–v9 outputs, project builder, profiles, configuration and Rule observer retain
their entry bytes. The observer hash remains
fcfd255ea8c768c5c8256ddea5478bcc5e6a85f7528e45d9421a67709355124c.
Unrelated dirty files are preserved.

The five-file write envelope is the Rule planner/emitter, its test file, the new
contract, this report and STATUS.md. The accidentally created Windows-side
contract was removed immediately; only the intended WSL checkout contains this
candidate. No staging, branch operation or external publication occurred.

## Task-session result and context pack

Task: review checked Rule-expression coverage and implement the smallest supported
gap. Runtime: native local. Delegation, runtime handoff and experiment harness:
not applicable.

Context-builder selected the PCR-06 plan/status and original Rule-generation
report for the frontier; typed Rule contract and closure validation for existing
meaning; Rust realization only as supporting evidence that `lt` is an existing
operator, not as TypeScript authority; and configured Rule source/tests/observer
for generation and verification. The exact gap was String `lt`; collection and
quantifier operators require input/value semantics beyond this bounded slice.

Decision: introduce opt-in v2 and bind a new source contract instead of modifying
v1 in place. Reuse the direct expression generator because no runtime helper is
needed. This preserves factory behavior and separates code-unit ordering from
locale or normalized ordering. No blocker-level choice remains within scope.

Gate: user authorization and ARE route/context/effect assessment delimit the D65
candidate-construction boundary. The assessment does not grant authority. Test
evidence supports this candidate only, not admission, profile parity or release.
STATUS.md is synchronized at the completion boundary.

## Open Questions

No unresolved semantic decision remains within this String-ordering slice.
The next bounded PCR-06 review should evaluate collection value realization as a
prerequisite for `contains`, `set_equal`, `exists`, `exactly_one` and
`unique`, without assuming one implementation slice covers them all. Numeric
ordering, named values, sums, other metatype generators, three-language parity,
public integration and packaging remain separate. Admission and release remain
owned by [the PCR plan](PLAN.md#9-open-questions-and-proposed-decisions).
