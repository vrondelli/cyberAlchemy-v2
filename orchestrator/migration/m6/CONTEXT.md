# M6 Context Pack

Status: session evidence  
Task: `M6 Implement API, Control Center, Gateway packaging, and explanations`  
Mode: standard, strict  
Authority effect: none

## Obligations

| Obligation | Evidence | Status |
| --- | --- | --- |
| Expose canonical runtime through one transport API | `api/src/lib.rs` and API journey tests | covered |
| Persist immutable proposals and templates | API store and restart/immutability tests | covered |
| Keep proposal creation separate from admission | API intents, UI disclosure, and journey test | covered |
| Support button-ready Run Templates without bypassing proposal review | capability/API/browser tests | covered |
| Explain state, cause, next action, and authority boundary | run projection and browser evidence | covered |
| Present recovery without guessing unknown effects | API/UI and frontend tests | covered |
| Keep ARE Gateway an optional adapter boundary | adapter endpoint, compose override, and guide | covered |
| Serve browser deep links with successful status | API test and live browser response | covered |
| Validate responsive and keyboard behavior | Playwright evidence at three viewports | covered |
| Package the local service without deploying it | Docker/Compose files and config validation | covered |

## Controlling sources

- M2 architecture, M4 runtime, and M5 orchestration capabilities.
- Candidate ORCH-D3, D15-D19, D39-D46.
- Prior scoped Tastecheck HOLD used only as a regression source.

## Decisions

The first API uses Axum and file-backed resource stores beside the runtime. The
first Control Center uses browser-native modules and semantic HTML, avoiding a
second frontend state model or build dependency. Run Templates remain distinct
button-ready presets that always produce a reviewable Dispatch Proposal.

## Write scope

`orchestrator/api/`, `frontend/`, `deployment/`, M6 operator docs, the Run
Template capability/contract, M5 synchronization, M6 evidence, and package
frontier.

## Open Questions

Live Gateway transport, authentication, chat authoring, result/lifecycle views,
backups, monitoring, and independent human UX review remain open.
