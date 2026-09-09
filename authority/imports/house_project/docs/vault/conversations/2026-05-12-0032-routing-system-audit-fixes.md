---
tags: [vault, agents, architecture]
node_type: audit
is_session: true
layer: ontology, architecture
nature: technical, procedural
status: active
created: 2026-05-12
timestamp: 2026-05-12T00:32:00-03:00
expires: 2026-07-11
conversation_id: 2026-05-12-0032-routing-system-audit-fixes
decisions_made: true
contradictions_found: true
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Established the audits/ directory convention, corrected a factually wrong agent-facing claim about apiConfig.js, and fixed four structural defects in the routing constitution — high operational impact but scoped to internal tooling."
---

# Routing System Audit and Fixes

## Summary

Added Route 14 ("Executing a Command") to `CLAUDE.md`, fixed a pre-existing duplicate Route 2, and renumbered routes 3–13. Ran a multi-agent writer+reviewer workflow (four writers, two reviewers) to produce the missing `frontend/README.md`, a routing-system audit, and a P0–P3 backlog. The reviewer pattern caught a confidently-wrong claim that `apiConfig.js` does localhost-host detection (it doesn't — it returns `""` only when `VITE_API_BASE_URL` is empty) and a path confusion between `frontend/README.md` (runtime) and `specs/frontend/README.md` (ontology). All P0 items plus P1-3 and P1-4 were applied; P1-1 (execute skill), P1-2 (agent-navigation update), and P2/P3 remain open in the backlog.

## Contradictions

- contradicts prior state of `CLAUDE.md` — the phantom "executing-actions-with-care" citation and the stale route refs at lines 49 and 85 were structural lies the routing constitution was making about itself.

## Files touched

- CLAUDE.md
- frontend/README.md
- docs/vault/audits/routing-system-2026-05-08.md
- docs/vault/backlog/backlog-routing-system.md
- docs/vault/audits/
