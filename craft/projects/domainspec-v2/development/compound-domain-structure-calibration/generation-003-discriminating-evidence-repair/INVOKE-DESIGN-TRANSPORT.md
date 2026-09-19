---
invoke_mode: design
phase_status: pass
source_define: SPEC.md
---

# Invoke Design Transport

## Outputs

- `ARCHITECTURE.md`: context, structure, components, workflow, decision, and
  dependency/interface views.
- `GLOSSARY-CONSISTENCY.md`: 8/8 local terms linked with no conflict.
- `DESIGN-RISKS.md`: ten owned risks and controls.

## Profile Selection

The DomainSpec six-view architecture profile is selected because the approved
Define package contains explicit evidence contracts, state namespaces,
workflows, decisions, and external interfaces. No competing profile is equally
eligible.

## Design Gate

PASS. All six views are present; every component has inputs, outputs, and
failure behavior; temporal and authority boundaries are explicit; glossary
consistency passes; and browser/source, UI-repair/calibration, and
evaluation/promotion ownership remain separate.

## Handoff

Invoke Plan may create a high-complexity split work-pack. First execution must
prove contracts and browser preflight before generating observation evidence.
