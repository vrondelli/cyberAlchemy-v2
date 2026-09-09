# Isolated controlled-study runner

Status: loopback integration complete; real-tokenizer calibration and live freeze pending.
Owner: ARE implementer / evaluator. Authority effect: none.

This connects the [controlled-study treatment adapters](../controlled-study-v1/README.md) to the actual agent rendering, recycling and transport path through an isolated candidate. Serving runtime files remain unchanged. All responses in this package are scripted; no external provider was called.

## Current evidence

The retained current run is [evidence-v2/result.json](evidence-v2/result.json), with [source and artifact hashes](evidence-v2/manifest.json).

- 20 successful treatment runs: all five arms across all four prepared fixtures at 8K, with forced recycling.
- 10 additional successful runs: all five arms at 10K and 12K on the archive-start fixture, with forced recycling.
- Two failure controls: a forbidden full envelope in the host-envelope arm is rejected, and an HTTP 503 remains one failed model attempt with no retry.
- Two baseline runs: the unmodified agent and isolated candidate have equivalent request payloads except for validated run-bound history_ref values.
- 192 hidden semantic checks pass on scripted reference proposals. Evaluated code is denied access to an adjacent oracle file in every successful run.
- 163 model-endpoint and 193 tokenizer-endpoint loopback calls are retained, including the failed model attempt. Every captured request matches its receipt SHA-256.

The six saved-evidence tests check byte/source integrity, measurement-before-dispatch, isolated normalization, the transport failure, narrowly bounded baseline comparison and denied access to an existing hidden file. The 192 checks validate integration with reference proposals; they are not GLM repair successes.

The earlier evidence/ directory is historical debugging evidence: its intended 503 control lacked a JSON content-type header and therefore tested content-type rejection. It is superseded by evidence-v2/ for the transport-status claim. Failed and superseded evidence is not pooled with the current run.

## Candidate construction

[candidate.mjs](candidate.mjs) compiles a separate module from the exact current agent source, with four guarded substitutions. Anchor drift fails closed. The substitutions:

1. Allow the rendered prompt to receive a study transformation.
2. Decorate it before delivery projection, token measurement, admission and dispatch.
3. Normalize the host-envelope response only at the parser boundary, after raw response/history capture.
4. Include the study adapter binding in the recycler's scope identity.

Relative imports resolve to the existing runtime. The generated candidate, compiler, upstream source, adapter and runtime source snapshot are hash-bound in the retained evidence. This is an inspectable experiment candidate, not a general extension API or an adopted runtime patch.

[adapter.mjs](adapter.mjs) binds arm, family, candidate bytes and treatment bytes. Full-contract arms retain the original message and never receive envelope repair. The host arm preserves its raw response and adds only its declared constants before the existing schema/scope parser. If the host adapter rejects an input, the native parser receives an invalid envelope even if the original full envelope could otherwise pass. This prevents accidental fallback acceptance.

The script is proposal-only and leaves fixture bytes unchanged. It does not execute a model-proposed edit. Evaluations here use scripted reference source in fresh Node permission-restricted children through the existing validatePublicCases implementation. The child can read only its subject file; the oracle is read by the trusted parent. This demonstrates the Node-level boundary for these controls, not container isolation against arbitrary hostile native code.

## Baseline comparison

Exact raw request bytes are checked against their own dispatch receipts. Cross-run baseline comparison additionally decodes serialized message content and replaces only syntactically valid 64-hex history_ref field values with a comparison marker. Those references depend on run history/receipts and can differ even with the same fixture and script. No base hash, source hash, instruction, schema, card, model setting or source byte is excluded. Negative tests show changed instructions and changed scope hashes still fail comparison.

Thus baseline payload equivalence is established for this fixture and path; literal cross-run byte identity is not claimed. Forced-recycling runs exercise the treatment path; the direct original/candidate baseline comparison itself is a no-recycling run.

## Token and privacy boundaries

Every model dispatch has a preceding tokenizer capture with identical messages and tools. Treatment text cannot bypass the existing request-size or admission path. The tokenizer is synthetic: counts of 100 or a deliberate high value trigger the intended branch. This validates accounting/order, not actual token lengths or natural context pressure.

The neutral/boundary prompts remain unmatched under the real GLM tokenizer. No length-equivalence or efficacy claim follows from this integration. Full request captures are safe here because fixtures and responses are synthetic; a live capture/export policy must keep private repository source local and record exact hashes without publishing it.

Only README.md, subject.mjs and contract.json are materialized into the model-visible fixture. The hidden oracle and reference remain outside it. The model tool allowlist independently rejects hidden paths, and the separate test verifies denial for a hidden file that actually exists, ruling out a mere missing-file explanation.

## Reproduce

Use a new output directory:

```sh
node implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/study-runner-v1/runner.mjs /tmp/are-study-integration-new
node --test implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/study-runner-v1/verify.test.mjs
```

The runner writes the generated candidate plus individual trial captures. Servers close and temporary fixture/state/validation directories are removed in finally blocks. Saved verification targets evidence-v2/. New runs have their own run-bound hashes and latency values. The source manifest is a broad snapshot, not a minimal dependency closure.

## Construction boundary and next frontier

CAV2-D65 product completed: a tested isolated study runner with treatment separation, raw-response preservation, read isolation and budget accounting. The next runnable preparation is owned by the ARE researcher: real-tokenizer calibration of neutral/boundary controls and final schedule/candidate bindings. The implementer owns connecting that exact frozen schedule to the provider-backed controller and preserving raw/normalized scores per arm. These are concrete live prerequisites, not prerequisites for this completed loopback package.

No 120-trial campaign has started. The prepared design's 1600-model/3200-tokenizer ceilings are unchanged. A live controller still needs interruption/resume checks, exact arm/schedule binding and source-drift rejection before provider execution. Provider-side schema enforcement, actual token calibration and generalization remain unproven. Serving activation, training, publication and deployment remain separate deferred operations, owned by the project owner.

## Open Questions

- What real token-length adjustments are needed for the neutral/boundary control?
- Does a frozen provider-backed controller preserve all arm identities and caps across interruption/resume?
- Do treatments improve initial correctness on the reserved cases without semantic regressions?
- Does behavior generalize beyond these two task families and synthetic recycling?
