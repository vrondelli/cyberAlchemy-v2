# DeepSeek Harness versus ARE on GLM: VPS candidate plan

Status: isolated installation and a live GLM/native-read compatibility canary passed; exact benchmark adapter/freeze pending, no benchmark score. Canary evidence: [result](deepseek-canary/README.md). Installation evidence: [receipt](deepseek-vps-install/README.md).
Confirmed by user: official deepseek-ai/deepseek-harness, on the same VPS as the existing GLM deployment. Both arms use the same GLM provider/model.
Owner: coordinator for benchmark integration under user authorization. Verified GLM presentation host: root@187.77.163.194 (srv1959838).

## Objective and hypotheses

Preserve useful reusable ARE reasoning state, original GLM 8K qualification, research ontology and perfect-quality/15% token-reduction goals. Create a new experiment with an external harness control; never relabel old control results.

H-ARE: ARE reaches the required native quality with at least 15% fewer cumulative model input/output tokens than the external harness on the same tasks and budgets.
H-null: ARE offers no such benefit.
H-external: the external harness has better quality or efficiency.
H-instrument: adapter, task-duty, context admission or accounting differences prevent an interpretable comparison.

This is an end-to-end harness comparison. Harness prompts/history policies are part of the intervention and must be reported; scores alone do not identify a causal retention mechanism. A separate same-harness ARE-on/off study could isolate that mechanism later.

## Verified upstream surfaces

Inspected official repository commit ddefc45fbc7f8e46dd73185e68295696d1297887 on 2026-09-18; this is a research reference, not a qualified installed version.

- [Project](https://github.com/deepseek-ai/deepseek-harness): developer preview, source installation via pnpm.
- [Provider adapter](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/packages/llm/llm-pi-ai/README.md): custom OpenAI-compatible routes with api, baseURL, apiKeyEnv and model catalog; retries default to five, so explicitly configure and verify the experiment policy.
- [Headless runner](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/packages/bundle/headless/README.md): dsh --profile headless --json, task on stdin; JSON is a progress projection, excludes discarded attempts and truncates values.
- [Package requirements](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/package.json): Node ^22.19.0 or >=24; pnpm 11.7.0 at the inspected revision.
- [Z.ai API](https://docs.z.ai/guides/overview/quick-start): OpenAI-compatible general endpoint; Coding Plan uses a distinct endpoint. Use the exact existing qualified benchmark provider route for both arms; do not assume a subscription endpoint and general API are interchangeable.

Adapter compatibility with the exact GLM model, reasoning replay and tokenizer remains untested. Do not treat the model catalog contextWindow setting as proof of exact measured 8K admission.

## Matched experiment

Control: pinned DeepSeek Harness + exact glm-5.3-flash endpoint/settings.
Treatment: one pinned ARE candidate + the same model/endpoint/settings.
Use the fixed four exposed development tasks for the first complete paired pilot: eight assigned outcomes, one predeclared repetition. Preserve original repository commits and investigate/attempt-patch duties. Same effective source/edit tool capabilities and terminal evidence extraction, no gold access. Native Span-F1/File-F1 remain context measures, not patch-correctness oracles.

Each arm retains <=8K measured input plus output reservation, 96K cumulative model tokens, 96 calls, common output cap and declared reasoning configuration. Total maximum pilot reservation: 768K model tokens and 768 calls. Start with two workers total, one per arm, alternating start order across tasks; qualify aggregate rate limits before increasing concurrency. Do not grant independent child calls extra budgets.

Harness-native compaction/recovery may differ as the intervention, but every model call it creates is charged and every resulting request must satisfy 8K. Record compaction and confirmed delivery/displacement/reuse separately. Never disable all competitor memory merely to favor ARE. If native policy cannot satisfy 8K, report that limitation or freeze a declared adaptation before running.

Success on the development pilot requires all assigned outcomes valid, treatment perfect on each task, complete usage accounting and >=15% savings against this new control. Untouched confirmation, broader benchmark scope and LongMemEval remain separate requirements. A four-task pilot is not whole-benchmark clearance.

## VPS topology and DAG

Private benchmark supervisor -> isolated control workspace and isolated ARE workspace -> common observed GLM API boundary -> immutable run evidence -> isolated native scorer.

No GPU is required on the VPS when GLM is API-hosted. Self-hosted GLM is a different deployment and is not assumed here. Dedicated working directories, process limits and bounded source caches prevent benchmark work from exhausting the host. Keep large source trees/runs on the VPS; synchronize compact verified evidence to WSL.

1. Identify VPS SSH alias, OS/architecture, CPU/RAM/free disk, writable benchmark root and existing GLM endpoint/secret reference. Inspect only; never expose secret contents.
2. Pin both runtimes and dependency locks. Build reproducible isolated execution environments; verify headless startup without model requests.
3. Implement external-harness adapter and shared task/evidence contract. Preserve its agent loop; instrument actual requests, tool delivery, terminal selection, retries, child calls and compaction. Align issue-resolution and source/edit capabilities with ARE.
4. Integrate measured 8K admission and cumulative reservations with both transport paths. Enforce limits before dispatch; preserve unknown usage on interrupted calls. CLI JSON alone is insufficient evidence. Keep credentials outside task-accessible files and outputs.
5. Test real read/edit/base-projection, reasoning replay, cancellation, limit enforcement, failure retention and source isolation with local scripted transport.
6. Register objective/question/hypotheses, prospective experiment and task DAG; independent review of exact source/adapter and execution freeze.
7. Run a small live compatibility canary, with separate recorded costs. Successful connectivity is not benchmark success.
8. Run all eight pilot outcomes, seal evidence, reconcile model/tokenizer records, score independently and review observations/decision. Failures stay in the denominator; no automatic replacement.
9. Decide from evidence: successor hypothesis or untouched confirmation. Keep the old three-arm study and frozen records distinct; designate this new external-control experiment as the requested comparison once target identity is confirmed.

Dependencies: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9.
Product frontier: external-harness adapter and common benchmark boundary. Operational prerequisites: exact VPS identity/capacity, scoped credentials and provider rate-limit qualification. No public service endpoint or commercial release is needed for this private benchmark deployment.

## Storage and open questions

Use one bounded immutable repository cache and disposable isolated worktrees; delete only run-owned disposable trees after evidence sealing and score reconstruction. Set host-specific free-space/growth thresholds after capacity inspection. Retain prompts, raw usage/attempt records, tool/source bindings, patches and results within predeclared output limits. No broad cache deletion.

Confirmed host uses API-hosted GLM; isolated benchmark root is /opt/are-harness-benchmark. Pending: select exact ARE treatment revision; qualify headless configuration and native compaction at 8K; determine a symmetric tool boundary without replacing the competitor's reasoning loop; bind final evidence extraction without granting free model calls. LongMemEval needs a separate task/answer/judge adapter and must not reuse ContextBench scores.
