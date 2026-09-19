# Independent collection-Rule structural observation

Date: 2026-09-09. PCR-06 construction continuation under the working-CLI goal.
Authority effect: none. No generator, old observer, profile or default changed.

## Product boundary

`impl/cli/tools/observe-configured-rule-collections.mjs` adds an independent
native TypeScript AST observer for the selected v3/v4 Rule module form. It runs
inside the existing pinned TypeScript 7.0.2 image and imports no generator code.

The observer takes a TypeScript project configuration plus bound declarations:
each expected module supplies its path, callable, exact leaf imports, ordered
parameter names and scalar/list/set types. Bindings are comparison inputs, not
authenticated graph authority. A later CLI integration must bind them to the
checked graph and selected plan; caller-supplied expectations alone cannot prove
that the right domain was selected.

It independently checks:

- the expected artifact set and profile-relative source paths;
- exactly one exported constant Boolean arrow and exact declared leaf imports;
- the input signature and ordered validation/normalization boundary;
- each collection's element type, list/set distinction and source parameter;
- the exact tested private collection support, with two fixed observer-owned
  source pins (not supplied by the target or generator);
- a closed pure expression grammar: scoped values, scalar comparisons, Boolean
  composition, array predicates, set construction/conversion, lexical callbacks,
  and declared Rule calls;
- no extra top-level code, exports, imperative callback bodies, assignments,
  ambient calls, direct raw-parameter access or normalization bypass.

Support pinning is deliberately narrow: it proves that the observed helper is
the same support exercised by native input/ownership tests. It does not prove
helper correctness on its own, accept arbitrary equivalent rewrites, or admit
the support as a shared runtime protocol. Predicate structure likewise does not
prove predicate meaning. Results explicitly carry
`semantic_verdict: requires-independent-execution`.

The original scalar Rule observer remains untouched. This successor does not
claim a general JavaScript security sandbox, cross-language parity, complete
Rule semantics or a completed CLI.

## Validation status

Final focused native observer tests: **3/3 PASS**, no skips, 33.48 seconds,
including eleven native-compiling mutations and separate binding controls.
An earlier full selected regression passed 137/137 in 238.78 seconds. A final
review then found and fixed whitespace normalization inside string literals;
the focused run includes the new diagnostic-literal mutation. Full selected
regression on final bytes: **137/137 PASS**, no skips, in **248.29 seconds**.
CLI typecheck, observer syntax, report identities, links and scoped whitespace
checks PASS. The test command is the same eight-file selected regression listed
in [the predicate report](RULE-COLLECTION-PREDICATES.md#source-identity-and-validation-command).

Positive corpus: scalar modules, v3 list/set transport, v4 membership/equality,
conversion, Bool quantifiers/uniqueness, nested lexical bindings and Rule imports.
Negative corpus: altered immutable support, extra/mutable exports, hidden effects,
imperative callbacks, unapproved calls, normalization bypass, wrong list/set
selection, removed field validation, direct raw-parameter reads, wrong expected
types and substituted imports. Mutants described as native-compiling are compiled
before structural observation; wrong-import binding checks are separate controls.
Whitespace normalization preserves string-literal contents, so an altered field
key or error diagnostic is never treated as mere code formatting.

Two harness issues were corrected during development: the test must retrieve the
typed contract from the checked node body, and repeat native compilation must
explicitly ignore the observer's generated tsconfig when passing source files on
the command line. Neither issue was suppressed or counted as PASS.

The additional semantic control substitutes `every` for `some`. It is valid
within the structural grammar and must receive structural PASS, while direct
execution must disagree with the expected membership outcome. This demonstrates
why the structural and behavioral verdicts are kept separate.

## Context pack and task-session boundary

Task: close the missing independent structural observation for the existing
scalar collection Rule group. Context mode: lean; no delegation or runtime
handoff; experiment harness not applicable.

Controlling sources: PCR PLAN.md verification requirements; STATUS.md and
CLI-COMPLETION.md frontier; RULE-COLLECTION-PREDICATES.md claim limit; existing
configured Rule generator for the emitted support/boundary protocol; original
observer for the selected native API/toolchain; Rule tests for the independent
behavior and mutation controls. Every source closes a shape, preservation,
verification or scope obligation. No wider metatype parser is changed.

Decision: keep the old observer intact and add a closed-profile successor. Pin
the static tested helper; inspect the exported function structurally; keep
behavioral correctness a separate verdict. This is a bounded implementation
choice, not an owner-level language decision.

ARE route/context succeeded. Its effect assessment preserves the user's existing
authorization and D65 boundary, granting no admission or external effect.
Exact five-file envelope: new observer, Rule tests, this report, STATUS.md and
CLI-COMPLETION.md. Generator bytes and previous versioned contract bytes remain
unchanged. Task-session result: **PASS for the collection-Rule structural
observer**. STATUS.md and CLI-COMPLETION.md are synchronized. The full working-CLI
goal remains active and incomplete; this result does not close PCR-06.

## Source identity

| Source | SHA-256 |
| --- | --- |
| observe-configured-rule-collections.mjs | 2a50690b576a70c1a3aba62c2559396bf120ca46b7a88a7fbd7c6816df111630 |
| configured-rules.test.ts | c578475f9e4678e06e4aaf55687f62286ac069a134cecacf6c883d9f722c1a01 |

The generator remains
`1e51a855bb003c7e47f0145ab30e3ce959e72ce3a6bb0a75d8c2b4226e9b8489`;
the predicate emitter remains
`cc5f72331123c550c286c15ac4d2975f403f7f06323f78cc68394f7adeb9d83e`;
the original observer remains
`fcfd255ea8c768c5c8256ddea5478bcc5e6a85f7528e45d9421a67709355124c`.
Earlier reports retain their historical tested source digests; the current test
file includes the additive observer coverage recorded here.

## Open questions

No blocking choice remains for this observer. Integration must bind observation
expectations to the checked graph and source plan, then include the observer in
clean installed verification. Numeric/named Rule inputs, factory composition,
other metatypes and the remaining PCR stages stay in
[CLI-COMPLETION.md](CLI-COMPLETION.md).
