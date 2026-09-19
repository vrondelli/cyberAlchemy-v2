# Stable Foundation CLI requirements

Status: Define contract; implementation and evidence not yet produced.

## Functional requirements

| ID | Requirement | Acceptance discriminator |
| --- | --- | --- |
| SFC-F-001 | Expose only `domainspec-v2 lint <project-root>` and `domainspec-v2 receipt <project-root>` as supported commands. | Unknown commands and `receipt --out` exit 1 without product writes. |
| SFC-F-002 | Require one explicit existing project root. | Names, feature roots, missing paths, sibling fallback, cwd inference, symlink/path escape, and duplicate roots fail with exit 22. |
| SFC-F-003 | Resolve the P2 node/edge topology deterministically. | Same bytes in arbitrary roots yield one ordered manifest digest. |
| SFC-F-004 | Bind exactly 13 active backend kinds and 16 backend signatures from an owner-ratified profile. | Missing, extra, stale, or unratified membership exits 20. |
| SFC-F-005 | Preserve the C2 causal denominator without self-attestation. | Every reported conformance claim resolves an external expected catalogue and executed receipt; mutations invalidate the binding. |
| SFC-F-006 | Emit deterministic paginated lint diagnostics. | Page order, page digest, continuation token, and whole-report digest are stable and source/profile/version-bound. |
| SFC-F-007 | Emit one compact structural receipt. | Receipt is closed-schema, deterministic, and explicitly `authority_effect: none`. |

## Interface requirements

| ID | Requirement |
| --- | --- |
| SFC-I-001 | Declared results use stdout; operational faults use stderr. |
| SFC-I-002 | Each invocation emits at most one closed JSON document on its declared result channel. |
| SFC-I-003 | Exit classes are exactly 0, 1, 4, 20, 21, 22, 23, and 24. |
| SFC-I-004 | Receipt and diagnostic reports use separate closed schemas and decoders. |
| SFC-I-005 | Diagnostics use relative JSON-pointer/source-ID references, never excerpts or absolute paths. |

## Build and runtime requirements

| ID | Requirement |
| --- | --- |
| SFC-B-001 | Package identity is `@domainspec-v2/cli`; the existing `@domainspec-v2/impl` workspace remains the development owner. |
| SFC-B-002 | npm `11.17.0` and `impl/package-lock.json` lockfile v3 are the only supported dependency authority. |
| SFC-B-003 | Lifecycle scripts are denied by default; an exact reviewed build-only allowlist runs without network. |
| SFC-B-004 | The staged product is compiled JavaScript and requires external Node `v24.19.0` on Linux x64. |
| SFC-B-005 | The compiled product performs no install or lifecycle-script step at runtime. |
| SFC-B-006 | Two clean arbitrary roots reproduce equal artifact and normalized-result hashes. |

## Security and privacy requirements

| ID | Requirement |
| --- | --- |
| SFC-S-001 | Supported data classification is internal-confidential; secrets and regulated inputs are rejected as unsupported. |
| SFC-S-002 | No network, telemetry, ambient environment disclosure, stack trace, source excerpt, or absolute path is observable. |
| SFC-S-003 | Output permissions and temporary paths are restrictive and deterministic. |
| SFC-S-004 | Dependency, license, integrity, install-script, and exact-byte evidence bind the release candidate. |
| SFC-S-005 | Secret canaries trigger quarantine and invalidate ordinary retention/acceptance. |

## Resource requirements

| ID | Requirement |
| --- | --- |
| SFC-R-001 | Admit no more than 50,000 canonical records, 512 MiB total, 4 MiB per file, or 64 MiB normalized output. |
| SFC-R-002 | Target wall time is at most two minutes and peak RSS at most 4 GiB on the selected environment. |
| SFC-R-003 | Over-bound inputs fail before expensive evaluation with exit 23 and stable diagnostics. |

## Compatibility and lifecycle requirements

| ID | Requirement |
| --- | --- |
| SFC-C-001 | Support each stable contract for at least 12 months. |
| SFC-C-002 | Preserve six months of N-1 read overlap for a supported successor. |
| SFC-C-003 | Preserve historical receipt bytes permanently by original schema/version identity. |
| SFC-C-004 | Repair is a new patch; rollback, withdrawal, quarantine, and supersession are immutable records after compatibility proof and owner approval. |
| SFC-C-005 | Ordinary diagnostic bundles expire after 90 days; release bytes/receipts are permanent; safe caches are immediately removable. |
| SFC-C-006 | Any profile, registry, schema, source, rule, runtime, dependency, or acceptance-bound change invalidates prior acceptance. |

## Operator and release-boundary requirements

| ID | Requirement |
| --- | --- |
| SFC-O-001 | An independent operator completes green/red, diagnostics, recovery, upgrade/rollback, and support-handoff scenarios without author assistance. |
| SFC-O-002 | Distribution remains a private immutable tagged checkout with records under `releases/<release-id>/`. |
| SFC-O-003 | No planning or implementation receipt grants profile, conformance, production, release, publication, or deployment authority. |
| SFC-O-004 | This foundation does not claim the complete July `0.1.0` product capability set. |

## Trace to owner decisions

All requirements above trace to SF-01 through SF-21 in
`../decisions/2026-08-16-first-stable-foundation-candidate.md`. A requirement
may refine validation mechanics, but it may not silently reopen a selected
branch.

