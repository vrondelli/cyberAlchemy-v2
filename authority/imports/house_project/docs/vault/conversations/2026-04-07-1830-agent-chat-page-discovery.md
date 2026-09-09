---
tags: [agents, application, architecture]
node_type: discovery
is_session: true
layer: application
nature: technical
status: active
created: 2026-04-07
timestamp: 2026-04-07T18:30:00-03:00
expires: 2026-06-06
conversation_id: a9x3k
decisions_made: true
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 5
importance_rationale: "Explores a plausible agent chat UI architecture with concrete prototype output, but leaves core feasibility questions open (registry JSON existence, Django-GitNexus integration) and explicitly defers real validation to usage."
---

# Agent Chat Page — Discovery

## Summary

Session ran discovery for an agent chat page inside the Django dashboard, confirming a tool-calling architecture (Gemini Flash as orchestrator + pre-defined read-only tools) at /agent-helper. It then pivoted to a quick prototype — a standalone HTML chat UI and a backend API at /api/semantic-index/ with keyword-based ontology querying wired into Django. A phased build plan (registry-in-context → search_codebase tool → operational tools) was outlined but deferred to real usage validation. Key open questions: registry JSON existence and Django-to-GitNexus integration path.

## Files touched

- docs/vault/dictionary-business.md
- internal_tools/personal_assistant_chat.html
- internal_tools/personal_assistant/backend/views.py
- internal_tools/personal_assistant/backend/urls.py
- house_project/urls.py
- .claude/launch.json
