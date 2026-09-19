---
node_type: define
is_session: false
status: candidate
created: 2026-07-01
authored_by: invoke (mode: define)
target_artifact: meta-type formalization — checkable definitions for the 25 meta-types (+ edge signatures) enabling content validation
scope: projects/domainspec-v2 (spec taxonomy + a content validator)
owner_route: definitions-governance (the definitions) + layering-governance (the type catalog) + validation-governance (the validator)
source_contracts:
  - impl/spec/TAXONOMY.md (the 25 meta-types, descriptive catalog)
  - impl/spec/RELATIONSHIPS.md (the 29 typed edges)
  - definitions/DEFINITIONS.md (domainspec-v2-D* governance/synthesis vocab, incl. domainspec-v2-D3 edge-law admissibility — governs edge decisions; DS-D* domain vocab pending)
promotion_boundary: PUBLIC validation criteria only; the engine `src/rules` δ-derivation stays private (moat).
---

# Define — Meta-Type Formalization

## Intent

Turn the 25 meta-types from **descriptive prose** (TAXONOMY.md: examples, "when to use") into **formal,
machine-checkable definitions**, each in **its own category**, so DomainSpec can **validate a new aspect
file's content by types + edges** — i.e. answer *"is this concept a well-formed Entity? is this edge
admissible given its endpoints' types?"* mechanically, not by human judgment.

The wall this removes (from the 2026-07-01 discussion): without a formal criterion per meta-type, a
validator can only check that *declared* types are *consistent* with edge signatures — it cannot check
that a concept is *correctly* typed or its content well-formed. This package supplies the missing formal
layer + the validator that runs it. It is the *"govern + enforce Ontology A on evidence"* mandate made
concrete.

## The gap (why this is not redundant with TAXONOMY.md)

`TAXONOMY.md` is **descriptive** (prose, examples). A formal criterion is **checkable** (a predicate).
Different kinds — so a formal layer is a *new distinction*, not a duplicate (clean under `domainspec-v2-D3` /
CAV2-D22 orthogonality). Where it physically lives (a formal field in TAXONOMY.md vs per-type cards in
`definitions/`) is a **design decision** (see DESIGN §DES-D1), not settled here.

## The falsifiable claim (pre-registered — freeze before build)

> For each meta-type, a **checkable well-formedness criterion** + its **edge-participation signature** can
> be stated such that a validator, given an aspect file, deterministically **accepts** well-formed
> concepts/edges and **rejects** malformed ones — with a positive and a negative fixture per type.

**SURVIVED** iff, per formalized type: (a) a criterion exists that a validator runs; (b) a **positive**
fixture (valid instance) passes; (c) a **negative** fixture (malformed) is rejected (discriminating);
(d) the type's edge-participation signature is stated + checked; (e) an **automated test** asserts the
validator's accept/reject over fixtures (not only a manual run). **FALSIFIED** for a type if its
well-formedness cannot be made checkable without running the implementation (that would collapse into the
engine's derivation — a moat/boundary violation) — recorded, not forced.

Passing = **the meta-type is a checkable type**, NOT proof the engine derivation is correct (separate) and
NOT authority to expose the δ-rules.

## Scope & sequence

- **In scope:** the 14 backend meta-types first (derivation-critical), then the edge signatures (DS-D8),
  then the content validator, then **machine-generated instance validation** (generate a YAML instance of a
  schema + validate it — refresh 2026-07-02). UI-11 deferred (validate-before-broaden).
- **Organized by category** (per the ask — "meta type value with its own category"): Structural /
  Behavioral / Connective / Lifecycle (+ UI-* later).

## Glossary

- **meta-type** — one of the 25 DomainSpec concept types (Entity, Rule, …); the node alphabet.
- **formal criterion** — a checkable predicate: a concept is a well-formed instance of type T iff <criterion>.
- **edge-participation signature (DS-D8)** — which edges a type may be the source/target of (endpoint typing).
- **content validator** — the tool that checks an aspect file: every concept satisfies its type criterion + every edge matches its signature.
- **instance** — a concept normalized to structured YAML data conforming to its meta-type schema (`<concept>.instance.yml`); the machine-readable form.
- **instance validator** — checks a machine-generated instance against its meta-type `.schema.yml` (the same criterion, applied to YAML data instead of markdown tables).
- **category** — the grouping a meta-type belongs to (Structural / Behavioral / Connective / Lifecycle / UI-*).

## Non-goals
- Exposing or re-deriving the engine `src/rules` δ-algorithm (moat).
- Formalizing UI-11 in the first pass (deferred).
- Building the runtime/agent layer (this is spec-time content validation).

## Open decisions (surfaced)
- **DEF-D1 — placement:** **RESOLVED 2026-07-02 (refresh) → per-type `schema + md` pair** —
  `meta-types/<category>/<type>.schema.yml` (machine) + `<type>.md` (companion), authored in this dev
  package first; the validator loads the schemas; `definitions/DS-D1` cites the set. Supersedes the earlier
  "TAXONOMY.md-formal-upgrade" recommendation. See [REFRESH-2026-07-02.md](./REFRESH-2026-07-02.md).
- **DEF-D2 — validator owner/relationship to the engine:** the content validator is a
  **validation-governance** method distinct from engine derivation; must stay consistent with the engine's
  per-type parsing without duplicating the δ-rules.
- **DEF-D3 — instance source: RESOLVED 2026-07-02 → (B) canonical example generated from each schema.**
  For each `.schema.yml` the generator emits `<type>.example.instance.yml` (conforming by construction from
  the criterion); the instance validator checks it — a self-test that every schema is instantiable and that
  the instance validator agrees with the criterion. (A) aspect-file round-trip and (C) both remain future
  options. The generator normalizes shape only (no δ-rules); the instance validator is public structural
  (validators-as-moat #1). Built as MT-INST.
