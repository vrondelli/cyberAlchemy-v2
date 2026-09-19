---
tags: [translator, receipt, stage-b, functor-validation, refinement-run]
node_type: receipt
is_session: true
layer: [application]
nature: reference
status: draft
version: 0.1.0
last_updated: 2026-06-08
---

# RECEIPT — translator-designer (s6)

- **Core mapping approach.** `T` is the missing dual of `MarkdownToSpec`: it lifts
  LLM code → the existing Lean `Spec` (`Richness.lean:58`) — same output type
  `gradeFor` already consumes (`ZagrMarketplaceGen.lean` shape). Four inputs map by
  table: (a) `domainspec` source tags → `metaOf`/`EdgeType` by identity rename of
  `TAXONOMY.md`/`RELATIONSHIPS.md` labels onto `Sigma.lean:13/28`; (b) architecture
  pattern cards → structural `Meta`/edge inference; (c) composability rules used
  only as the `sigmaValid` admissibility *filter*, never an edge generator; (d)
  GitNexus symbols/calls/flows → candidate morphisms, σ-filtered to a unique edge.
- **Determinism guarantee.** `T` is total and pure: strict tier precedence
  (tag ≻ pattern ≻ graph), σ-decidability + `Sigma.lean` declaration-order
  tie-break, lexical object/edge sort, no scoring/sampling/NL/LLM. Pinned GitNexus
  snapshot ⇒ same code → byte-identical `Spec`. Table lookups, not heuristics.
- **Provenance split.** Reuses `EdgeProvenance` (`Richness.lean:17`): tag edges =
  `.declared` (code's own claim), pattern edges = `.contextInferred`, σ-filtered
  graph edges = `.sigmaFallback` (`T`-introduced). Firewall against laundering
  (DISTILL F3): P4 grades `declared`/`contextInferred` ambiguity FAIL,
  `sigmaFallback` WARN — so `T`'s inference noise is never blamed on the code.
- **Hardest residue case 1 — σ-untypable graph edge.** A GitNexus call whose
  endpoint metas have no `sigmaValid` triple (e.g. any R_U/UI-intra edge,
  `Sigma.lean:83`): cannot be `wellTyped`, so it is demoted to `sigmaFallback`→WARN
  or dropped to `unresolvedRefs`. It is named, never forced into a fake edge.
- **Hardest residue case 2 — the two-directional partial map (DISTILL F2).**
  Un-tagged/un-patterned code with no `Meta` = unspecified-behavior residue
  (excluded from `concepts`, recorded in sidecar); Stage-A spec concept with no
  code counterpart = unimplemented residue (diff of `concepts` vs Stage-A
  `ConceptSpace`). `F` is partial/lax — no `Functor.Full`, no zero-residue,
  intent stays above the Intent Wall.
- **Artifact:** `stages/s6-invoke-design/TRANSLATOR-DESIGN.md` (design-only, no code).
