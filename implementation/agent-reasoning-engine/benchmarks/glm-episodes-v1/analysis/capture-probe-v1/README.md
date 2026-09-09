# Offline request capture probe

Status: completed synthetic construction probe. Owner: ARE evaluator.
Authority effect: none. This follows the [offline scorer audit](../offline-audit-v1/README.md) and H1 in the [hypothesis study](../hypothesis-study-v1/README.md).

## Result

All six runs passed: baseline and forced recycling at soft limits 8000, 10000 and 12000, with a 16384 hard limit. Every baseline made three model-endpoint calls and three tokenizer-endpoint calls. Every recycled run made four model-endpoint calls and five tokenizer-endpoint calls and recycled exactly once. These were 45 loopback HTTP calls, with zero external provider calls.

Each exact received request body matched its transport receipt SHA-256. At final submission, checks confirmed:

- Native `submit_patch_candidate` schema requires `schema_version` and `authority_effect`, with the correct constant values.
- Base-tree and mutation-file hash restrictions match the synthetic fixture.
- The inspected source projection retains the exact source bytes and hash.
- The projected example retains the synthetic empty-history fact.
- The system message explicitly instructs native submission.
- Required read delivery and archive recovery gates pass; the fixture stays unchanged.

Five altered-copy controls per run were detected: missing example fact, wrong base hash, deleted required field, stale source, and changed wire bytes. Those controls test the checker on altered captures; they were not sent through the transport as separate runs.

Seven saved-evidence tests passed, including source hashes and per-run receipt/body equivalence. Evidence: [summary and source bindings](evidence/result.json), [probe](probe.mjs), [verification tests](verify.test.mjs). The six per-run JSON files in `evidence/` preserve raw serialized request bodies and corresponding receipts. All source text is synthetic; no historical private model responses or credentials were copied.

## Method and limits

The probe calls the existing `runGlmAgent`, `createGlmClient`, read-only tool runtime and context recycler. A server bound to `127.0.0.1` records the body actually received at the HTTP boundary. Its scripted responses follow the renderer's requested reads, recover the archive when directed, and submit a valid synthetic proposal. Both completion branches use `example-fields-v20`, `inspected-mutation-v1`, bounded reads and recent-observation retention.

The tokenizer endpoint is deliberately simulated. It reports high usage on a generation-zero request containing tool results to force recycling, then low usage afterward. Consequently, this tests the recycling branch and request construction at configured thresholds; it does not measure real token use, pressure under long inputs, tokenizer calibration or GLM reasoning. Model responses and timing likewise describe the loopback fixture only. No proposal is applied.

This supplies counterevidence to a broad claim that the current renderer always loses required metadata or the tested facts during recycling. It does not explain the 19 historical metadata omissions or reconstruct their original requests. Source size, many facts, conflicting updates, pagination, resume, multiple recycling generations and provider-side interpretation remain outside this probe. The schema's presence in the body does not establish provider-side strict enforcement.

## Reproduce

Use a new output directory; the probe refuses to overwrite an existing one:

```sh
node implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/capture-probe-v1/probe.mjs /tmp/are-capture-new
node --test implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/capture-probe-v1/verify.test.mjs
```

Temporary fixtures and recycler state are removed and the loopback server is closed in `finally`. Request bodies may differ between runs because local run identities are not fixed. Each run must match its own receipt hashes. Saved verification targets the retained `evidence/` directory, not a new output directory. Source hashes cover the coding runtime tree and probe at capture time; they are a broad source snapshot, not an asserted minimal dependency closure.

## Construction boundary and next frontier

CAV2-D65 product frontier completed: inspectable exact-wire evidence with negative controls. No serving runtime source was changed. The ARE researcher now owns the runnable preparation of controlled H2/H3 comparisons: metadata guidance versus unchanged contract and a host-owned envelope; boundary guidance versus a matched-length neutral reminder. Keep first-proposal semantics, raw schema fidelity, normalized validity, transport recovery and final success separate.

The next live stage depends on exact candidate/fixture bindings, held-out task selection, effect criteria, analysis method, sample size, balanced order and a physical-call cap. Those design dependencies remain explicit; a successful synthetic capture does not authorize adoption or establish a winning hypothesis. Training, deployment, publication and provider configuration are deferred operational work, with the project owner retaining selection responsibility.

## Open Questions

- Does the same preservation hold for long, paged sources and repeated recycling?
- How do contradictory or revised facts project into the decisive request?
- Do explicit metadata or boundary cards improve unseen-task initial correctness?
- Does the provider enforce, transform or merely condition on the native schema?
- Can original historical request bodies be recovered with matching receipt hashes?
