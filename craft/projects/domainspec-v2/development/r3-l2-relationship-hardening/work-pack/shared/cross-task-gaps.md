---
module: r3-l2-relationship-hardening
status: draft
updatedAt: 2026-07-02
docType: cross-task-gaps
---

# Cross-Task Gaps

| Gap ID | Description | Affects Execution? | Owner | Handling |
| --- | --- | --- | --- | --- |
| R3H-GAP-BELONGING-KIND | Current flat graph cannot express per-instance belonging kind. | no | relationship authority owner | Use root `semantic_kinds`; split later if evidence requires. |
| R3H-GAP-CATEGORY-LAWS | Full category laws are not finite validator obligations today. | no | research/definitions-governance | Defer outside R3H. |
| R3H-GAP-DEPENDS-ON | `depends-on` lacks dependency-kind and reject/allow witness. | no | definitions-governance | Keep deferred residue. |
| R3H-GAP-VALIDATOR-DEPTH | Some metadata checks may begin as review checks if structural validation would be disproportionate. | no if recorded | implementation owner | Prefer loader tests; allow documented review check for non-machine fields. |
