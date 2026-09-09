---
tags: [architecture, agents, refactoring]
node_type: constitution
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-03-24
timestamp: 2026-03-24T09:47:00-03:00
expires: 2026-05-23
conversation_id: 409f5d98-ca2a-4e30-b281-a9f36d17eaa1
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "Ratified the 'Single Level of Abstraction' and 'Anti-God Functions' rules into the project constitution and agent workflows to strictly prevent monolithic orchestrators."
---

# Ratifying Single Level of Abstraction (SLA) & Anti-God Functions

**Date:** 2026-03-24 09:47 (UTC-3)
**Tags:** #architecture #agents #refactoring

## Summary

The session was initiated because the CCB upload and text extraction code had grown into "God Functions" with multiple responsibilities and low levels of abstraction. The goal was to update the project constitutions and agent guidelines to prevent this pattern from recurring. 

We ratified the Single Level of Abstraction (SLA) rule within `constitution_developement_practices.md` and updated `AGENTS.md` to explicitly route any refactoring or coding tasks to this constitution. Additionally, we drastically improved the `.agent/workflows/refactoring.md` workflow, translating it to English and structuring it as a strict 3-phase protocol that forces agents to break down monoliths into cohesive `step_functions` before adding new features.

### Enforcing Single Level of Abstraction
- **Problem/Goal:** Functions were mixing high-level orchestration with low-level I/O manipulation (e.g., regex, HTTP requests).
- **Decision:** Establish a strict constitution rule prohibiting "God Functions" and enforcing pure domains with distinct, modular `step_functions`.
- **Changes:** Appended the "Single Level of Abstraction (SLA) & Single Responsibility" clause to `constitution_developement_practices.md`.

### Agent Coding Guidelines
- **Problem/Goal:** `AGENTS.md` was acting as a context router but lacked explicit pointers to the development constitution during coding tasks.
- **Decision:** Keep `AGENTS.md` lean but mandate reading the development practices alongside the refactoring workflow.
- **Changes:** Spliced an explicit `READ` instruction into `AGENTS.md` to fetch the SLA engineering principles.

### Refactoring Workflow Overhaul
- **Problem/Goal:** The existing `refactoring.md` was in Portuguese, lacked a structured step-by-step process, and missed test coverage enforcement.
- **Decision:** Translate to English and enforce a 3-Phase protocol (Analysis, Implementation, Validation).
- **Changes:** Overwrote `.agent/workflows/refactoring.md` with a highly prescriptive workflow that demands test verification, splitting monoliths, and using `gitnexus_detect_changes`.

Key outputs:
- `constitution_developement_practices.md` — Appended SLA rules
- `AGENTS.md` — Updated routing logic for coding tasks
- `refactoring.md` — 3-Phase structured refactoring protocol

## Key Decisions

- **Architecture:** Functions must never mix high-level business logic with low-level manipulation (I/O, regex, etc.).
- **Agents:** Agents are strictly forbidden from writing monolithic functions and must break them down before implementing new features.
- **Workflow:** Refactoring must follow a strict Analysis -> Implementation -> Validation protocol, anchored by existing tests.

## Files Changed

**All** files touched during the session — code and documents.
Action is `created` / `modified` / `deleted`.

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Extracted default config loading logic and adjusted critical fields mapping for Identificacao documents (done manually by user). |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `project_constitutions/constitution_developement_practices.md` | `modified` | Added SLA and Anti-God Function principles. |
| `AGENTS.md` | `modified` | Pointed coding tasks to the development constitution. |
| `.agent/workflows/refactoring.md` | `modified` | Translated to English and adopted a 3-phase protocol enforcing SLA. |
