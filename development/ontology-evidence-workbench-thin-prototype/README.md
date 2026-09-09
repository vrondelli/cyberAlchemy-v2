# Ontology Evidence Workbench Thin Prototype

This is a clean Invoke development-authoring package for the first local,
browser-testable Ontology Evidence Workbench witness.

It is deliberately not a JavaScript package:

- it has no `package.json`;
- it does not own dependencies, a runtime, or a workspace root;
- it does not copy Understand-Anything manifests or `node_modules`;
- it does not modify or supersede
  `cyberAlchemy-v2/development/ontology-evidence-workbench/`;
- implementation remains in the existing
  `cyberAlchemy-v2/implementation/ontology-evidence-workbench/` adapter seam.

## Navigation

- [Bounded context](CONTEXT-PACK.md)
- [Approved intent](INTENT-RECORD.md)
- [Define specification](define/SPEC.md)
- [Architecture](design/ARCHITECTURE.md)
- [Poker-Team UX witness](design/UX-PLAN.md)
- [Implementation layering](planning/IMPLEMENTATION-LAYERING.md)
- [Executable work pack](planning/WORK-PACK.md)
- [Invoke result](INVOKE-RESULT.md)

## Evidence ceiling

This package can prove that Define, Design, and Plan artifacts are authored and
validated. It cannot prove a working browser prototype, ontology correctness,
promotion, release, or production readiness. Those claims require the planned
runtime receipts.
