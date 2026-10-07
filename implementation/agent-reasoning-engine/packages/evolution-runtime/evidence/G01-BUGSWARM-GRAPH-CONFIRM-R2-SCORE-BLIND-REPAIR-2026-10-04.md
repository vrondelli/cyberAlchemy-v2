# G01 reserved confirmation r2 — score-blind source/log repair rule

Status: **prospectively fixed before r2 admission requests**. This is a new attempt; it does not revise the [terminal r1 result](G01-BUGSWARM-GRAPH-CONFIRM-R1-PREFLIGHT-RESULT-2026-10-04.md). It uses failed-side metadata only. Passing commits, patch paths, gold labels, model calls, rankings, and scores remain closed. The claim population remains 24 slots, twelve Python and twelve Java.

## Inputs and original slots

Pin the original reserved split SHA-256 `6630be1c012aa027f3b525ffa3b1382e7f5ab751b84c8547eb9c679a16d68a85`, ordered-candidate source SHA-256 `63783b5ead385c94234faed3551ee1d08866fa564d2edc301575c78b682ca91c`, raw BugSwarm metadata SHA-256 `c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d`, prior 24 SHA-256 `fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d`, first-development r2 SHA-256 `c8fd7c57f75243cf613cfd22c23ec7c025582981d9d7ec4115c4a3efb0f43332`, B-development r1/r2 SHA-256 `d3f1dbef2443752290cfe917f75d15a229f4a176d2708c2764fcf7886df25b92`/`53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8`, and the immutable r1 result SHA-256 `6221d6bfd7baeda65bf37257b38e061d33e8140a25aa6f17ed8c534b48b1d951`. Exclude every repository in prior exposed, first development (including r2 replacements), B development (including its replacement), and all original reserved cases. Case-insensitive repository identity is the exclusion key.

For each of the eleven r1-admitted slots, retain its original source/job and full HTTPS raw log. Check the same job's HTTPS raw-log `HEAD`: require HTTP 200 and `Content-Length` equal to the frozen r1 full-body byte length. If this fails, the slot becomes a replacement slot; its r1 admission remains historical. For r1 slots 6, 19, and 22, whose exact failed-commit source and full HTTPS log passed but whose page validator failed, fetch one fresh HTTPS job page under r2. Require a complete HTTP-200 transfer, strict UTF-8, and one of these exact identities in the page's job header and original-job link:

- `GitHub Actions job {id}` plus `https://github.com/{repo}/actions/.../job/{id}`;
- `Travis-CI job {id}` plus `https://app.travis-ci.com/{repo}/jobs/{id}` or `https://travis-ci.org/{repo}/jobs/{id}`.

Also require that slot's raw-log HTTPS `HEAD` HTTP 200 and `Content-Length` equal its frozen r1 byte length. If any condition fails, replace the slot; do not relax the matcher or retry the same page under r2. The remaining ten r1 failures (two Python and eight Java) are replacement slots from the start: nine incomplete raw-log transfers and the exact failed-commit 404. No r1 partial body is reusable.

## Replacement source order and admission

For each language, construct one source-only queue from the original ordered candidates strictly *after* the last original reserved source-order position for that language. Retain only original `eligible()` metadata cases from `select-bugswarm-graph-dev-r1.py`, the same repository-hash partition value `1` (reserved), and repositories outside the exclusion set. Keep the first **up to 60 distinct repositories per language**, or all eligible repositories if fewer than 60 remain, in original order. Require at least one queue candidate per initial replacement slot of that language before dispatch. Only failed-commit SHA, job ID, image tag, language, repository, and source-order position may cross to the VPS. Freeze the full queues and script hashes before requests; passing SHA and labels must not cross.

Fill replacement slots in original slot order, using the next unused candidate from that slot's language queue. An attempted candidate is never reused in another slot, whether it passes or fails. For each candidate, perform once each: codeload HTTPS exact failed-commit `HEAD` (require final HTTP 200); BugSwarm HTTPS raw-log `HEAD` (require HTTP 200 and positive `Content-Length` at most 8 MiB); BugSwarm HTTPS job-page GET (require complete HTTP 200, strict UTF-8, and exact provider/job/repository identity above); raw-log GET (require complete HTTP 200, body length equal to the prior `HEAD` length, strict UTF-8, nonempty). TLS verification stays on, no HTTP fallback, no range reconstruction, no automatic retry. Preserve every request receipt and every nonempty body privately. A candidate passing all tests fills the slot; otherwise move to the next queue candidate. Stop when all 24 slots are filled or a language queue is exhausted. Do not scan beyond 60 candidates per language under r2.

Before admission, verify all 24 final repositories are unique, disjoint from prior exposed and development repositories, match their slot languages and the reserved partition, and have exact failed-commit source and complete HTTPS job/log evidence. Preserve original-to-replacement mapping, every failed attempt, all full-body SHA-256 values and byte lengths, and a matching complete VPS/WSL cold-copy hash inventory. A missing slot, unverified log/page/source, or copy mismatch fails **the whole r2 admission gate**. No score on a reduced subset and no retroactive r1 promotion.

Passing r2 admits *source/log availability only*. Exact archive safety and identity, source-only prediction seal, evaluator-only HTTPS Git-tree labels, matched ARE/graph/GLM scoring, and full cost accounting remain separate prospective stages. This availability-selected BugSwarm population is not representative of all BugSwarm failures; any later claim must state that selection boundary.

## Open Questions

- Will the 60-per-language ordered queues fill all replacement slots with complete HTTPS evidence?
- Does BugSwarm's HTTPS page use any other CI-provider template that requires a separately versioned rule rather than an in-place matcher change?
- Can the final source/log-admitted cohort also pass archive and independently corroborated label admission without exposing labels to treatment selection?
