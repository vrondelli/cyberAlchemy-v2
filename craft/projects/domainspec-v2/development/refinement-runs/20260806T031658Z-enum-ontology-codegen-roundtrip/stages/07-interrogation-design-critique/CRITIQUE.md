---
artifact_kind: interrogation-design-critique
status: block-until-repaired
authority_effect: none
---

# Design Critique — False-Green and Ontology-Use Audit

## Verdict

Block the first authored design from entering Plan until all findings below are
repaired. The component separation is sound, but the draft still permits the
ontology to become decorative and omits several independent proof boundaries.

## Findings

### DCR-01 — Ontology is evidence context, not a compiler input

Severity: blocker.

The draft normalizer consumes only `CanonicalEnumDefinition/v1`. That can emit
TypeScript without reading the architecture ontology at all, which does not
satisfy the intent that the architecture package use an ontology to understand
the realization's properties.

Required repair: add `ArchitectureRealizationSpec/v1`, derived from exact
ontology/profile handles. It must name `architecture.EnumImplementation`, the
required architecture properties/operators, direct composition status, binding
rules, observation requirements, and unsupported outcomes. The normalizer must
consume this spec as well as the semantic definition. The catalogue owner must
independently derive its expectations from the same frozen ontology/profile
sources without importing compiler derivation code.

### DCR-02 — “Canonical” concrete `OrderStatus` authority is not present

Severity: blocker.

The repository supplies the canonical Enum meta-type identity and a candidate
implementation ontology, but this refinement has not identified an authoritative
concrete `OrderStatus` instance. Naming the test input
`CanonicalEnumDefinition/v1` overstates the proof.

Required repair: use `EnumDefinitionSnapshot/v1`. Its prototype instance is an
owner-frozen candidate fixture referencing active Enum meta-type identity; it has
`authority_effect: none` and cannot promote itself. A later canonical-definition
owner may issue the same schema with a stronger authority reference.

### DCR-03 — Current adapter accepts caller-supplied expectations

Severity: blocker.

The live `projectTypeScriptEnum` input includes `expectedValues` and emits
`binding.expected_enum_values`. Reusing that projection as both observed and
expected truth would reproduce the current self-authorship risk.

Required repair: keep the existing entry point as regression evidence, but add a
generated-source observation entry point/contract whose architecture verdict
uses only observed member records plus owner-frozen binding/profile handles. The
new evaluator must ignore or reject caller-supplied expected-value facts.

### DCR-04 — Evidence persistence is absent from the concern denominator

Severity: blocker.

The workflow persists raw source, compiler diagnostics, observations, mutations,
and receipts, but the manifest declares no writer or data/log sink. Retention,
redaction, path leakage, concurrent writers, and supersession are therefore not
selected design concerns.

Required repair: model one run-scoped evidence writer/store/sink, single-writer
atomic publication, opaque repository-relative references, retention until
explicit supersession, and a no-source-fragment-in-normalized-diagnostics rule.

### DCR-05 — Target binding can become a code-injection surface

Severity: blocker.

Module paths, export/type/member identifiers, provider specifiers, and semantic
string values cross from data into source. “Owner frozen” does not make unsafe
text safe.

Required repair: require repository-relative non-escaping module paths, admitted
module specifiers, TypeScript identifier validation, safe string-literal
serialization, unsafe-key rejection, and post-print parse validation. Select a
security/abuse concern and add discriminating hostile-input fixtures.

### DCR-06 — Compile/type witness could be emitter-authored

Severity: blocker.

If the emitter writes both generated source and the assertion that its value
union is correct, a bug can rewrite its own test.

Required repair: make the compiler witness template independently owned. It
must derive the expected union from the frozen definition/catalogue, import only
the generated public export, and be digest-bound separately from emitter output.

### DCR-07 — Isolation conflicts with exact provider-path checks

Severity: blocker.

The current adapter resolves the `defineEnum` import to an exact provider path
and validates that path/digest against the profile. An arbitrary temporary source
directory will fail this check or encourage weakening it.

Required repair: build a mirrored isolated workspace containing exact copies of
the provider, profile, activation receipt, generated source, and compiler witness
under deterministic repository-relative paths. Bind every copied byte and reject
symlink/path escape. Do not relax the adapter's provider identity check.

### DCR-08 — Text deletion is not a causal mutation contract

Severity: blocker.

Deleting a matching string can change an import, type witness, comment, or more
than one property while still being labeled “remove Paid.”

Required repair: parse the exact green source, locate the `Paid` property by
owner-frozen target binding, remove exactly that AST node, reparse, and compare a
normalized AST delta. The mutator must prove one property deletion and no other
semantic change.

### DCR-09 — `as const` and runtime immutability are conflated

Severity: major.

`as const` preserves literal types at compile time. It does not freeze an object
at runtime. Runtime immutability comes from the owned `defineEnum` provider's
`Object.freeze` behavior.

Required repair: keep separate witnesses for literal-union typing, exact provider
import, runtime values, and runtime frozen state. A native `enum` or a plain
`as const` object must not satisfy the owned runtime protocol.

### DCR-10 — State and output publication lack an explicit lifecycle

Severity: major.

The workflow orders steps, but does not name legal proof states or prevent a
partial run from appearing complete.

Required repair: model `prepared -> generated -> compiled -> observed ->
evaluated -> mutation-killed -> replayed -> proof-complete`, with terminal
`blocked` from any gate. Only the proof binder may publish `proof-complete`, and
only after exact total accounting.

## Required Stage 08 disposition

Stage 08 must repair all ten findings, rerun the Design scope extractor and
two-pass selector against new digests, and produce a machine-readable verdict.
No finding is accepted as deferred for the first proof unit.

