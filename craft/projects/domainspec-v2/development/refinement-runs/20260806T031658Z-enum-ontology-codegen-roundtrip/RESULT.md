---
artifact_kind: refine-result
status: pass
execution_state: selection-ready
selected_swu: none
authority_effect: none
---

# Refine Result — Ontology-Interpreted Enum Realization Compiler

## Outcome

The design and executable Work Pack are complete. The implementation is not.

The package now describes a concrete route from one owner-frozen candidate Enum
snapshot to the selected TypeScript `defineEnum({...} as const)` protocol, with
an independent architecture proof that detects semantic member loss even when
TypeScript still compiles.

## What the ontology does

The architecture ontology is an active compiler input, not a visualization. A
new `ArchitectureRealizationSpec/v1` projector must read exact ontology/profile
bytes and determine:

- the applicable `architecture.EnumImplementation` realization type;
- required binding and Enum properties;
- property value types and observation stages;
- responsible owner and forbidden-inference rules;
- admitted constraint operators and representation protocol;
- direct versus composed realization scope; and
- unsupported outcomes that must fail closed.

The separate `EnumDefinitionSnapshot/v1` supplies the two domain members. The
prototype uses candidate-local `OrderStatus` data:

```text
status.pending -> pending
status.paid    -> paid
```

This separation keeps the ontology from inventing domain meaning and keeps the
definition from inventing architecture rules.

## Generated TypeScript target

```ts
export const OrderStatus = defineEnum({
  Pending: "pending",
  Paid: "paid",
} as const);

export type OrderStatus = EnumValue<typeof OrderStatus>;
```

This is not native TypeScript `enum`. `as const` preserves the literal type;
the owned `defineEnum` provider supplies runtime identity and freezing. The plan
tests type union, exact provider import, runtime values, and runtime frozen state
separately.

## Architecture proof

The accepted proof process is:

1. freeze an expected-red ontology realization contract before projector code;
2. derive the realization spec from exact ontology/profile handles;
3. independently freeze the full `enum.member-bijection@1` payload;
4. validate candidate definition and TypeScript target binding;
5. normalize a target-neutral IR;
6. safely emit, reparse, and deterministically re-emit TypeScript;
7. compile in a mirrored isolated workspace with independent witnesses;
8. observe actual generated source without caller-supplied expectations;
9. evaluate exact member identity/value bijection independently;
10. remove only the binding-selected `Paid` AST property;
11. require mutation compilation to remain green and evaluation to produce only
    `ARCH_ENUM_MEMBER_MISSING` for `status.paid`;
12. atomically publish raw evidence through the proof state machine; and
13. reconstruct positive and negative results in a separate process/workspace.

That follows the earlier obligation/test-derivation discipline in architecture
terms: frozen catalogue, immutable case, executable positive, causal negative,
proof receipt, and raw reconstructive replay.

## Work Pack

- Entry: `stages/09-invoke-plan/WORK-PACK.md`.
- Complexity: high, split.
- SWUs: 14, all atomicity-validated.
- First candidate: `SWU-ARE-001`, still not selected.
- Closeout coverage: 14/14 mutation-capable SWUs.
- Current execution state: `selection-ready`.
- Allowed current-frontier routes: exact Task Session ARE-001 plus exact
  closeout; digest
  `ef6390f115403c655a73ab55060e5786157ef2b505adbd8cb6156a783fc489ca`.
- Plan Distill: pass.

The first unit is deliberately small and reversible: it adds only the red
architecture-realization schema/fixtures/verifier/receipt. It changes neither
the ontology nor implementation.

## Decisions fixed

- Portable minimal IR plus target binding, not direct ontology-to-TypeScript or
  a TypeScript-specific semantic IR.
- Candidate definition snapshot, not an overstated canonical `OrderStatus`.
- Ontology-derived property spec as a required compiler input.
- Independent catalogue/evaluator path with forbidden imports.
- Safe printer/reparse boundary; no direct data interpolation.
- Separate compile-time `as const` and runtime `Object.freeze` evidence.
- AST-selected one-node mutation, not text replacement.
- Atomic evidence state machine and separate-process raw replay.
- Isolated generated source for the first proof; no checked-in product-output
  policy yet.

## Open but non-blocking

- Canonical owner issuance for a real domain `OrderStatus` snapshot.
- Direct Enum obligation breadth beyond member bijection.
- Composition/alias/relation evidence.
- Python and Rust target packages and cross-language parity.
- Checked-in generation, stale output removal, packaging, release, and
  deployment decisions.

## Claim ceiling

This run proves that Definition, Design, and Plan artifacts are internally
validated and execution-ready at the first frontier. It does not prove that the
ontology projector, generator, compiler route, evaluator, mutation, replay, or
UI exists or passes. It performs no canonical promotion, product mutation,
publication, release, deployment, Git commit, or push.

## Next route

Inspect the Design or Work Pack now. If implementation is desired later, use the
Work Pack's `implementation-readiness:execute` entry. It can select ARE-001
directly from the captured frontier; it should not rerun broad discovery or
Invoke Refresh merely to rediscover the same plan.
