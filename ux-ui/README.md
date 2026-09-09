# UX/UI

Status: candidate with boundary
Owner: CyberAlchemy v2 UX/UI route

This folder holds candidate UX/UI knowledge governance surfaces for
CyberAlchemy v2. It starts with an interface definition because UX/UI knowledge
can become reusable only when lessons, browser evidence, screenshots, human
judgment, validator rules, and promotion decisions stay distinct.

Current candidate interface:

- [UX-UI-KNOWLEDGE-GOVERNANCE.md](UX-UI-KNOWLEDGE-GOVERNANCE.md)
  defines how `ux-lessons`, `ux-evidence-validator`, and
  `ui-prototyping-studio` form the UX/UI knowledge governance interface without
  becoming authority by themselves.

UX/UI artifacts should distinguish:

- interface or session evidence,
- candidate lessons and patterns,
- validator-safe claim maps,
- browser-observed evidence,
- screenshot review,
- human-study or expert-review residue,
- promoted decisions,
- implementation consequences.

## Open Questions

### OQ-1. What is the first promoted UX/UI artifact?

Context: the current surface defines the governance interface, not a promoted
pattern library. Recommendation: run one complete experience evidence lifecycle
from real session evidence into a pattern candidate, validator claim map, and
owner promotion request before treating any UX/UI pattern as repository
authority. Status: OPEN.
