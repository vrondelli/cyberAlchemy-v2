# Controlled GLM screening study

Status: offline candidate preparation complete; live integration pending.
Owner: ARE researcher. Authority effect: none.

This prepares H2 (output-contract burden) and H3 (boundary reasoning) from the [hypothesis study](../hypothesis-study-v1/README.md), following the [scorer audit](../offline-audit-v1/README.md) and [exact-request capture probe](../capture-probe-v1/README.md). It does not claim an improvement or execute a provider call.

## Treatment arms

| Arm | Change at final native submission | Comparison |
|---|---|---|
| baseline | Unchanged request and full patch contract | H2 control |
| metadata-card | Explicit required metadata reminder | H2 vs baseline |
| host-envelope | Model omits only fixed schema_version/authority_effect; host adds constants | H2 vs baseline, with separate raw/normalized metrics |
| neutral-card | General review reminder | H3 active control |
| boundary-card | Restates inspected archive or retention invariants | H3 vs neutral-card |

[Treatment adapters](treatments.mjs) operate on copies. Reading turns are unchanged. The host adapter retains model-supplied base hash, file hash, operation, path and complete source, then applies canonical full-schema and exact-scope validation. It rejects supplied envelope keys rather than overwriting them, and never applies a patch. Envelope-field fidelity is not applicable for the host arm, not a perfect score attributed to the model.

The adapters are not yet connected to the live agent. In particular, the existing native parser expects the full envelope. The future study runner must intercept and normalize only the assigned host-envelope response while preserving its raw bytes and stage-specific validity. Never weaken the serving parser or silently normalize the baseline.

The correction-card structure follows [ZTH reuse decisions](../hypothesis-study-v1/ZTH-REUSE.md), with attribution to David Bitecofer / GardenerDave. Card text is authored for these ARE contracts. No upstream model result is local evidence.

## Fixture split

[Prepared fixtures](prepared/manifest.json) contain four source mutations: archive interior-start acceptance, archive split-end acceptance, rejection of empty history, and acceptance of reordered tool results. Each has six hidden evaluation cases. References pass all 24 checks; all four mutants are detected. Their exact argument tuples do not duplicate their family's retained original oracle tuples.

These are new case/source variants in two known task families, not genuinely new task families. That distinction limits claims about H7/generalization. The original corpus is development evidence. Reserve the new oracle inputs for evaluation; do not tune prompts after inspecting model outcomes on them.

Every fixture's model allowlist is only README.md, subject.mjs and contract.json; only subject.mjs is mutable. Oracle, reference and task metadata are excluded. The future runner must enforce this allowlist and execute hidden checks in the existing sandbox. This preparation validates reference/mutant files locally; it does not establish that a future live harness enforces hidden-file isolation.

## Schedule and budget

The [schedule](prepared/schedule.json) has **120 trials**: four variants × three soft windows × two repetitions × five arms. There are 24 matched blocks. Run one block at a time with concurrency one. Cyclic arm rotation places each arm in each within-block position four or five times. This is counterbalancing, not randomized sampling. Time/position effects remain reportable.

Soft windows are 8000, 10000 and 12000; hard limit 16384; output cap 2048; reasoning effort low; model timeout 60 seconds. The candidate uses example-fields-v20 and recent-observations-v2. There are **no model retries and no correction calls** in this screening design, to separate initial quality from recovery. This differs intentionally from the qualified production candidate; every arm shares the same screening transport policy.

Maximum physical budgets are **1600 model attempts and 3200 tokenizer attempts**, summed from the per-trial caps. These are ceilings, not planned use or cost estimates. Stop at the cap. Do not replace failed trials or silently expand the sample. Any infrastructure stop leaves incomplete pairs visible and prevents applying the complete-pair screening rule.

## Analysis and decision rule

Primary endpoint: initial semantic correctness with a valid assigned output contract; transport failures count against end-to-end success. Preserve raw responses. Report model-contract validity, normalized full-contract validity, initial semantics, latency and token usage separately. Unknown usage stays unknown. Conditional semantic success among extractable proposals is descriptive because extraction is treatment-dependent.

Compare metadata-card/baseline, host-envelope/baseline and boundary-card/neutral-card within each matched block. Keep per-fixture and per-window results alongside aggregate paired wins/losses. The pilot prioritization criterion is at least three net paired wins among 24 complete blocks (12.5 percentage points), with no observed paired semantic losses for metadata/envelope changes. This is an explicit exploratory threshold, not statistical proof of superiority or noninferiority. Two repetitions and four source variants are not independent tasks and do not establish adequate power. A passing pilot requires a separate broader confirmatory design.

Boundary and neutral prompts have exact authored text, but are **not yet tokenizer-matched**. Before execution, measure their rendered instructions with the actual tokenizer and bind matched controls. Any adjustment creates a successor preparation with new hashes. Do not add hidden expected outputs to achieve a match.

## Evidence and verification

- [Protocol](prepared/protocol.json): parameters, comparisons, caps, screening rule and execution blockers.
- [Manifest](prepared/manifest.json): generated byte hashes, preparation-source hashes and reference/mutant results.
- [Cards](prepared/cards.json): explicit applicability, instructions and expectations.
- [Tests](study.test.mjs): baseline preservation, scoped normalization, malicious/missing fields, paired schedule and byte bindings.

All six tests passed. The preparation CLI is create-only:

```sh
node implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/controlled-study-v1/prepare.mjs /tmp/glm-study-new
node --test implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/controlled-study-v1/study.test.mjs
```

Tests verify the retained prepared/ directory. The manifest hashes generated artifacts and the named preparation sources; it is not a full live-candidate freeze. Fixture oracles and schedule rows inherit the unresolved questions below through this package index.

## Construction boundary and next frontier

CAV2-D65 product completed: tested offline treatment adapters, held-out variant fixtures and a bounded screening protocol. Runnable next product work is owned by the ARE implementer: connect the adapters to an isolated study runner, pass decorated requests through tokenizer/admission and actual transport, and normalize host envelopes only under their bound arm. The ARE evaluator owns loopback tests proving hidden-file isolation, unchanged baseline, correct budget accounting and treatment separation.

Live execution is blocked by those exact integration checks, tokenizer matching, and a final freeze of candidate/fixture/render/schedule/endpoint identities. No additional license approval is required for the ZTH reuse authorized by the user. Training, serving activation, deployment and publication remain separate deferred operations, owned by the project owner. This package neither launches the 120 trials nor declares a winning treatment.

## Open Questions

- Does full-path integration preserve baseline behavior and isolate host normalization to its assigned arm?
- Can neutral and boundary guidance be matched in tokenizer length without adding semantic hints?
- Will improvements survive unseen task families and larger samples after the pilot?
- Does host normalization reduce end-to-end failures while preserving useful code quality?
- What failures remain after prompt content, wire construction and recovery are separated?
