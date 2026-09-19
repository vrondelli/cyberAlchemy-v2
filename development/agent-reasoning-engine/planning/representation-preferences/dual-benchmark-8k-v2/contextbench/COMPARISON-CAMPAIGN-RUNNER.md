# Composed comparison campaign runner

Status: four offline orchestration tests pass. Independent review, outer supervision and native scoring pending. No live admission.

[comparison-campaign-runner.mjs](comparison-campaign-runner.mjs) composes the fixed two-worker queue, repair dispatcher, production client factory, guarded outcome store, R2 evidence manifest and full file/ledger/window reconciliation. Defaults select the real repair dispatcher and bounded production factory; programmatic injection exists for offline tests only.

The caller supplies three distinct fresh evidence roots (outcomes, per-run files, metadata), a separate fresh source root, guarded persistence for each evidence root, a parent AbortSignal, source/dispatch checks and an explicit campaign admission callback. Admission must return true before any factory is constructed. Production callers must implement exact reviewed freeze and D:/WSL admission in these callbacks; this module alone does not grant provider dispatch.

Each queue slot gets one factory bound to the queue's shared abort signal and run persistence. The runner captures the identity from the actual constructed client, invokes the default repair dispatcher, and pins the fixed per-run files using bounded chunked reads with nonblocking/no-follow regular-file checks. Missing/invalid run evidence stops scheduling through the queue's failure path while preserving the executor's returned/attached cost evidence. Entries for unstarted slots remain null.

After worker settlement, the runner seals all outcomes, saves the companion manifest, verifies its canonical hash, reconciles all twelve rows, then writes final RESULTS.json through the metadata guard. It returns exact outcome-seal, manifest and final-result hashes. Exceptions during sealing/metadata persistence retain terminal outcomes, file entries and binding failures on error.campaign_evidence.

## Verification

Run: node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-campaign-runner.test.mjs

Four tests use the actual fixed schedule, queue, guarded filesystem writers, outcome/reference seals and reconciliation with injected synthetic executors/factories. They verify twelve-run completion with maximum two workers and one shared signal; no construction on denied admission; retained 120-token simulated paid exception and twelve rows; and retained twelve outcomes/1,440 synthetic tokens when metadata persistence fails after generation.

These tests do not dispatch the real GLM factory or execute the real three-arm source runner in this combined campaign. Those components have separate reviewed tests. A production end-to-end readiness claim still requires the exact combined adapter/freeze and prospective experiment.

## Open questions and remaining work

Cooperative queue settlement is not outer process settlement. The external supervisor must bound generation lifetime, observe process exit/closure, enforce storage growth and persist those observations before scoring. It must independently retain result hashes and bind the client configuration/source freeze; client identity alone is not approval authority. The runner does not retry or resume failed campaigns.

Next construction is outer process supervision and native scoring for the twelve outcome format, plus prospective experiment amendment and exact review/freeze. Real request qualification and current D:/WSL capacity remain prerequisites; C: is excluded. Broader confirmation and required quality/token savings remain open. Coordinator owns integration/review; release/deployment are deferred.
