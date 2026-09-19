# Implementation-completion attack: runtime path and proof closure

Reviewer: Smithe, Toby
Lane: explorer / runtime-path attack
Date: 2026-07-20
Disposition: **BLOCK implementation-completion claim; preserve the narrow S1 slice as the next executable unit.**

## Coverage and integrity

I read every one of the 61 files frozen in `corpus-manifest.json`, including the complete 1,050-line Lean commit-window manifest, and recomputed every manifest SHA-256 digest. Result: **61/61 match**; there is no corpus-integrity exception behind this review.

I also reran the frozen baseline from `projects/domainspec-v2/impl`:

```text
npm run engine:test       PASS: 10 files, 107 tests
npm run typecheck         PASS
npm run validate:rels     PASS: 5 specs, 34 edges, 30 canonical signatures
```

Those passes are real but bounded. They establish that the current legacy engine, type surface, and relationship documents are internally green. They do **not** establish the key-door vertical proof. The live key-door probes below all exited zero while producing no executable proof:

```text
deriveFeature(<minted key-and-door root>)
=> {"obligations":0,"spec":"| Key ...","tests":"... describe(...) {\n});\n"}

cli derive <minted key-and-door root>
=> empty obligation table, exit 0

cli emit-tests <minted key-and-door root>
=> empty describe block, exit 0

parseFormal("has_key == true")
=> {"kind":"unparsed","raw":"has_key == true"}
```

## Actual current call and data path

There are three disconnected paths, not one end-to-end proof path.

```text
Minted JSON nodes/connections
  -> compile/build minted project views
  -> graph.json + source-manifest.json + build-receipt.json
  -> minted conformance receipt
  -> STOP (no obligation, binding, generated test, evaluation, or proof receipt)

Markdown aspect docs or normalized SPEC.md
  -> grammar.parse
  -> legacy ConceptGraph
  -> rules.derive (node-based; graph edges are not traversed)
  -> emitSpec / emitTests [or separately emitHybridTests]
  -> optional parseFormal / evalArith
  -> generated source containing todo/skip on gaps
  -> STOP (no execution and no digest-bound proof receipt)

Code-tag fixture JSON
  -> composability checker
  -> textual operation-calls-rule check
  -> STOP (not joined to the minted graph, obligation, test, or receipt)
```

The key-door fixture enters only the first path. `deriveFeature` enters only the second. The missing minted-graph-to-engine morphism is therefore the primary runtime break.

## Findings

### SMITHE-CRIT-001 — The minted key-door graph never enters derivation

- **Severity:** CRITICAL
- **Exact surface:** `projects/domainspec-v2/impl/test-derivation-engine/src/index.ts::deriveFeature`, lines 23-33; `src/grammar/index.ts::parse`, lines 1093-1140.
- **Literal evidence:** `deriveFeature` begins with `const graph = await parse(featureDir);` and then calls `const result = derive(graph);`. The parser reads aspect Markdown or normalized `SPEC.md`; it has no minted project/graph adapter. The live minted key-door invocation returned `obligations: 0` and an empty test body with status 0.
- **Missing behavior:** No function consumes the compiled minted graph and source manifest as semantic inputs to the derivation engine; an empty parse is accepted as success.
- **One-line code/test fix:** Add a typed `deriveMintedProject(graph, sourceManifest)` adapter and a key-door test that requires exactly one derived obligation and fails on a zero-node/zero-obligation input.
- **Dependencies:** None; this is the first bridge.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/key-door-vertical.test.ts -t "derives one obligation from the minted enforces edge"
  ```

### SMITHE-CRIT-002 — Canonical `Rule -> Operation` semantics disappear at the legacy IR boundary

- **Severity:** CRITICAL
- **Exact surface:** `projects/domainspec-v2/definitions/relationships/relationships.yml::enforces`, lines 84-97; `projects/domainspec-v2/impl/test-derivation-engine/src/ir/types.ts::EdgeType/ConceptGraph/Obligation`, lines 33-40 and 63-101; `src/rules/index.ts::derive`, lines 696-729.
- **Literal evidence:** the canonical relationship declares `source_type: Rule` and `target_type: Operation`, with semantics `A rule gates whether an operation may execute.` The legacy IR instead comments `"enforces" // Operation --enforces--> Invariant`. More decisively, `derive` concatenates node-derived obligations and never traverses `graph.edges`.
- **Missing behavior:** The admitted source edge, its direction, its stable source identity, and its relationship signature do not survive into an obligation. Current rule obligations are derived from Rule nodes in isolation.
- **One-line code/test fix:** Introduce a v2 edge adapter/rule that accepts only canonical `Rule --enforces--> Operation`, emits one edge-anchored obligation carrying `source_edge_id` and relationship/rule-set version, and rejects reversed or mistyped endpoints.
- **Dependencies:** SMITHE-CRIT-001.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/key-door-vertical.test.ts -t "preserves canonical Rule to Operation direction and rejects endpoint mutants"
  ```

### SMITHE-CRIT-003 — There is no machine-owned executable Boolean predicate

- **Severity:** CRITICAL
- **Exact surface:** `projects/domainspec-v2/impl/tools/schemas/minted-project/rule-body.schema.json`, lines 5-9; `test-derivation-engine/src/formal/ast.ts::FormalAst/parseFormal`, lines 112-121 and 347-383; `src/formal/eval.ts::evalArith`, lines 211-215; `.../decisions/2026-07-20-key-and-door-formal-source.md`, lines 23-45.
- **Literal evidence:** the Rule schema requires only `"formal_return_type": { "const": "boolean" }`; it carries no predicate. `FormalAst` has no Boolean predicate case, and the proposed text `has_key == true` parses as `{kind:"unparsed"}`. The only evaluator exposed here is `evalArith`, returning a decimal result or `null`.
- **Missing behavior:** Nothing machine-readable states or evaluates the rule `has_key == true`; therefore neither the operation nor an independent evaluator can be tested against it.
- **One-line code/test fix:** Extend the machine-owned Rule body with a minimal typed Boolean predicate AST plus typed fixture inputs, add deterministic `evalBool`, and test both true and false inputs.
- **Dependencies:** SMITHE-CRIT-001 and SMITHE-CRIT-002.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/formal/key-door-predicate.test.ts
  ```

**Direct challenge to the pending prior:** decision option 1 makes evidence-local `operations.md` the formal source. That is inadmissible under this review's explicit rule that Markdown is never semantic source, and it would still fail because the proposed expression is unparsed. Use the bounded part of option 2 instead: enrich the machine-owned key-door Rule contract without generalizing every relationship kind.

### SMITHE-MAJ-004 — Bindings are unvalidated, ambiguous, and unbound to input digests

- **Severity:** MAJOR
- **Exact surface:** `projects/domainspec-v2/impl/test-derivation-engine/src/bindings/index.ts::Binding/BindingSet/bindingFor`, lines 30-49 and 63-81.
- **Literal evidence:** `Binding` contains selector and callable fields but no `binding_id`, `obligation_id`, `test_id`, runtime target, graph digest, or fixture digest. `bindingFor` returns the first subset match: `return set.bindings.find((b) => matches(b, obligation)) ?? null;`.
- **Missing behavior:** Duplicate or overbroad bindings are order-dependent; stale graph/fixture inputs cannot be detected; the selected callable cannot be traced uniquely to the derived obligation or generated test.
- **One-line code/test fix:** Validate a strict binding schema, require exactly one match, and bind its stable ID to obligation, graph, predicate, fixture, runtime target, and their digests.
- **Dependencies:** SMITHE-CRIT-002 and SMITHE-CRIT-003.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/bindings/key-door-binding.test.ts
  ```

### SMITHE-CRIT-005 — Test emission is fail-open and does not execute the generated assertion

- **Severity:** CRITICAL
- **Exact surface:** `projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.ts::emitTests/emitHybridTests`, lines 73-90 and 354-434; `src/cli.ts::runEmitTests`, lines 365-400.
- **Literal evidence:** legacy emission writes `it.todo(...)` for every obligation. Hybrid emission writes `it.skip(...)` when a binding is absent or fails and records a coverage gap, but the CLI prints the result and returns success. Neither emitter executes the generated file.
- **Missing behavior:** Completion can be green with zero assertions, skipped obligations, todo obligations, failed bindings, or an unexecuted generated test.
- **One-line code/test fix:** Add an S1 proof command that requires one runnable assertion, rejects any `todo`/`skip`/`needs_formal`/gap, executes the generated test, and records the runner result.
- **Dependencies:** SMITHE-CRIT-003 and SMITHE-MAJ-004.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/key-door-vertical.test.ts -t "executes one generated assertion with zero gaps"
  ```

### SMITHE-CRIT-006 — Existing receipts are not proof receipts

- **Severity:** CRITICAL
- **Exact surface:** `projects/domainspec-v2/impl/test-derivation-engine/src/residue/receipt.ts::ResidueReceipt/buildResidueReceipt`, lines 30-51 and 68-134; `src/minted-project/conformance-receipt.ts::MintedProjectConformanceReceipt`, lines 49-60.
- **Literal evidence:** `ResidueReceipt` accounts for normalized boundary residue; the minted receipt records conformance status, fixtures, cases, and a repeat digest. Neither contains the graph/source/rule-set/obligation/binding/test/evaluator chain, execution verdict, or killed mutations required by `DESIGN.md`'s receipt interface.
- **Missing behavior:** No verifiable artifact proves that the admitted source edge caused one obligation, one bound executable test, an independent evaluation, and the expected positive/negative result over identical digested inputs.
- **One-line code/test fix:** Define and verify an `EvolvableValidationReceipt` carrying all stage IDs/digests, exact counts, execution/evaluator verdicts, zero-gap residue, and named killed mutants; recompute rather than trust fields.
- **Dependencies:** SMITHE-CRIT-001 through SMITHE-CRIT-005.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/minted-project/key-door-receipt.test.ts
  ```

### SMITHE-MAJ-007 — Identity cannot detect rule-set, predicate, edge, or graph drift

- **Severity:** MAJOR
- **Exact surface:** `projects/domainspec-v2/impl/test-derivation-engine/src/identity/keys/index.ts::obligationKey`, lines 22-29; `src/ir/types.ts::Obligation`, lines 93-101.
- **Literal evidence:** the obligation key hashes only the current anchor, rule type, and parameters; the obligation has no `source_edge_id`, relationship/rule-set version, predicate digest, or graph digest.
- **Missing behavior:** A semantic change can retain the same obligation identity, so a stale binding or receipt cannot be rejected reliably.
- **One-line code/test fix:** Version the obligation-key preimage and include stable edge identity, rule-set/relationship version, predicate digest, and graph/source-manifest digest.
- **Dependencies:** SMITHE-CRIT-002 and SMITHE-CRIT-003.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl -w @domainspec/test-derivation-engine run test -- src/identity/keys/key-door-identity.test.ts
  ```

### SMITHE-MAJ-008 — The aggregate package gate omits the proof-bearing suites

- **Severity:** MAJOR
- **Exact surface:** `projects/domainspec-v2/impl/package.json::scripts.validate`, lines 17-32.
- **Literal evidence:** `validate` runs docs, relationship, content, tool tests, and `engine:lint`; it does not run `engine:test`, `typecheck`, tag composability, minted instances/conformance, any generated proof test, receipt verification, or mutation gate. `engine:test` exists only as a separate script.
- **Missing behavior:** The package can pass its aggregate gate without running even the present engine tests, much less the S1 vertical proof. A `CLEAN(0)` lint result is possible on an empty input.
- **One-line code/test fix:** Add `validate:evf-s1` for the complete key-door proof and include it, `engine:test`, and `typecheck` in the aggregate gate while keeping broad BTE completeness a separately named release gate.
- **Dependencies:** SMITHE-CRIT-001 through SMITHE-CRIT-006 and SMITHE-MAJ-007.
- **Exact validation command:**

  ```bash
  npm --prefix projects/domainspec-v2/impl run validate:evf-s1 && npm --prefix projects/domainspec-v2/impl run validate
  ```

## Minimal S1 build sequence

This is the smallest sequence that closes the causal chain without pulling the 13-kind/16-signature BTE breadth into the first proof.

1. **Machine semantic contract.** Extend the minted key-door Rule body with a typed Boolean predicate such as `eq(var("has_key"), bool(true))`. Put typed inputs and expected outcomes in a machine-owned binding/fixture artifact. Keep generated `SPEC.md` and any `operations.md` explanatory only.
2. **Minted-to-engine adapter.** Consume the compiled graph and source manifest, admit canonical `Rule --enforces--> Operation`, preserve edge provenance and all input digests, and fail on an empty or unsupported graph.
3. **Edge-based derivation.** Derive exactly one `enforces-operation` obligation from the admitted edge and predicate. Compare `O_gen` against an independently authored one-item `O_spec`; do not derive the expected set with the implementation under test.
4. **Strict binding and evaluator.** Resolve exactly one digest-bound binding to the real key-door operation and evaluate the Boolean predicate independently over the same typed fixture input.
5. **Emit and execute.** Generate exactly one runnable assertion; reject `todo`, `skip`, `needs_formal`, orphan obligations, missing bindings, and coverage gaps; execute the generated test through Vitest.
6. **Proof receipt.** Emit a recomputable receipt with graph/source/rule-set/obligation/binding/fixture/test/evaluator digests, `|O_spec|=|O_gen|=|T_gen|=|E_run|=1`, equality of the obligation sets, zero residue, and the execution/evaluator verdicts.
7. **Three killed mutations.** Run through the same path and record distinct rejection codes for: (a) predicate or operation-bypass mutation, killed by the generated assertion/independent evaluator; (b) reversed or mistyped endpoint, rejected at admission/derivation; (c) stale graph, predicate, binding, fixture, test, or receipt digest, rejected by receipt verification.
8. **Package gate.** Add `validate:evf-s1`, make it deterministic and fail-closed, and include it in the aggregate `validate`. Name the broader 13-kind/16-signature gate separately so S1 cannot be confused with release-wide completeness.

The terminal command for the sequence should be:

```bash
npm --prefix projects/domainspec-v2/impl run validate:evf-s1
```

Its success criteria are one admitted canonical edge, one expected obligation, one generated obligation, one binding, one generated and executed assertion, one independent evaluator result, one verified positive receipt, three killed negative controls, and zero gaps/todos/skips/needs-formal/orphans/stale digests.

## Direct prior challenges

### Ashby: defend the slice; reject the completion inference

The narrow key-door slice is the right first executable unit. Requiring all 13 relationship kinds and all 16 active signatures before the first causal proof would overload the experiment with release-scale variety and make failures hard to localize. But a narrow slice is adequate only if its regulator contains the failure variety that matters to that slice: wrong predicate/operation behavior, wrong endpoint or direction, and stale identity/digest. Without those three negative controls, the slice is a demo, not regulatory evidence. With them, it is a valid S1 pilot—not a package- or release-completeness claim.

### Lawvere: the current diagram does not commute

Naming `Graph`, `Obligation`, `Binding`, `Test`, `Evaluator`, and `Receipt` in a design does not supply the morphisms between them. Today the minted graph cannot map into the legacy `ConceptGraph`; even inside the legacy engine, the `enforces` edge is erased because derivation does not traverse edges. There is therefore no path whose composed output can be compared with a direct semantic evaluation. Completion requires explicit machine-readable adapters and receipt equations over the same digested source, not resemblance between generated artifacts.

The Lean commit-window manifest does not repair this gap. It inventories a 111-commit window containing unrelated formalization/build work, but the frozen corpus contains no checked Lean theorem or generated proof artifact for this key-door edge-to-receipt chain. It is context, not evidence for SWU-GCP-001.

## Verdict

Keep SWU-GCP-001 as the immediate implementation target and keep the vertical slice narrow. Reject any statement that the implementation or package gate is complete on the present evidence. The current repository proves source conformance and several useful components independently; it does not yet prove the required causal chain:

```text
canonical Rule -> Operation edge
  -> one edge-anchored obligation
  -> one strict digest-bound binding
  -> one generated and executed assertion
  -> one independent semantic evaluation
  -> one recomputable receipt
  -> predicate + endpoint + stale-digest mutations killed
```

Implementation completion becomes supportable for S1 only when that exact path is executable and `validate:evf-s1` fails closed. Release/package completeness remains blocked until the separate broad BTE coverage and aggregate gates are also implemented.
