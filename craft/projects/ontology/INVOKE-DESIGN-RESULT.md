---
title: Invoke Design Result - Ontology Materialization Architecture
status: flag
mode: invoke-design
created: 2026-06-18
---

# Invoke Design Result

- Mode: design
- Spell: invoke
- Canonical ID: invoke
- Scope: library
- Phase status: flag
- Mode contract: `arcanum/spells/invoke/design.md`
- Outputs:
  - `projects/ontology/ARCHITECTURE.md`
  - `projects/ontology/GLOSSARY-CONSISTENCY.md`
  - `projects/ontology/INVOKE-DESIGN-RESULT.md`
- Design views:
  - context
  - high-level structure
  - low-level components
  - workflow process
  - decision flow
  - dependency interface
- Template/profile selection:
  - `invoke.architecture` candidate template from `arcanum/spells/invoke/templates/architecture/architecture.md`
  - discovery-mode design accepted from reviewer-approved research packet instead of approved define outputs
- Glossary consistency: flag
- Implementation layering: gap recorded
- Work-pack: n/a
- Complexity: medium
- Per-layer planning: n/a
- Implementation detail: n/a
- Smallest working units: n/a
- Refresh: n/a
- Target artifact: `projects/ontology` ontology materialization fixture architecture, owner/cycle `ontology materialization design`
- Decisions:
  - authored architecture in `projects/ontology/` rather than public `arcanum/`
  - treated the model as build-from-owned witness architecture, not a new doctrine
  - kept branch-as-view under OD-1 candidate projection
  - kept B3 run-view blocked pending OD-2 legal producer
  - limited CSV to evidence/index usage, not authority
- Unresolved gaps:
  - invoke gaps: no approved define/spec/glossary baseline; discovery-mode design used instead
  - target artifact gaps: OD-1, OD-2, OD-3, OD-4, OD-5, Operational Ontology acceptance, implementation layering, work-pack, validation fixtures
- Next route: plan

## Design Transport

Use this packet as the input to `invoke plan` for a small fixture materialization work-pack.

Plan-mode should produce:

- implementation layering,
- first-slice write scope,
- SWU manifest,
- validation strategy,
- work-pack tasks for:
  - source manifest and evidence card,
  - ontology candidate and PromotionRecord fixture,
  - governed bridge projection and OD-1 candidate projection stubs,
  - context-builder proof.

Do not route directly to broad execution unless the user narrows the task-session to the first fixture only.
