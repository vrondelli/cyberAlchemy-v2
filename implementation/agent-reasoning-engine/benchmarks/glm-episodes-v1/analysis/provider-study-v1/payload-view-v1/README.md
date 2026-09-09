# H23 complete-payload model view: offline construction

Hypothesis: removing redundant receipt digest and byte-count fields from the model-facing envelope can avoid some near-boundary fallback while preserving complete tool payloads. This does not solve histories whose source payloads alone exceed capacity.

The Python offline prototype uses the installed `jsonschema` Draft 2020-12 validator, collecting up to 64 schema errors together. The existing JS patch validator was inspected but cannot validate booleans, numbers or opaque payload objects. No core validator was copied or changed. Python/jsonschema integration into the JS agent is not implemented.

`projection.py` projects only successful read-file envelopes with the exact known top-level fields. It checks the complete envelope schema, verifies output digest/bytes using either canonical serialization or the exact native read-file field order in `../../../../../packages/coding-agent-runtime/read-only-tools.mjs:78`. Native-profile file hashes and byte counts are also checked. Unknown/error envelopes and unsupported serialization pass through unchanged. The paged `are.glm-file-page/v1` schema is currently unsupported and passes through unchanged.

The model view has its own schema identifier. Only top-level `output_sha256` and `output_bytes` are omitted; all output fields, arguments, effects, source hashes and outer message correlation remain. Sidecar receipts retain omitted metadata and bind original/projected content hashes. Original histories remain untouched. This is complete-payload preservation, not byte-identical envelope preservation.

## Result

Five test groups pass, including every saved H22 render: 18 trials, 135 prompts, 264 projected message occurrences. Total removed content bytes across those repeated occurrences: 27,192. These are overlapping histories, not independent samples or unique savings. All compared payloads and arguments remain equal and input trace hashes remain unchanged. A 315 KB payload negative control remains over 300 KB after projection. No source code from model responses was executed.

Token savings and model quality remain unmeasured. No provider calls, core/default changes, serving activation or publication occurred. The all-trace test initially projected zero messages because the canonical digest profile did not match native producer order; the exact producer profile fixed this construction mismatch. Neither outcome is evidence of GLM quality.

Run from this folder: `python3 -m unittest -v test_projection.py`.

## Construction and operational lanes

D65 candidate only. Owner-directed scope: this folder and research DAG, route request `glm-payload-projection-84`. Runnable next work: freeze matched actual-tokenizer measurements for the rejected full prompts, including unchanged payload-heavy controls; then decide whether a live comparison is warranted. Operational owner: user for adoption/serving/publication, all deferred and unrelated to this offline test. No provider dispatch is bound by this local construction receipt.

Research dependencies: H22 hypothesis, completed H22 process analysis and DAG; canonical evolution-runtime hypothesis/experiment/observation/decision constructors and existing DAG layering function. No mandatory ontology-runtime enforcement.

## Open Questions

Do actual token savings move any 8K/10K/12K requests below admission limits? Does a smaller envelope alter GLM tool interpretation? How should paged and unknown envelopes be supported? Can a JS integration match this offline projection exactly? What restores evidence when complete payloads still exceed capacity? Full GLM qualification remains owned by the GLM finish plan.
