# Design Transport

## Invoke Result

- Mode: design
- Spell: invoke
- Canonical ID: invoke
- Scope: library
- Phase status: pass
- Mode contract: `spells/invoke/design.md`
- Outputs: [ARCHITECTURE.md](ARCHITECTURE.md),
  [UX-PLAN.md](UX-PLAN.md),
  [GLOSSARY-CONSISTENCY.md](GLOSSARY-CONSISTENCY.md), this transport
- Design views: context, high-level structure, low-level components, workflow
  process, decision flow, dependency/interface
- Design selection:
  [DESIGN-SELECTION-RESULT.json](DESIGN-SELECTION-RESULT.json)
- Design evidence state: `design-validator-pass`
- Evidence ceiling: Design validation only
- Plan evidence: `plan-evidence-pending`
- Template/profile: DomainSpec architecture plus validator-selected UX,
  authority/trust, integration/versioning, persistence/concurrency, quality,
  security/abuse, state/event, and validation contracts
- Dispatch techniques: [TECHNIQUE-TRACE.md](TECHNIQUE-TRACE.md)
- Distill validation: pass; one thin witness architecture, atomicity deferred
  to Plan
- Implementation layering: required in Plan
- Work pack: not authored by Design
- Decisions: reuse existing workspace/runtime seam, exact gateway, Poker-Team
  browser journey, bounded Task Session closure audit, independent verifier
  deferred to L2, old package read-only
- Unresolved gaps: all planned runtime witnesses remain unexecuted
- Next route: plan

## Context Builder readiness

Plan can select exact Design handles and the approved source contracts without
reopening repository-wide discovery. Runtime handoff packs must still be
generated at Task Session time for one selected SWU.
