# Whisper review — human-understandable release roadmap

Date: 2026-07-14  
Transport: self-serve interactive HTML  
Status: candidate; implementation revised; human comprehension not yet independently proven

## Objective and audience

Revise the existing roadmap so an authorized DomainSpec owner or technical collaborator
who is not immersed in the release vocabulary can quickly understand:

1. whether DomainSpec v2 can be released now;
2. what has actually been decided;
3. which step happens next and why;
4. how the release path fits together;
5. what Body War must prove; and
6. where exact claims and sources can be inspected.

This review does not broaden or narrow the first-release contract. It changes only how
the generated projection communicates that contract.

## Review findings

### 1. The page opened with machinery, not situation

The previous opening exposed an operational read model, raw Craft stage/gate, graph
counts, and a long source `next_move`. A reader first needed to understand the governance
system before learning the simple truth: direction is agreed, but the release is not.

### 2. Raw identifiers were doing the work of prose

States such as `partial-false-green` and steps such as
`CP-09-cross-graph` are useful exact keys, but they are not self-explanatory product
language. The UI presented them as primary meaning instead of traceable detail.

### 3. The exact graph arrived before a mental model

The dependency graph is necessary for inspection, but it is not the smallest coherent
explanation of the release. Without a phase overview, sixteen nodes across dependency
levels read as a control surface rather than a path.

### 4. Research and Body War were described from the ledger's point of view

The five frontiers emphasized joins, statuses, and re-triage triggers. The Body War path
emphasized critical-path IDs. Both omitted the first human question: what are we trying
to decide or prove?

## Selected revision

The page now uses a two-layer contract:

- Human layer: current situation, now/next, five phases, readable node names, plain
  status sentences, question-shaped frontiers, and action-shaped Body War steps.
- Exact layer: source names, raw states, release timing, owner routes, artifacts, proofs,
  negative controls, exits, omission costs, provenance, reopen triggers, IDs, Craft state,
  and fingerprint.

The exact layer is never removed. It is revealed on demand after the reader has a usable
model of the work.

## Claim safeguards

- The header still says release is not authorized.
- The page does not say DomainSpec v2, Body War, the test engine, formal validation, or
  graph equivalence is complete.
- `Full coverage` is not claimed. The page says coverage is against a declared,
  independently derived obligation denominator.
- Formal checking stays bounded by a selected language, solver, and explicit limits.
- Human labels are presentation copy with fallbacks; Craft and the manifest remain the
  two authority sources.

## Validation gate

Mechanical checks must prove generation, source synchronization, mapping coverage,
interaction, layout, and claim-boundary visibility. They cannot prove human
comprehension. That gate remains open until an intended reader can explain the current
state and next move without help.

## Validation result

- Deterministic builder check: pass; generated JSON and HTML are synchronized.
- Unit and contract suite: pass, 10 of 10 tests.
- Translation coverage: pass for 16 FPR nodes, 5 frontiers, and 14 Body War steps.
- Desktop browser at 1440 by 1000: pass.
- Mobile browser at 390 by 844: pass; the dependency graph remains the only intentional
  horizontal-scroll surface.
- Default orientation: pass; FPR-01 is selected on load.
- Search: pass; `test engine` resolves FPR-07.
- Progressive disclosure: pass; the exact FPR-01 source name, raw state, artifacts,
  negative controls, provenance, and reopen trigger remain inspectable.
- Browser console: pass, zero errors and zero warnings.
- Claim boundary: pass; `Release status: not authorized` remains visible at the top.
- Human comprehension: flag; browser evidence proves presentation behavior, not that an
  intended reader formed the correct mental model.

Browser evidence:

- `output/playwright/fpr-roadmap-human-desktop.png`
- `output/playwright/fpr-roadmap-human-mobile.png`
