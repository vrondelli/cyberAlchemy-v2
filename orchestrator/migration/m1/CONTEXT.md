# M1 Context Pack

Status: session evidence  
Task: `M1 Establish canonical product shell`  
Mode: lean, strict  
Authority effect: none

## Obligations

| Obligation | Evidence | Status |
| --- | --- | --- |
| Create one standalone `orchestrator/` root | `../../PACKAGE.json` and `../../README.md` | covered |
| Keep product explanation in `product/` | product thesis, journey, and roadmap | covered |
| Keep authority and ontology shared at root | `authority/README.md`, `ontology/README.md` | covered |
| Make RWO an internal independently tested boundary | `rwo/README.md` and package dependency rules | covered |
| Declare every planned context without claiming migrated code | context README files | covered |
| Keep definitions candidate | package and README status fields | covered |
| Provide machine-checkable structure | `VALIDATION.json` | covered |

## Controlling context

- Migration plan, selectors `Decision`, `Target package shape`, and `M1`.
- Candidate Definition Pack, selectors `goal_limits`, `blocked_actions`, and `claim_ceiling`.
- M0 source manifest, selectors `selected_source_roots`, `rules`, and `counts`.
- User decisions placing `product/`, `authority/`, and `ontology/` at their current levels.

## Write scope

The package manifest, root README, product explanation, context boundary READMEs,
and three M1 evidence files only.

## Open Questions

M2 must decide the exact ontology projection and merged architecture content.
