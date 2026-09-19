# Risks and gaps

| Risk or gap | Guardrail or next owner |
| --- | --- |
| Sidecar attests a stale snapshot | Require exact envelope, graph, source-manifest, registry, and profile digests; currentness remains separately owned. |
| Compiler is mistaken for completeness authority | Keep sidecar consumer-authored and outside `generated_root`; compiler outputs are inputs only. |
| Requests duplicate or diverge from the attestation | Requests may reference the exact sidecar path/digest only. |
| Sidecar escapes the project | Require a contained project-relative path and reject traversal/absolute paths. |
| Multiple envelopes claim the same snapshot | Future schema/validator must define identity and supersession; this Design does not invent lifecycle rules. |
| No emits-capable admitted profile | Separate profile-owner decision remains required before execution. |
| No canonical schema or evaluator implementation | Later Invoke Plan/Task Session only after N39 and separate acceptance. |
| Packet projection remains unresolved | Separate packet representation decision; N39 cannot change the packet. |
