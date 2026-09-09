# Calibrated provider study

Candidate research implementation; no serving runtime activation. The [prospective hypothesis DAG](../hypothesis-study-v1/README.md) and [fixed protocol](../controlled-study-v1/README.md) own the research design. This package finishes calibration and bounded execution preparation, not GLM qualification.

## Observed result

The calibration stage used six real Z.ai tokenizer requests and zero chat requests, producing exact neutral/boundary token equality on the representative captured final prompts: archive 2,177 tokens; retention 2,435 tokens. See [calibration result](calibration/result.json). Request files and receipts retain the exact synthetic payload hashes; no credential material is stored. Equality is established for these representative prompts only. Actual live contexts can tokenize differently.

The [container preflight](container-preflight/result.json) ran the pinned validator: reference 6/6, known mutant 5/6, with the boundary error detected and both workers verified absent afterward. This is validator evidence, not model performance.

Six controller tests pass, covering immutable source/schedule binding, completed-row skip, arm/result tampering, unfinished reservations, physical attempt caps, forbidden retries, calibration integrity, and a simulated interrupted dispatch that cannot run twice.

## Frozen execution

The [manifest](frozen/manifest.json) binds the compiled candidate, exact protocol, 120-row schedule, calibration requests/receipts, container receipts, controller/tests, runtime source closure and prepared fixtures. The controller verifies these before dispatch and before accepting completion. Changes require a new reviewed freeze; do not refresh hashes in place.

Study maximum: 120 trials, 1,600 model attempts and 3,200 tokenizer attempts, concurrency one, no automatic retries. The six calibration requests are separate from these study caps. Existing transport limits enforce physical caps before dispatch. Each trial reserves its full allowance before execution, and receipts include failed attempts. Completed rows cannot rerun in the same bound run directory. An interrupted row or stale controller lock requires investigation; deleting either to redispatch is not a supported recovery procedure. Using a new run directory creates a separate study budget, so operators must retain one designated directory for this study.

The controller applies the calibrated neutral card before actual token measurement. Host-envelope normalization retains the original response evidence. Only the three allowlisted fixture files are exposed to the model. Candidate code is evaluated through the pinned container validator against the hidden oracle; it is not applied to the repository.

Run local checks from the repository root:

```sh
node --test implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/controller.test.mjs
```

The first four matched blocks have now executed. Continue the same designated run directory with the `run FROZEN_DIRECTORY PRIVATE_RUN_DIRECTORY CREDENTIAL_CONFIG MAX_NEW_TRIALS` controller command; completed rows are skipped. Inspect transport receipts, treatment delivery and hidden-case results at each boundary. That preparation boundary is complete. The subsequent owner-directed live run and canonical hypothesis observations are recorded in [research](research/README.md); consult its immutable snapshots for completed-row counts. The separate [pressure research chain](pressure-v3/README.md) tests the missing recycling exposure with an additional explicit two-trial cap.

## Construction boundary

CAV2-D65: owner-directed candidate work under CA2-ROUTE-IMPLEMENT, request `glm-calibration-freeze-58`. Scope: this package and the analysis index. Maximum calibration allowance 64 tokenizer calls; used six. No chat calls, commits, dependency adoption or runtime activation. Existing credential bridge consumed the configured secret reference without exporting material. No ontology record or selector dependencies. ARE route/effect receipts are evaluations, not authority grants.

## Open Questions

Do metadata and host-envelope treatments improve first-attempt reliability without semantic loss? Does boundary guidance beat the calibrated neutral instruction? Do the 8K/10K/12K conditions actually recycle on live tasks? Representative token equality must not be generalized to every live context. The 120 rows cover variants in two known task families; broader task generalization and GLM's larger context window remain separate work. Cross-directory replay prevention and audited recovery of uncertain dispatches are not implemented; this controller deliberately stops on uncertainty.
