---
tags: [agents, vault, ontology]
node_type: conceptual
is_session: true
layer: [ontology, architecture]
nature: [explanatory, procedural]
status: active
created: 2026-03-24
timestamp: 2026-03-24T10:21:49-03:00
expires: 2026-05-23
conversation_id: b95a0aa0-b2f7-479d-88e4-805ea3ff57fc
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Established a standardized workflow for agent-driven testing and refined the context router to explicitly separate feature planning from execution."
---

# Agent Testing Workflow and Context Router Refinement

**Date:** 2026-03-24 10:21 (UTC-3)
**Tags:** #agents #vault #ontology

## Summary

The objective of this session was to review the current context formulation logic used by agents (the `AGENTS.md` context router) and evaluate its effectiveness. The user confirmed that the dispatcher approach was fundamentally sound but agreed that testing, a critical and frequent agent activity, lacked specific workflow guidance. 

To improve the context router, we established a new dedicated workflow for test development that focuses on deterministic behavior, isolation of domain testing, and the correct mocking boundaries around Use Cases. We then updated `AGENTS.md` to link to this new workflow and added a safeguard to ensure agents perform architecture planning before jumping into writing code for new features. Finally, the test suite was verified at the end of the session, showing that all 1740 tests generated up to this point are passing successfully without errors.

### Context Router Review
- **Problem/Goal:** The user wanted to evaluate if the current design of `AGENTS.md` made sense and how it could be improved.
- **Decision:** The context "lazy loading" architecture is solid, but the `AGENTS.md` missed a dedicated path for testing tasks and erroneously grouped "writing code" (new features) and "refactoring" without a planning prerequisite.
- **Changes:** Updated `AGENTS.md` to instruct agents to read `.agent/workflows/testing.md` when running tests, and explicitly required checking `spec-writing.md` for new features before refactoring steps.

### Testing Workflow Creation
- **Problem/Goal:** There was an existing workflow for "uncommitted testing" but no general guidance on how agents should implement and structure tests according to the constitution.
- **Decision:** Created a new standard operating procedure (`.agent/workflows/testing.md`) deriving rules from the existing development practices constitution (such as zero-IO pure domain testing and strict controller-to-repository integration testing).
- **Changes:** Created `.agent/workflows/testing.md` defining golden rules for Single Level of Abstraction, test deterministic assertions, and Mock boundaries.

Key outputs:
- `.agent/workflows/testing.md` — Agent testing workflow and best practices.
- `AGENTS.md` — Updated agent context router rules.

## Key Decisions
- **Testing Guardrails:** Agent tests must avoid mocking IO in domain code and maintain strict architectural boundaries around Repositories when testing Use Cases.
- **Context Loading:** Agents must load the new testing workflow before beginning any validation task, improving test quality and adherence to repo constitutions.

## Files Changed

### Code
None.

### Documents
| Document | Action | Description |
|----------|--------|-------------|
| `AGENTS.md` | `modified` | Added testing step and clarified planning prerequisites for code refactoring vs new feature creation. |
| `.agent/workflows/testing.md` | `created` | Created general testing workflow rules emphasizing architectural purity, single level of abstraction, and mocking boundaries. |
