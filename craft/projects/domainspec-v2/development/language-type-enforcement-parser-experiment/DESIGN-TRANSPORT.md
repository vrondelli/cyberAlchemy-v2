---
module: language-type-enforcement-parser-experiment
feature_code: LTE
status: draft
updatedAt: 2026-07-17
docType: invoke-design-transport
---

# Invoke Design Transport: Language Type-Enforcement Parser Experiment

## Mode Result

| Field | Value |
| --- | --- |
| Spell / mode | `invoke design` |
| Target artifact | parser experiment architecture; DomainSpec v2 implementation cycle |
| Approved input | accepted language/type-enforcement findings |
| Template/profile | DomainSpec architecture bundle, adapted to an experiment-local implementation design |
| Six-view coverage | complete: context, high-level structure, low-level components, workflow process, decision flow, dependency/interface |
| Glossary consistency | pass |
| Upstream mutation | none |
| Design Distill | Proposer + Balancer reconciliation `PASS` after bounded repairs |
| Phase status | complete; plan-ready |
| Next route | `invoke plan` |

## Design Decisions Carried Forward

1. L0 shares only Concept Registry structural parsing.
2. Both consumers retain their downstream responsibilities, output carriers,
   exact key prose, and exit conventions; stable code prefixes and intended
   fail-closed rejections are the only allowed deltas.
3. Exact diagnostic codes and parse accounting are acceptance-critical.
4. FPR-02 retains unknown-type/profile admission.
5. Invoke performs no implementation or authority mutation.
6. The shared leaf lives in the existing derivation-engine package behind the
   `@domainspec/test-derivation-engine/concept-registry` subpath.
7. The registry grammar and exact-cause precedence are frozen in the architecture
   contract before implementation planning.

## Template Selection Evidence

The DomainSpec architecture profile is the sole eligible normal-design profile:
the target has an approved DomainSpec research baseline, typed local vocabulary,
two existing implementation consumers, and a required six-view handoff. The
`research` companion is not selected because the evidence question has already
been answered and audited. UX, spell, and sigil profiles do not fit the target.

## Dispatch Technique Trace

Selected: `sequence`, `artifact_contract_bridge`, `concrete_path_evidence`,
`owner_boundary_check`, `residue_ledger`, and `handle_handoff`. Each is mapped
to a concrete architecture section and validation expectation in
[ARCHITECTURE.md](ARCHITECTURE.md). A full dispatch document is not needed for
this straight repository-local authoring-to-Task-Session route.

## Context Builder And Interview

- Context: lean, strict, 8 files, 8/8 obligations covered.
- Interview: gap-check, zero questions, pass; no blocker ambiguity remains for
  structural L0.
- Context Builder readiness for later execution: the plan must name source
  anchors, write scope, exact validation commands, and the dirty-overlap
  preflight, but must not generate the runtime pack now.

## Gaps And Owners

| Gap | Blocking for L0? | Owner / route |
| --- | --- | --- |
| supported-profile and unknown-schema admission | no | FPR-02 Decision Gate and later SWUs |
| durable parse-manifest/receipt schema | no | parser/observability owners after L0 evidence |
| TypeScript/Lean authority projection | no | formalization + definitions owners |
| translation/judgment preservation | no | minted/derivation + Framework language owners |

## Distill Repair Ledger

| Review flag | Incorporated repair |
| --- | --- |
| assurance claim too broad | introduced experiment-local `RegistryParsedCompletely(spec)` and made whole-spec proof explicitly out of scope |
| grammar/primary cause underspecified | fixed heading, cardinality, header, separator, row, and multi-fault precedence rules |
| observable code bridge absent | selected additive `[LTE-*]` diagnostic prefix and consumer-surface parity |
| compatibility ambiguous | added an explicit allowed/forbidden behavior-delta matrix |
| package boundary hidden | selected a pure leaf plus package subpath in the existing engine workspace |
| navigation/expiry absent | added start-here order and concrete frame-expiry triggers |
