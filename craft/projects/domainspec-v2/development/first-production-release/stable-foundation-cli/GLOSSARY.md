# Stable Foundation CLI glossary

Status: Define glossary. Terms are local planning projections unless their
source explicitly owns canonical meaning.

| Term | Practical meaning in this candidate | Source/status |
| --- | --- | --- |
| acceptance binding | Digest-bound record tying exact product, profile, schema, source, runtime, dependency, fixture, and receipt bytes to an acceptance decision. Any bound change invalidates it. | local candidate contract |
| causal implementation conformance | A node or edge changes a deterministic implementation obligation; removal or governed mutation removes, changes, or rejects that effect. | accepted P2/C2 decision projection |
| declared result | The one closed JSON document a supported command intentionally returns on stdout, including structural rejection results. | local interface contract |
| diagnostic report | Closed paginated JSON for stable codes and pointer-only findings. It is not a structural receipt extension. | SF-09/SF-19 |
| durable history | Original receipt/release bytes retained under immutable schema/version identity even after supersession, withdrawal, or patch repair. | SF-08/SF-20/SF-21 |
| explicit project root | Existing directory containing `project.json`, feature source roots, and project-level cross-feature edges; no fallback or discovery is permitted. | derived IR1 |
| foundation candidate | Narrow pre-production CLI slice that may contribute to the July product after later gates; not the complete `0.1.0` product. | SF-01 and July contract |
| internal-confidential | Supported source classification. It excludes secrets and regulated data and requires pointer-only output. | SF-15 |
| lint page | Deterministically ordered subset of one source/profile/version-bound diagnostic report, with a stable continuation token and report digest. | SF-19 refinement |
| operational fault | Usage/runtime/path/resource/internal condition reported on stderr; it cannot leave success-looking partial stdout. | SF-10/SF-11 |
| P2 profile | `feature-with-independent-node-and-edge-files@1`: 13 active backend kinds, 16 backend signatures, feature-local nodes/same-feature edges, project-level cross-feature edges. | accepted profile decision projection; admission still owner-held |
| pointer-only diagnostic | Code plus stable relative source ID/JSON pointer; never an excerpt, absolute path, environment value, stack, secret, or telemetry payload. | SF-15 |
| structural receipt | Compact closed JSON describing exact source/profile/version structural evaluation with `authority_effect: none`; it grants no semantic or release authority. | SF-09/SF-19 |
| supported build path | npm 11.17.0, one lockfile-v3 root, scripts denied except exact network-disabled build allowlist, compiled JavaScript output. | SF-07/SF-18 |
| supported runtime | Linux x64 with external Node.js v24.19.0 executing compiled JavaScript and no install step. | SF-05/SF-06 |
| supersession | Immutable link from an old release/evidence identity to a newer one without rewriting the old bytes. | SF-20/SF-21 |

## Non-collapse rules

- A profile lookup is not profile admission.
- A structural receipt is not implementation conformance.
- A conformance receipt is not production or release authority.
- A Plan is not implementation.
- A clean build is not operator acceptance.
- Rollback selects immutable historical bytes; it does not erase later history.

