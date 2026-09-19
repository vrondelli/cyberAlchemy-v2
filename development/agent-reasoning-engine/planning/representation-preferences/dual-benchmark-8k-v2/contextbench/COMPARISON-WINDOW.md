# Measured request-window reconciliation

Status: four offline tests pass; one retained real-ledger replay passes. Independent review and campaign/file integration pending.

[comparison-window.mjs](comparison-window.mjs) reconstructs each successful physical model request from a hash-bound captured prompt. It derives the exact tokenizer wire hash, requires one earlier matching measurement, recomputes retained reasoning with the original accounting helper and prior model receipts, adds the externally configured token margin, and compares that sum to reserved_input_tokens. It requires measured input plus reserved output <=8,000 and actual input/output within their reservations.

Cached tokenizer measurements may serve repeated identical model requests; every physical model call remains checked. Extra tokenizer calls for un-dispatched candidate prompts are not themselves model-window violations. Missing, duplicate matching, reordered or altered measurements reject. Use alongside ledger R2 for exact run/identity/profile and cumulative-cost checks.

## Evidence

Run: node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-window.test.mjs

Four tests cover cached requests, retained reasoning, exact 8,000 versus 8,001 boundary, and corrupted measurement/usage/capture evidence.

[Historical replay](COMPARISON-WINDOW-REPLAY.json) binds the retained discovery-v1 task-4 treatment ledger, started cell, event journal and verifier source hashes. All 28 real model requests reconstruct; maximum projected reservation is 6,768 tokens, with retained reasoning in 25 requests. This replay made zero provider calls. It does not rerun generation, alter previous outcomes or establish quality/savings.

## Open questions and next work

The function accepts parsed evidence and externally supplied margin/output cap. Safe file loading, externally pinned campaign sources, process/writer settlement and twelve-outcome integration remain required. Receipt integrity is local evidence, not provider authentication. The verifier enforces the common <=8K ceiling; it does not prove a particular lower recycler threshold or a causal retention benefit. Independent review precedes exact live freeze. Coordinator owns remaining integration; D:/WSL admission applies and C: is excluded.
