# DomainSpec Reference Waivers

Purpose: explicit waivers for authoritative references that cannot yet satisfy full immutable-pin policy.

Status: active
Last updated: 2026-04-26

## Waiver Register

| Waiver ID | Reference ID / Source ID | Reason | Temporary Pin | Scope | Expiry Trigger |
|---|---|---|---|---|---|
| WVR-REF-002 | REF-COGNITION-DEVIN-2024 / ANNOUNCE-DEVIN-2024 | Industry announcement without stable scholarly DOI/ISBN artifact. | snapshot:2024-cognition-devin | C1 contextual framing | Replace when stable archival identifier is captured. |
| WVR-REF-003 | REF-GITHUB-COPILOT-WORKSPACE-2024 / ANNOUNCE-COPILOT-WORKSPACE-2024 | Product preview announcement; moving URL target and no DOI. | snapshot:2024-github-copilot-workspace | C1 contextual framing | Replace when versioned release or stable archival pin exists. |
| WVR-REF-004 | REF-HOFSTADTER-GEB-1979 / BOOK-HOFSTADTER-GEB-1979 | Bibliographic citation is stable but edition-level immutable pin not yet recorded in project catalog. | book:basic-books-1979 | C4 framing | Replace when edition-level ISBN is recorded in catalog metadata. |
| WVR-REF-014 | REF-JIMENEZ-SWEBENCH-2023 duplicate | Duplicate bibliography index in paper ([1] and [14]); no new source required. | arXiv:2310.06770 | dedup control | Remove when paper bibliography is deduplicated. |
| WVR-REF-019 | REF-WEST-ADLC-MANIFESTO-2025 / MANIFESTO-AGENTIC-2025 | Manifesto-style source with unstable publication metadata. | edition:2025-agentic-manifesto | C3/C4 framing | Replace when citable stable publication record is available. |
| WVR-REF-023 | REF-BOSCARO-DOMAIN-CODE-MAPPING-2026 / REPO-DOMAIN-CODE-MAPPING-2026 | Repository citation lacks immutable commit pin in current ledger entry. | repo:github-2026-snapshot | C1/C4 predecessor context | Replace when commit-SHA and retrieval date are recorded. |
| WVR-E11-022 | SRC-HEXAGONAL-ALISTAIR | Archive pin unresolved in E11 source sweep. | archive-2026-04-22-unresolved | E11 specialization analysis | Replace when immutable archive capture succeeds. |

## Policy

1. Waivers do not bypass claim-evidence traceability requirements.
2. Waivers are valid only for contextual/supporting references unless explicitly approved for primary authority.
3. Any waived reference used as primary authority in a protocol requires explicit reviewer approval in experiment results.
