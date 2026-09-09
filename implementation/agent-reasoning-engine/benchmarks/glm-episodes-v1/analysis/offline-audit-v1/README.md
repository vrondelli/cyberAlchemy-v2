# Offline GLM request and scorer audit

Status: completed bounded diagnostic; historical wire reconstruction remains unresolved.
Owner: ARE evaluator. Authority effect: none.

This follows H1 in the [hypothesis study](../hypothesis-study-v1/README.md). It checks whether the observed metadata omissions and semantic counterexamples could be explained by schema projection or scorer defects. No model endpoint was called and no retained model-generated code was executed. The original analysis and hypothesis snapshot remain unchanged.

## Findings

- All 19 hash-bound initial schema failures reproduce with canonical diagnostics: 18 missing `schema_version`, one missing `authority_effect`. Seventeen had passing recorded public behavior before correction. This confirms omission in the retained proposal, not why the model omitted it.
- The current native submission tool requires both fields. One valid proposal and eight missing-required-field controls behave as expected. The schema builder preserves the required fields; its generated function does not set `strict`. This is not evidence that the provider enforces or ignores the schema.
- All 45 expectations agree with a separately authored specification: 21 public checks plus 24 oracle checks across archive bounds, retention tool pairs and long-window retention. The reference implementations pass every selected expectation. Repeated suites are not independent samples of broad correctness.
- Another 344 differential cases agree: 240 archive combinations (including EOF, surrogate boundaries and isolated surrogates), plus 52 history-length/recent-tail combinations for each retention fixture.
- All seven targeted mutation controls are detected by public checks: three archive mutations and two per retention fixture. The bundled mutant fails six public/oracle expectations per fixture. This establishes detection for those mutations, not exhaustive scorer coverage.
- The 21 audited implementation/fixture source files match the frozen manifests for the latest three campaigns. In the oldest two, 19 match and `agent.mjs`/`transport.mjs` differ; those historical runtime versions must not be inferred from current code. The audited fixture and schema sources match all five.

Machine evidence: [result](result.json), including per-trial response hashes, issue paths, per-control detections, source comparisons and all read-input hashes. [Audit implementation](audit.mjs) contains the independent specifications. The archive specification enumerates legal UTF-16 cut positions using code-point widths; retention uses separate validation and projection passes. These provide a second implementation, not formal semantic proof.

## Request evidence limitation

The 19 selected trace exports contain model-request SHA-256 receipts, response evidence and tool observation history, but not complete dispatched request bodies. A hash alone cannot recover system instructions, exact tool schema, attachment placement or the context present at that call. Read-delivery receipts do not establish that every instruction survived projection into the decisive request.

Source inspection shows the native policy removes the inline final JSON example and instead offers `submit_patch_candidate` with the required schema. That is a plausible experimental variable for H2; it is not proof of a causal defect. Older prompt text that says the final response has no tools is replaced by the later system construction in the selected policy, so merely finding that string in the source would be a false diagnosis.

The audit therefore weakens the schema/scorer explanation for these observed failures. H1's request-construction branch remains unresolved. It does not justify claiming that the provider received the expected contract on every historical call.

## Next product frontier

Prepare an offline request-capture probe around the actual renderer/transport boundary. Capture the exact submitted body locally for synthetic fixtures, verify native schema, system instructions, source hashes and pre/post-recycling facts, and compare it with the receipt hash. Include a deliberately dropped-field or stale-projection negative control. This can establish current construction behavior without a provider call.

After capture is verified, bind H2/H3 experiment designs: metadata card vs unchanged prompt vs host-owned envelope, and boundary card vs a matched-length neutral reminder. Freeze held-out fixtures, candidate bytes, meaningful-effect criteria, repetition/sample size, order and physical-call cap before live execution. No repair or winning hypothesis is selected by this audit.

## Reproduce

From the checkout root, use a new output path:

```sh
node implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/offline-audit-v1/audit.mjs /tmp/glm-audit-new.json
```

Only repository reference/mutant fixtures and authored controls execute. Inputs are cloned and checked for mutation. Output creation is exclusive; old evidence is never overwritten. A nonzero exit indicates diagnostic-control disagreement. The result records historical source drift separately because expected version changes must not be reported as failed behavior tests. Compare source hashes before comparing reruns. No network access or external dependencies are needed.

## Construction boundary

CAV2-D65 current product: source-bound offline audit and diagnostic controls. This package is complete. The ARE evaluator owns the next offline request-capture probe; its missing evidence blocks claims about wire construction, not completed scorer checks. The ARE researcher owns later controlled experiment preparation. Provider operation, training, runtime activation and publication remain deferred; no operational prerequisite blocks the offline probe.

## Open Questions

- Does the actual rendered body preserve the native output contract and necessary facts before and after recycling?
- Are historical request bodies available outside the selected exported corpus, with trustworthy hash bindings?
- Do the same schema and semantic defects recur on unseen tasks after controlling prompt and transport variables?
- Which additional malformed inputs or semantic mutations expose gaps beyond the tested fixture domain?
