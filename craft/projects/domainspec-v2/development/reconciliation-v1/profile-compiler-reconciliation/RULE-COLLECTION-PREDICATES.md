# Rule scalar collection predicates

Date: 2026-09-09. PCR-06 opt-in Rule v4 candidate.
Authorization: continued working-CLI goal. Authority effect: none.
No defaults, canonical contracts, AlchLang, admission or publication changed.

## Implemented contract

The [v4 candidate](rule-collection-predicate-contract.json) inherits the exact
v2 String-order and v3 scalar collection-value sources. Each source is checked
against its own fixed digest. The source emitter consumes the existing checked
Rule graph; it does not add a parser or a runtime expression interpreter.

| Expression | Generated behavior |
| --- | --- |
| `contains(list/set, scalar)` | Exact same-type scalar membership; no coercion, substring matching, case folding or normalization. |
| `eq(list, list)` | Ordered element equality including multiplicity. |
| `eq(set, set)`, `set_equal(set, set)` | Equal normalized elements, independent of supplied order. |
| `to_set(list)` | Deduplicate, canonicalize and freeze a new set. Supplied set parameters still reject duplicates. |
| `exists` | At least one satisfying occurrence; false on empty input. |
| `exactly_one` | Exactly one satisfying occurrence; repeated list elements count separately. |
| `unique` | No duplicate values of the checked identical-path key; true on empty input. |

Supported values remain String, Bool and their direct list/set collections.
All input collections use the existing copied/frozen, dense plain-array boundary.
String equality is exact ECMAScript equality, not normalized human-language
equivalence. String `lt` retains the explicit v2 code-unit order contract.

Quantifiers use hygienic compiler-assigned locals. Their collection is evaluated
in the enclosing scope; their predicate sees the new lexical binding. Shadowing
does not change sibling or enclosing bindings. Declared Rule calls inside nested
predicates are included in dependency planning and receive exact checked argument
bindings. `unique` may use an enclosing scalar key as permitted by the checked
contract; it does not silently rewrite that key to the iteration element.

`set_equal` accepts sets only in this candidate. The existing closure validator
also admits same-type non-set operands; v4 explicitly rejects those at generation
rather than inventing membership semantics for scalars or lists. Numeric, named,
sum, optional, nested collection and property projection inputs remain separate
coverage work, not silently accepted or declared complete.

## Verification

Focused native validation: **7/7 PASS**, no skips, 13.69 seconds. CLI typecheck
PASS, including the unchanged 39 catalog rows, 31 relationship signatures and
five integration definitions. Full selected regression: **134/134 PASS**, no
skips, in 209.78 seconds (the preceding 127 tests plus seven new tests).

The tests independently enumerate scalar membership pairs and count list
occurrences for every binary list of length zero through four, for String and
Bool. They distinguish empty/single/repeated lists, set ordering, wrong element
types, Unicode representations, accessor rejection, conversion, nested shadowing,
outer keys and Rule imports inside predicates. Separate output roots and reversed
root selection preserve output. Generation still works after source removal.

Five independently authored native-compiling mutants substitute all-for-any,
inequality-for-equality, at-least-one-for-exactly-one, identity-for-uniqueness and
membership-for-ordered-equality. Each disagrees with explicit expected behavior.
Native compilation uses the existing pinned TypeScript 7.0.2 container, without
network or a newly installed compiler.

The original v1 AST observer is unchanged. It is not claimed as an independent
v4 structural oracle; helper/callback observation remains required before full
Rule closure. Native compile plus behavior/mutation tests prove this bounded
expression group only, not all 39 cells or CLI integration.

## Task-session result and context pack

Task: PCR-06 scalar collection-expression generation. Runtime: native local;
no delegation or runtime handoff. Context mode: standard, obligation-linked.

| Selected evidence | Obligation |
| --- | --- |
| PLAN.md sections 1, 5, 7, 8 and STATUS.md frontier | Preserve full 39-cell CLI objective and exact candidate write boundary. |
| Rule collection-value report and contract | Preserve normalization, typed inputs and prior selection versions. |
| typed-operation/contracts.ts RuleExpression/ValueExpression | Reuse expression schema and input types. |
| typed-operation/closure.ts validateRuleSemantics | Checked collection/element types, conversion, lexical scope, exact Rule arguments and uniqueness key. |
| typed-operation/rust.ts renderRule | Existing occurrence-count/unique-key behavior; not proof of new TypeScript or list-membership parity. |
| configured-rules.ts and its tests | Artifact planning, contract bindings, imports, generated boundaries and independent native controls. |

Decision: implement the already-defined scalar collection group together because
conversion, quantifiers and nested references must compose. Keep versions 1–3
unchanged and reject inputs without established v4 semantics. No blocker-level
owner choice was needed. ARE route/context succeeded; the effect assessment
retained the existing user authorization and D65 ceiling.

Exact write envelope: Rule planner, new predicate emitter, Rule tests, new
contract/report, CLI completion ledger and STATUS.md. Experiment harness and
handoff coverage: not applicable. Unrelated dirty files and existing source
contracts are preserved. Task-session result: **PASS for this expression group**.
The CLI goal remains active and incomplete.

## Source identity and validation command

| Source | SHA-256 |
| --- | --- |
| configured-rules.ts | 1e51a855bb003c7e47f0145ab30e3ce959e72ce3a6bb0a75d8c2b4226e9b8489 |
| configured-rule-predicates.ts | cc5f72331123c550c286c15ac4d2975f403f7f06323f78cc68394f7adeb9d83e |
| configured-rules.test.ts | 3b05fb2144de7143ad617699e29228eb5e60fd24f96a3c15f796af31cbda4c34 |
| rule-collection-predicate-contract.json | 3c2d6624daee52f173b0bcd63834b9eac1e0a2e5411b677305ef55bad569feab |

The selected regression uses the existing locked tsx loader and native toolchain:

```sh
TMPDIR=/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/test-tmp \
  /home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run node \
  --import /home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/projects/domainspec-v2/impl/node_modules/tsx/dist/loader.mjs \
  --test --test-concurrency=1 \
  impl/cli/test/generation/configured-factories.test.ts \
  impl/cli/test/generation/configured-enums.test.ts \
  impl/cli/test/input/compiled-field-model.test.ts \
  impl/cli/test/input/field-reference-model.test.ts \
  development/reconciliation-v1/profile-compiler-reconciliation/configuration.test.mjs \
  impl/cli/test/generation/configured-rules.test.ts \
  impl/cli/test/generation/profiled-project.test.ts \
  impl/cli/test/input/project-model.test.ts
```

Protected entry hashes were rechecked: configured factories
`18d5b74ac6d18d12995d2f79f0101c02fcce6f346fd4265ed973d6d6fe376555`,
project builder `3e6e576c5c584185a8acc980a0294a23e4ce5213211e80d9d1add65147bd1250`,
typed contract `ff9c3f901a18703d8de41a5d5bedeee3005b506f1b6b2701f340285802a60cc9`,
typed closure `4199960e4cdb7352269b94b6f249850522fb5644754c751cfa776167c3828cd9`,
and original observer `fcfd255ea8c768c5c8256ddea5478bcc5e6a85f7528e45d9421a67709355124c`.
New report links, seven-file whitespace and scoped diff checks PASS. No commit,
archive, default integration or publication was performed.

## Open questions

No unresolved decision remains inside this scalar collection contract. Broader
Rule types, independent structural observation, factory binding and the rest of
the compiler remain in [CLI-COMPLETION.md](CLI-COMPLETION.md). This unit is not a
substitute for PCR-06 or final CLI completion.
