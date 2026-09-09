# Native patch submission protocol test

Product frontier: determine whether a documented auto-selected native tool can carry a complete patch candidate after JSON mode corrupted source strings and json_schema was ignored. This is an isolated proposal protocol, not coding-agent integration or schema-enforcement proof.

Runnable product DAG: strict patch parser and documented auto tool selection -> proposal schema and parse adapter -> malformed/scope/content local tests -> six fixed live calls -> strict classification -> integration decision. First three probes copy synthetic source containing lowercase json, quotes, escapes and Unicode; next three request a small string edit. Success target: all six return exactly one submit_patch_candidate call, pass the existing strict candidate parser and exact scope hashes, and preserve expected source bytes. Optional top-level rationale is allowed by the existing parser. No missing-field insertion, normalization, retries, code execution or schema enforcement claim.

Caps: six scheduled calls, max_tokens 2048 each, HTTP timeout 60000ms, response cap 262144 bytes. Tool choice auto, no strict flag, no response_format. Exclusive output directory and durable pre-dispatch markers prevent automatic replay; all failures retained. Synthetic inputs only, no tokenizer/context-window comparison.

Operational tasks and owners: agent runs owner-authorized candidate tests; product owner owns activation. Affected stages: isolated submission adapter, diagnostic harness, evidence. Causal blockers: local validation, source drift or provider failure. Deferred residue: native completion history representation, exact delivery confirmation, client identity and tokenizer binding, completion gates, resume/accounting and independent benchmark reporting. Successful probes authorize no execution. CAV2-D65 candidate construction; no new ontology dependencies or default/fixture changes.

## Open Questions

Will small synthetic success generalize to long coding tasks? Can the agent keep submission out of ordinary effect execution and preserve a valid terminal native exchange? Is tool auto-selection reliable under incomplete delivery? These probes do not observe compaction or prove a strict generation contract.
