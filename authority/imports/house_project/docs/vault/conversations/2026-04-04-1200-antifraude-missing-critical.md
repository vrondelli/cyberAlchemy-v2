---
tags: [acquisition, application]
node_type: discovery
is_session: true
layer: application, domain
nature: technical
status: active
created: 2026-04-04
timestamp: 2026-04-04T12:00:00-03:00
expires: 2026-06-03
conversation_id: gt6s2
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Bug silently rejects valid antifraude documents as MISSING_CRITICAL; root cause is fully identified but the DB fix has not yet been applied."
---

# Antifraude MISSING_CRITICAL — Root Cause Discovery

**Date:** 2026-04-04 12:00 (UTC-3)
**Tags:** #acquisition #application

## Summary

The session investigated why antifraude documents were being incorrectly marked as MISSING_CRITICAL. The root cause was a data inconsistency: the Antifraude DocumentTemplate in the database lists processo_id as a critical field alongside cpf and nome, but the Unico Sign document format often does not include a processo_id field at all. Gemini correctly extracts the document and returns processo_id=None, which then triggers the MISSING_CRITICAL validation. The fallback JSON config only requires ['cpf', 'nome'], confirming the DB template is the source of the mismatch. The decision was to recognize this as a configuration issue in the DB template rather than a code bug.

## Epistemic Impact

- A foundational assumption was falsified: the DB template and the fallback JSON config were assumed to be in sync. They are not — the DB template contains processo_id as a critical field, while the fallback JSON does not.
- The DB template is authoritative at runtime, making this a silent correctness regression rather than a code bug.
- No existing spec was found to be drifted because no spec currently documents the critical_fields semantics or defines which source (DB vs. fallback JSON) is authoritative. That absence is itself a finding.
- No promoted candidates: the discovery stands on its own. A follow-up implementation-plan (to patch the DB template) has not yet been written.

## Modified Artifacts

| Artifact | Type | Change |
|---|---|---|
| None | — | Session was a read-only investigation. No code or documentation was modified. |

## Connections

| Document | Type | Description |
|---|---|---|
| `docs/vault/backlog/backlog.md` | `spawns` | Two backlog items produced: fix DB template and write critical_fields spec. |

## Gaps & Backlog

| Item | Type | Description |
|---|---|---|
| Fix Antifraude DB template | backlog | Remove `processo_id` from `critical_fields` in the Antifraude DocumentTemplate in the DB, or explicitly align the fallback JSON config to match. Validate against Unico Sign format samples. |
| Write critical_fields spec | backlog | No spec exists for DocumentTemplate critical_fields semantics. Document what "critical" means, which source is authoritative at runtime (DB vs. fallback JSON), and how conflicts are resolved. |
