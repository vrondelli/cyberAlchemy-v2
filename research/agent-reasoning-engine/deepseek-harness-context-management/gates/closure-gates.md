# Closure gates

| Gate | Required evidence | Current state |
|---|---|---|
| G1 Source identity | Immutable upstream commit and selected-file digests | PASS for research |
| G2 Mechanism trace | Source-backed append, projection, persistence, compaction, and cache observations | PASS for research |
| G3 ARE comparison | Exact current ARE files and explicit gap map | PASS for research |
| G4 Deterministic event replay | Same prefix produces byte-identical Context Envelope in two processes | not_evaluable; not implemented |
| G5 Cache checkpoint safety | Cache behind-never-ahead and cache-loss replay tests | not_evaluable; not implemented |
| G6 Codex byte stability | Exact stable rendered context at app-server boundary | not_evaluable; instrumentation absent |
| G7 Provider cache effect | Controlled real turn with provider-reported cache-read tokens | not_evaluable; measurement absent |
| G8 Compaction integrity | Raw-history retention and mandatory-context preservation | not_evaluable; not implemented |
| G9 Privacy boundary | Payload redaction/access/retention contract and hostile tests | not_evaluable; not designed |
| G10 Request reconstruction | Sent Codex request equals event-derived messages and affinity header | not_evaluable; not implemented |
| G11 Retrieval separation | Exact shadowed history remains queryable after bounded projection | not_evaluable; not implemented |
| G12 Semantic durability | Crash matrix proves no ambiguous implicit request/effect retry | not_evaluable; not implemented |
| G13 Untrusted import | Framing, recursion, authority, and byte-budget hostile tests | not_evaluable; not implemented |

Passing G1–G3 closes the research question enough to plan. It does not satisfy
the implementation or runtime gates.
