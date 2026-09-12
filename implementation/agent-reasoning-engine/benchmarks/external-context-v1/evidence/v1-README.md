# First external GLM benchmark run

Candidate implementation for request `glm-external-live-92`. This is the first two development episodes of the [external benchmark plan](../glm-episodes-v1/analysis/provider-study-v1/research/benchmark-landscape-v1/PLAN.md), not the full 156-episode schedule or held-out qualification. Current task: SWE-bench-Live MultiLang `sveltejs__svelte-16666`, original problem statement, pinned repository commit and image.

## Contract and scope

Both arms share an isolated bounded repository agent: list tracked paths, literal search, ranged reads, archived-history reads and a final source replacement proposal. The baseline uses full read-result envelopes; the treatment applies the existing H23 projection. The executor is a common external-task adaptation, not the unchanged H21 historical agent. It reuses ARE's GLM transport, secret-reference handling, whole-schema validation and context-recycling implementation. Only public repository material enters model requests. No hidden tests, hints, gold patch or evaluation output enter the solving loop.

The agent may propose up to six exact unique source replacements in inspected files. It cannot change test/fixture files, run shell commands, browse the internet or write host repository code. Its proposal is applied only in its task container to extract a diff, then evaluated in a separate fresh container. Full upstream workflows may allow more tools; this is a custom bounded development protocol using real tasks, not a leaderboard submission.

`prepared/task.json` is the public task projection. The complete evaluator row and pinned parquet remain in `/home/vrondelli/.cache/are-external92`, inaccessible through rollout tools. Dataset revision and hashes are recorded in `prepared/source.json`; image identity is recorded in `prepared/image.json`. The dataset card declares MIT; original repository terms continue to apply. Sources: [dataset](https://huggingface.co/datasets/SWE-bench-Live/MultiLang), [upstream evaluation](https://github.com/microsoft/SWE-bench-Live/blob/a9c6b8aae9387f7a231d55b52da4b7ed0fd43bc3/evaluation/evaluation.py).

## Frozen first-run limits

| Dimension | Limit |
|---|---|
| Cohort | One development task, baseline then payload; two episodes |
| Provider | Existing `glm-5.3-flash` transport and configured secret reference |
| Context | Local recycle threshold 12,000; hard context 16,384; margin 512; output reservation 2,048 |
| Attempts | 12 model and 24 tokenizer per episode; 24 model / 48 tokenizer total; no retries or replacements |
| Timing | 60 seconds per model attempt; 30 seconds per tokenizer; 720 seconds per episode |
| Payload | Existing transport bounds: 131,072 request bytes and 262,144 response bytes |
| Tools | Up to 8 calls per response; reads at most 160 lines / 2MB source file; bounded search/list results |
| Resources | One rollout/evaluation worker at a time; 2 CPUs, 4GB memory; no network; dropped capabilities; no host mounts |
| Cost | Model list-price upper estimate under USD 0.068 for both episodes; planning ceiling USD 0.10; local compute excluded |

Cost uses USD 0.15/M input and USD 0.50/M output, without assuming the temporary discount or cache savings. [Provider pricing, September 9, 2026](https://docs.z.ai/guides/overview/pricing). Actual usage estimates are not invoices. Tokenizer charges are not separately listed on the cited pricing page. No further cohort is automatically authorized by completion of these two episodes.

The episode deadline aborts provider requests; bounded container calls may take up to 30 additional seconds to return and cleanup up to 30 seconds. No newly dispatched request is permitted after the abort signal. Each evaluator build/test command is capped at 600 seconds, parser at 30 seconds. Evaluation failures remain explicit and retained.

## Scoring and preflight

The evaluator uses the selected row's test patch, rebuild commands, print commands and parser. Its execution harness is local. The initial published test command failed to enable complete verbose output; the corrected harness invokes `pnpm exec vitest run --reporter=verbose --maxWorkers=2 --minWorkers=1 --testTimeout=30000`, retaining all test assertions and enabling complete parser coverage. Evaluator process capacity is 1,024; rollout capacity is 128. The longer per-test timeout and worker limit are explicit resource adaptations, so this is a custom protocol. The original preflight is retained under `evidence/preflight-base/`; corrected baseline evidence is under `evidence/preflight-base-v2/`. Reference and baseline checks run first in isolated fresh containers. The gold patch must resolve the intended checks, and the base must fail at least one target check.

Report the raw upstream predicate separately from the custom conservative score. The dataset's expected names omit suite/file prefixes that the verbose output includes. `score.py` matches an expected name against an exact full name or a suffix after ` > `, and requires **every** matching full test to pass. Missing names fail; ambiguous suffixes cannot hide a failing match. This repairs identification without changing assertions and is not claimed as an official leaderboard score. The corrected baseline parses 6,346 test identities and covers all 5,187 expected labels; 37 labels have multiple full-name matches. `evidence/preflight-base-normalized/report.json` records re-scoring of the unchanged v2 log, with its digest. Full test output and parser results stay evaluator-side and never become model feedback.

The first-run question is whether an end-to-end external task produces an attributable proposal and a trustworthy score. General H23 superiority remains inconclusive on one development task even if both arms differ. A correct patch is not required to count a valid scored first run. No false pass may arise from a missing proposal or failed evaluator.

## Reproduction

Install pinned Node dependencies using `npm ci --ignore-scripts --no-audit --no-fund`. `prepare.mjs <cache>` reads the pinned parquet and emits task/source manifests exactly once. `node --test contract.test.mjs` checks simultaneous schema failures, duplicate keys and source-preserving projection. Tool preflight additionally checks the real image commit, repository reads and traversal rejection.

Run `evaluate.py <cache> base <new-output>` and `evaluate.py <cache> gold <new-output>` for isolated oracle preflight. Freeze source hashes and research records with `node freeze.mjs`. Then `node run.mjs baseline <credential-reference-file>` and `node run.mjs payload <credential-reference-file>` run the two episodes. Existing output directories forbid replay. Evaluation of an attributable diff uses `evaluate.py <cache> <arm> <new-output> <prediction.patch>`. A missing proposal is recorded without inventing code.

## D65 and research dependencies

Construction chain: existing GLM meaning and H23 tested candidate → bounded external-task contract → isolated implementation → offline and sandbox checks → frozen development episodes → scored report and review. Product approval, admission, default activation and publication remain absent.

Exact research dependencies are H23's record in `../glm-episodes-v1/analysis/provider-study-v1/payload-view-v1/research.json` and the existing evolution-runtime hypothesis, experiment, observation, decision constructors and record verifier. New records have no authority effect. The first-run DAG links the parent hypothesis, new hypothesis, experiment and observed outcome; it does not register a new ontology authority.

Operational owner: ARE evaluator. The pinned image and working test oracle are prerequisites for live scoring; credentials and fixed request caps are prerequisites for provider calls. Current construction is an opt-in benchmark package. Deployment, larger cohorts, ContextBench integration and cross-task memory remain separate later frontiers.

## Open Questions

Does H23 help on a repository-diverse held-out sample? Can the common adapted agent solve these tasks within the current output/turn budget? Are there meaningful post-delivery pressure transitions in this task? Native ContextBench scoring and its trace adapter are not implemented in this first outcome-track slice. These questions remain owned by the linked external benchmark plan; no first-run result closes full GLM qualification.
