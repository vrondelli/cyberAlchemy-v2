---
artifact_kind: invoke-plan-template-selection
status: pass
authority_effect: none
---

# Template Selection

| Need | Selected template/profile | Eligibility |
|---|---|---|
| global layer decisions | standalone `implementation-layering` | mandatory for Invoke Plan |
| executable source of truth | standalone split `work-pack` | more than five tasks/artifacts and multiple owner boundaries |
| wave choreography | `domainspec-spec` execution pack | high-complexity DomainSpec implementation |
| atomic execution | shared SWU manifest plus task-local SWU contracts | every mutation task requires bounded handoff |
| future admission | Work-Pack execution-entry projection | preserves exact authorized route and stop boundaries |

No template tie remains. No registry or template promotion is implied.

