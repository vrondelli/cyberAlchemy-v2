# Schema output capability investigation

Product frontier: determine whether hosted GLM offers generation-time schema enforcement before building another completion candidate. Official Z.ai structured-output guidance describes json_object plus prompted schema and application validation. The API reference enumerates text/json_object, not json_schema. Issue 133 reports string alteration under JSON mode through OpenRouter; it is user-reported, closed, and not proof of the current direct endpoint.

Runnable product DAG: official contract -> bounded diagnostic harness -> local negative/positive classifier tests -> three frozen live probes -> evidence-based candidate decision. Probe 1 copies synthetic JSON in text mode; probe 2 copies the identical object using json_object; probe 3 requests json_schema with a strict schema and a conflicting user request to detect an accepted-but-ignored parameter. One passing probe is not a schema guarantee. No probe executes generated content.

Caps: exactly three scheduled attempts, each max_tokens 2048, HTTP timeout 60000ms, response 262144 bytes, no retries or replacement. Exclusively created output directory prevents accidental resume/replay. Persist started marker before credential dispatch; raw credentials and provider reasoning are never exported. Synthetic input only. Stop on harness failure, retain uncertain attempts. No agent runtime or benchmark fixture changes.

Operational tasks and owners: agent runs owner-authorized diagnostics; product owner owns future activation. Affected stages: capability research, diagnostic tooling, evidence. Causal blocker for a production schema binding: no documented native schema guarantee. Deferred residue: endpoint contract clarification, replicated character-preservation tests, local constrained decoding or native tool-output alternatives, full benchmark evaluation if a supported candidate is found. CAV2-D65 candidate construction; no new ontology dependencies or activation.

## Open Questions

Does the endpoint reject or ignore json_schema? Does direct JSON mode preserve exact source strings today? Even if accepted, what contractual guarantee and model coverage exist? Provider-internal compaction remains outside these probes.
