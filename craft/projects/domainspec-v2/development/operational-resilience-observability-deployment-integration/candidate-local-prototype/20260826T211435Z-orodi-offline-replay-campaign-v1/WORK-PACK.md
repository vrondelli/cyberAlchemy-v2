# ORODI WP7 — candidate-local offline replay campaign

## Status and authority

- Work Pack ID: `WP-ORODI-007`
- Run ID: `20260826T211435Z-orodi-offline-replay-campaign-v1`
- Status: `candidate-authored-awaiting-exact-acceptance`
- Complexity: medium
- Output mode: split
- Execution designation: execution-candidate
- Work Pack gate: blocked pending exact owner acceptance and fresh implementation admission
- Exact acceptance: unapproved
- Execution entry: blocked
- Admission timing: full frontier; the complete three-SWU manifest must be accepted as one digest-bound candidate
- Finite frontier: three serial SWUs in W0 -> W1 -> W2 order
- Finite-stream risk ceiling: bounded repository-local write
- Execution authorization: not granted by this artifact
- Task Session route: not exposed
- Runtime admission: denied
- Lifecycle reconciliation: deferred
- Authority effect: none

## Objective

Build the smallest repository-local coordinator that consumes between two and seven exact WP6 replay inputs plus their supplied WP6 result bytes, recomputes every replay through the existing pure WP6 API, rejects any drift or authority escalation, and emits one deterministic candidate-local campaign result.

The campaign result aggregates audit projections only. It must preserve each item's binding, eligibility receipt, and derived result as a distinct partition. It must never merge distinct WP6 bindings into one `OperationalEvaluationBundle`, derive one cross-binding control state, admit a replay observation, or upgrade replay-only evidence.

## Boundary correction: campaign, not evaluation bundle

The seven WP6 golden fixtures intentionally use distinct `EvaluationBinding` identities and distinct invalidation-key digests. The generic `OperationalEvaluationBundle` owns exactly one binding. Therefore WP7 must model a campaign of independently evaluated replay items, not a synthetic multi-binding evaluation bundle.

This boundary prevents three invalid inferences:

1. observations from different subjects or invalidation domains cannot support one shared control claim;
2. one item's derived result cannot be applied to another item's binding; and
3. aggregation cannot become a new eligibility or runtime-admission decision.

## Fixed composition decisions

1. Composition is atomic and fail-closed. Any campaign-level or item-level finding returns `verdict: "rejected"` with empty item, observation, eligibility-receipt, and derived-result projections.
2. A campaign contains two through seven items and at most one item for each of the seven WP6 families.
3. `campaign_id`, `item_id`, `replay_id`, profile identity, family, binding ID, and observation ID must be non-empty and unique in their declared domains.
4. One explicit `evaluated_at` applies to the campaign and must equal every replay input, supplied result, recomputed result, and eligibility result evaluation instant.
5. Every supplied WP6 result is exact UTF-8 JSON bytes with a caller-supplied SHA-256. WP7 recomputes WP6 from the corresponding exact inputs and requires both raw-byte digest equality and semantic equality with the recomputed result.
6. Every accepted item must be WP6 `replayed`, have eligibility decision `replay-only`, and retain `runtime_admission: "denied"`, `referent_trust: "unverified"`, and `authority_effect: "none"` at every nested boundary.
7. Every accepted observation remains product-plane simulation with zero telemetry, no deployment effect, and no independent-observation claim.
8. `runtime_admitted_observations` and aggregate `eligible_controls` are always empty. Every nested eligibility receipt has `eligible_controls: []`.
9. Per-binding derived results are preserved as labeled partitions. WP7 emits no aggregate derived result and performs no cross-binding control derivation.
10. Input order is non-semantic. Accepted items and projections are sorted by `(family_id, profile_id, profile_version, replay_id, item_id)`. Findings are deduplicated and sorted by `(path, code, detail)`.
11. The campaign input and all nested byte sequences remain unmodified.
12. WP7 has no CLI. Its only product behavior is one invocation-free pure API.

## Delivery boundary

### Inputs

`composeToolEvidenceReplayCampaign` receives one immutable object containing:

- `campaign_id`;
- explicit `evaluated_at`;
- two through seven campaign items; and
- `authority_effect: "none"`.

Each item contains:

- `item_id`;
- the complete caller-supplied `ToolEvidenceProfileReplayInputs` required by WP6;
- exact supplied WP6 result bytes; and
- the SHA-256 of those exact supplied result bytes.

No path, URL, file handle, callback, function, module identifier, package name, process handle, credential, environment lookup, clock source, or network source is accepted.

### Outputs

An accepted campaign emits:

- one closed campaign identity and canonical input-manifest digest;
- sorted item receipts binding exact raw and recomputed result digests;
- sorted replay observations for audit only;
- sorted replay-only eligibility receipts;
- sorted per-binding derived-result partitions;
- `runtime_admitted_observations: []`;
- `eligible_controls: []`;
- `verdict: "composed"`;
- `runtime_admission: "denied"`;
- `referent_trust: "unverified"`; and
- `authority_effect: "none"`.

A rejected campaign emits its safe campaign identity, input-manifest digest when computable, sorted findings, and the same authority ceiling, but no partial item or evidence projections.

## Source evidence

| Source | SHA-256 | Obligation |
| --- | --- | --- |
| `candidate-local-prototype/20260826T174949Z-orodi-offline-profile-replay-v1/WORK-PACK.md` | `f8bbf89465db7fb19be9acc96125607b9d5225cfb0ab3ace6f325e645183cf27` | accepted WP6 behavior and completion ceiling |
| `contracts/tool-evidence-profile-replay.ts` | `710f635350e2f8b5b7961c7e6de17e29328d8d57f852970d951f8b62b3afb2c3` | replay input/result and fixture contracts |
| `contracts/tool-evidence-profile-replay-result.schema.json` | `2c2c7549a2fbf3a4a6e95809681a48b16a89a7836ff52d6cf72ec51264f3870a` | closed WP6 result shape |
| `contracts/evidence-eligibility.ts` | `ee8c4e0de9a3bfde28e717841dd8ab4d598e12fdf3f3bd6f1843f87afddaecf2` | replay-only eligibility and per-binding result types |
| `src/replay-tool-evidence-profile.ts` | `d3919faba7d4578e0cc292f47ecc4c772e0bdb8a4136c740a194824cb52c70a0` | pure replay recomputation entry point |
| `src/evaluate-evidence-eligibility.ts` | `6ae6ad21243c5b584b372ba12b38c72d65d63d945e20d28f5421f22c0d8f8965` | existing sibling eligibility behavior |
| `fixtures/tool-evidence-profile-replay/golden/cases.json` | `b55a652923b2aa560c30a12f16aabf4f312973bd30c78d7c73bad6171f2a5890` | seven exact family fixtures |
| `fixtures/tool-evidence-profile-replay/evaluation-context.json` | `3a6c1f28b2a3f35bdbc155195c6c2012680eb1435dc95e6df856dd773b3abfa0` | seven distinct binding/invalidation contexts |
| `test/tool-evidence-profile-replay.test.ts` | `f309602b07bcfe3fa28ee8a9064d56431bc76452fae10b5900332338e6d2f711` | WP6 replay and hostile proof conventions |
| `README.md` | `85098eee9d94a53b98cd0507a5999de422abe96852109c0139851890dc320e34` | current candidate-local claim ceiling |
| `operational-resilience/tsconfig.json` | `e9c97ceb1dd78bb317e82d20c717e24d0d011b66c0ca322fa674e7676b6c1190` | compile boundary |
| `impl/package.json` | `0cb21aa8116166073844207ad0cf8820ce6d9f4e4bba559f657567d446cb238f` | existing runtime and test dependencies |
| `impl/package-lock.json` | `12d5dc3b41e490983bd413f91184de88bf0aabd2a7a0de704ff93538889be298` | dependency lock boundary |

An implementation attempt must revalidate these source hashes before product mutation. Any semantic source drift stops the lane and requires a revised Work Pack.

## Local-first research decision

- Decision: no external research required.
- Evidence: WP5 and WP6 already define the seven-family denominator, exact pure replay API, eligibility ceiling, fixture corpus, and deterministic test conventions.
- Inventory result: the Invoke work-pack and implementation-layering templates are locally available and selected; no new inventory package is installed.
- External access: forbidden for WP7 authoring and implementation.
- Named local gap resolved: multi-profile aggregation cannot use one generic evaluation bundle because the source contexts are intentionally distinct. The campaign-partition model resolves the gap without changing generic contracts.

## Closed contract shapes

### Campaign fixture manifest

`domainspec.orodi.tool-evidence-replay-campaign-fixture/v1` is a test-only repository manifest. It contains a campaign ID, evaluated time, two through seven item references to the existing WP6 golden case/context IDs, and `authority_effect: "none"`. It cannot carry executable code, absolute paths, URLs, or runtime handles.

### Campaign result

`domainspec.orodi.tool-evidence-replay-campaign-result/v1` contains:

- composer ID `domainspec.orodi.tool-evidence-replay-campaign-composer`;
- composer version `1.0.0-candidate-local`;
- evidence lane `candidate-local-prototype`;
- campaign identity, evaluation instant, and canonical input-manifest digest;
- zero or more closed item receipts;
- zero or more audit-only replay observations;
- zero or more replay-only eligibility receipts;
- zero or more per-binding derived-result partitions;
- empty runtime-admitted observations and eligible controls;
- `composed | rejected` verdict;
- sorted findings;
- denied runtime admission, unverified referents, and no authority effect.

The schema must enforce empty projections on rejection and two-through-seven item receipts on composition. It must not expose `runtime-eligible`, `live`, aggregate control state, or protected effect branches.

## Ordered composition algorithm

1. Validate the top-level object, campaign identity, exact evaluation instant, authority literal, and two-through-seven item cardinality without mutating inputs.
2. Validate every item envelope and reject duplicate declared item IDs before replay execution.
3. Recompute every item by calling the existing `replayToolEvidenceProfile` with the exact supplied WP6 inputs.
4. Parse supplied WP6 result bytes as one exact UTF-8 JSON value and reject duplicate object keys before semantic use.
5. Recompute and compare the supplied-result raw SHA-256, then require closed structural compatibility with the existing WP6 result.
6. Require exact equality among campaign, replay-input, supplied-result, recomputed-result, and eligibility evaluation instants.
7. Validate the supplied result's denied/unverified/no-authority ceiling and reject any live, effect, independent-observation, non-zero-telemetry, runtime-admitted-observation, or eligible-control claim.
8. Require the recomputed result to be `replayed`, its eligibility to be present and `replay-only`, and its rejected/partial surfaces to be empty.
9. Require semantic equality between the supplied and recomputed WP6 results. Raw formatting differences may change the input-manifest digest but cannot change semantic acceptance.
10. Extract the exact family, profile identity, replay ID, binding ID, observation ID, eligibility receipt, and derived-result partition from each accepted recomputed item.
11. Reject duplicate replay, family, profile, binding, or observation identities across items.
12. Sort accepted items by `(family_id, profile_id, profile_version, replay_id, item_id)` and build a canonical input manifest from each item's existing WP6 input digests plus supplied-result digest.
13. Flatten only audit-safe replay observations and replay-only eligibility receipts. Preserve derived results as per-binding partitions and do not call the foundational evaluator over a merged set.
14. On any finding, discard every item and aggregate projection before returning rejected. Otherwise return composed.
15. Deduplicate and sort findings by `(path, code, detail)` for every return path.

## Exact product write manifest

The product mutation boundary is exactly the nine normalized repository paths in `WP7-PLANNED-WRITE-MANIFEST.txt`.

### Create

1. `contracts/tool-evidence-replay-campaign.ts`
2. `contracts/tool-evidence-replay-campaign-fixture.schema.json`
3. `contracts/tool-evidence-replay-campaign-result.schema.json`
4. `src/compose-tool-evidence-replay-campaign.ts`
5. `fixtures/tool-evidence-replay-campaign/golden/cases.json`
6. `fixtures/tool-evidence-replay-campaign/hostile/cases.json`
7. `fixtures/tool-evidence-replay-campaign/expected-results.json`
8. `test/tool-evidence-replay-campaign.test.ts`

### Modify

9. `README.md` — add only a section anchored by `## Offline replay campaigns (candidate-local)`.

No package, lockfile, tsconfig, WP5 profile/validator, WP6 replay/registry/eligibility source, existing fixture, generic observation/evaluation contract, derived-control evaluator, infrastructure, deployment, ontology, lifecycle, Craft, Arcanum, or other project path is writable.

## Waves and Smallest Working Units

### W0 / L0 — closed campaign contracts

Task: [TASK-CAMPAIGN-CONTRACT](work-pack/tasks/TASK-CAMPAIGN-CONTRACT.md)

#### `SWU-ORODI-WP7-001` — campaign types and schemas

- Primary behavior: define the closed campaign input, item-receipt, per-binding partition, finding, and result contracts.
- Write scope: the three new files under `contracts/`.
- Dependencies: the pinned WP6 replay and eligibility types/schemas.
- Split analysis: TypeScript types and the two schemas form one acceptance boundary because each must encode the same atomic rejection and authority-ceiling rules; no behavior is implemented here.
- Done criteria: all objects are closed; composed/rejected conditionals are enforced; two-through-seven cardinality is explicit; no aggregate-derived or runtime-eligible branch exists.
- Acceptance evidence: strict TypeScript compile, schema self-parse, positive/negative synthetic schema instances.

W0 gate: the contract closes every output and can represent no partial rejected result.

### W1 / L1 — pure campaign composition

Task: [TASK-CAMPAIGN-COMPOSER](work-pack/tasks/TASK-CAMPAIGN-COMPOSER.md)

#### `SWU-ORODI-WP7-002` — deterministic campaign composer

- Primary behavior: recompute and verify two-through-seven WP6 items, enforce cross-item identity/time/authority invariants, and emit one atomic sorted campaign result.
- Write scope: `src/compose-tool-evidence-replay-campaign.ts`.
- Dependencies: SWU-ORODI-WP7-001 and unchanged WP6 APIs.
- Split analysis: item recomputation, supplied-result parity, cross-item uniqueness, and atomic projection cannot pass independently because any partial boundary could launder a forged or rejected item into the campaign.
- Done criteria: deterministic permutation-invariant output, no partial rejection output, per-binding partitions only, no input mutation, and no I/O/dynamic-code surface.
- Acceptance evidence: focused in-memory composed/rejected checks and forbidden-surface scan.

W1 gate: valid campaigns compose independent items without merging bindings; any hostile item closes the whole campaign.

### W2 / L2 — finite adversarial proof and documentation

Task: [TASK-CAMPAIGN-PROOF](work-pack/tasks/TASK-CAMPAIGN-PROOF.md)

#### `SWU-ORODI-WP7-003` — corpus, regression, and claim ceiling

- Primary behavior: prove three golden campaign shapes and exactly 25 hostile campaign cases while preserving all WP1-WP6 behavior.
- Write scope: the three fixture files, the new test file, and the additive README section.
- Dependencies: SWU-ORODI-WP7-002.
- Split analysis: corpus identities, expected discriminators, executable replay, and documentation are retained together because a fixture-only or test-only artifact would not prove the declared finite denominator or user-visible authority ceiling.
- Done criteria: exact corpus parity, permutation invariance, deterministic double-run equality, schema validation, full regression, baseline parity, and explicit denial of live/deployment/lifecycle claims.
- Acceptance evidence: the complete validation strategy below.

W2 gate: all declared checks pass and the exact nine-path product manifest is clean.

## Golden campaigns

Exactly three golden campaign fixtures are required:

| Case ID | Families | Purpose |
| --- | --- | --- |
| `golden-full-seven` | all seven WP6 families | complete denominator, sort order, and per-binding partition proof |
| `golden-core-signal-and-exercise` | telemetry, health-failure, workload, fault | monitoring/load/fault replay composition without runtime claims |
| `golden-progressive-delivery-audit` | canary-analysis, deployment-observation, rollback-observation | progressive-delivery audit composition without effect claims |

Tests must replay `golden-full-seven` in original, reversed, and a fixed shuffled order and require byte-identical canonical results.

## Hostile campaign corpus

Exactly 25 hostile cases are required, with one stable required discriminator each:

| Case ID | Required code |
| --- | --- |
| `zero-items` | `CAMPAIGN_ITEM_COUNT_INVALID` |
| `one-item` | `CAMPAIGN_ITEM_COUNT_INVALID` |
| `eight-items` | `CAMPAIGN_ITEM_COUNT_INVALID` |
| `duplicate-item-id` | `CAMPAIGN_ITEM_ID_DUPLICATE` |
| `duplicate-replay-id` | `CAMPAIGN_REPLAY_ID_DUPLICATE` |
| `duplicate-family` | `CAMPAIGN_FAMILY_DUPLICATE` |
| `duplicate-profile-identity` | `CAMPAIGN_PROFILE_IDENTITY_DUPLICATE` |
| `duplicate-binding-id` | `CAMPAIGN_BINDING_ID_DUPLICATE` |
| `duplicate-observation-id` | `CAMPAIGN_OBSERVATION_ID_DUPLICATE` |
| `evaluated-at-mismatch` | `CAMPAIGN_EVALUATION_TIME_MISMATCH` |
| `supplied-result-absent` | `CAMPAIGN_RESULT_INVALID` |
| `supplied-result-malformed` | `CAMPAIGN_RESULT_INVALID` |
| `supplied-result-digest-drift` | `CAMPAIGN_RESULT_DIGEST_MISMATCH` |
| `recomputed-replay-rejected` | `CAMPAIGN_ITEM_REPLAY_REJECTED` |
| `supplied-result-semantic-drift` | `CAMPAIGN_RESULT_MISMATCH` |
| `eligibility-absent` | `CAMPAIGN_ELIGIBILITY_MISSING` |
| `eligibility-rejected` | `CAMPAIGN_ELIGIBILITY_REJECTED` |
| `runtime-admission-forged` | `CAMPAIGN_RUNTIME_ADMISSION_FORGED` |
| `referent-trust-forged` | `CAMPAIGN_REFERENT_TRUST_FORGED` |
| `authority-effect-forged` | `CAMPAIGN_AUTHORITY_EFFECT_FORGED` |
| `runtime-observation-forged` | `CAMPAIGN_RUNTIME_OBSERVATION_FORGED` |
| `eligible-controls-forged` | `CAMPAIGN_ELIGIBLE_CONTROLS_FORGED` |
| `live-mode-observation` | `CAMPAIGN_LIVE_OBSERVATION_FORGED` |
| `deployment-effect-forged` | `CAMPAIGN_EFFECT_OBSERVATION_FORGED` |
| `independent-observation-forged` | `CAMPAIGN_INDEPENDENT_OBSERVATION_FORGED` |

Each hostile result must include its required code, deterministic sorted findings, denied runtime admission, unverified referents, no authority effect, and no item/evidence/derived projections.

## Validation surface

Run from `/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl` unless stated otherwise.

1. TypeScript:

   ```bash
   PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH npm exec -- tsc --project operational-resilience/tsconfig.json --noEmit
   ```

2. Full operational-resilience regression:

   ```bash
   PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH node --import tsx --test operational-resilience/test/*.test.ts
   ```

3. Focused WP7 proof:

   ```bash
   PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH node --import tsx --test operational-resilience/test/tool-evidence-replay-campaign.test.ts
   ```

4. JSON parse and result-schema replay:

   ```bash
   find operational-resilience/contracts operational-resilience/fixtures/tool-evidence-replay-campaign -type f -name '*.json' -print0 | xargs -0 -n1 jq empty
   ```

   Validate every emitted golden and hostile campaign result with `python3 -m jsonschema` against `tool-evidence-replay-campaign-result.schema.json`.

5. Corpus parity: require exactly three unique golden IDs, exactly 25 unique hostile IDs, and one-to-one hostile/expected-result parity.

6. Purity/static scan:

   ```bash
   if rg -n "import\\(|require\\(|eval\\(|new Function|Function\\(|node:(fs|child_process|net|http|https|os|vm|module)|process\\.|fetch\\(|Date\\.now|new Date\\(|readdir\\(|glob\\(|exec(File)?\\(|spawn\\(" operational-resilience/src/compose-tool-evidence-replay-campaign.ts; then exit 1; fi
   ```

7. Authority assertions: every golden/hostile path denies admission and authority, accepted nested receipts remain replay-only, aggregate admitted observations and eligible controls are empty, rejected projections are all empty, and no merged derived result exists.

8. Exact manifest and baseline: verify exactly nine unique paths; eight create targets absent; README pre-edit digest and section boundary captured; every other operational-resilience file frozen by SHA-256; package and lockfile byte-identical; final targets regular, non-symlink, non-empty, newline-terminated, and conflict/trailing-whitespace free.

9. Repository hygiene:

   ```bash
   xargs -d '\n' git diff --check -- < <absolute-WP7-manifest>
   ```

Any acceptance-critical failure blocks closeout. A later success cannot mask an earlier failed gate.

## Candidate-local closeout contract

Each SWU must return its ID, result, files touched, exact validations, blockers, residue, and successor. The parent implementation run must retain a pre-mutation baseline, publish and join the deferred-governance Handoff Notice before product mutation, and return one consolidated report containing:

- accepted Work Pack and manifest digests;
- source-hash revalidation;
- final nine-path digest inventory;
- created/modified path parity;
- commands, exits, test counts, and schema counts;
- golden/hostile parity;
- forbidden-surface result;
- baseline and package-lock parity;
- Handoff Notice locator; and
- explicit claim-ceiling denials.

Closeout synchronizes candidate-local evidence only. It cannot update Craft, Invoke lifecycle state, ontology/profile admission, runtime authority, promotion, publication, infrastructure, deployment, or release state.

## Implementation stop conditions

Stop before product mutation for:

- missing explicit authorization to implement the exact accepted Work Pack and manifest digests;
- Work Pack, manifest, or pinned source drift after acceptance;
- any create target already present without a separately accepted adoption decision;
- need to modify a WP5/WP6 or generic contract/source/fixture;
- ambiguity that would require merging bindings or deriving aggregate controls;
- a requirement for more than one item per family or more than seven items;
- partial-success semantics;
- dependency installation or package/lockfile mutation;
- filesystem, process, network, credential, dynamic-code, discovery, clock, live-tool, infrastructure, canary, deployment, rollback, or protected-effect access;
- runtime admission, profile/ontology promotion, lifecycle reconciliation, Git publication, or release;
- a write outside the exact nine-path product manifest; or
- failed acceptance-critical validation.

## Pre-implementation handoff requirement

Before any WP7 product mutation, publish and join one local-only Handoff Notice that binds the exact accepted Work Pack and manifest digests, records lifecycle reconciliation as deferred, names the nine-path product ceiling, and grants no authority by itself.

## Completion contract

WP7 is complete only when:

1. all three SWUs pass in W0 -> W1 -> W2 order;
2. all three golden campaigns compose deterministically;
3. all 25 hostile campaigns reject with their required discriminator;
4. input permutation cannot change the canonical result;
5. every item is recomputed through unchanged WP6 and remains replay-only;
6. all aggregate admitted-observation and eligible-control sets are empty;
7. per-binding derived partitions are preserved and no aggregate derived result exists;
8. every declared schema and validation command passes;
9. the exact nine-path manifest and frozen baseline pass; and
10. the consolidated report explicitly denies live-tool, infrastructure, deployment, lifecycle, release, and production-readiness claims.

The next route after candidate implementation is deferred owner review. It is not runtime admission, live integration, infrastructure planning, deployment, or lifecycle reconciliation unless separately authorized.
