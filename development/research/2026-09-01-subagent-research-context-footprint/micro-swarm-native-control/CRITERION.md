# Native Micro-Swarm Control Criterion

Criterion ID: `context-footprint-luna-six-vs-sol-reference-300s`

## Hypothesis

On the frozen six-task context-footprint benchmark, the two-wave six-Luna swarm completes its validated arm within 300000 ms, covers every mandatory task, and scores no more than 5 quality points below the blind single-Sol reference arm.

## Arms

### luna_swarm

- Model: `gpt-5.6-luna`
- Tasks: MAP-001, MAP-002, MAP-003, MAP-004, MAP-005, MAP-006
- Isolation: Each explorer receives one frozen task and its declared source selectors only; explorers cannot see peer or Sol outputs.
- Output: One cav2.micro-swarm-claim-card.v1 object per task

### sol_reference

- Model: `gpt-5.6-sol`
- Tasks: MAP-001, MAP-002, MAP-003, MAP-004, MAP-005, MAP-006
- Isolation: The reference runner receives the same six frozen task objects and sources in one prompt and cannot see Luna outputs.
- Output: An array of six cav2.micro-swarm-claim-card.v1 objects

## Measurements

- `coverage_required`: 1
- `deadline_ms`: 300000
- `parity_tolerance_points`: 5
- `quality_score`: Mean exact structured-field score across the six frozen task IDs, as defined by TOURNAMENT-SPEC.md and score_parity.mjs.

## Mechanical verdict rule

### INVALID

- Either arm lacks exactly one schema-valid terminal card for every frozen task.
- A card uses an undeclared source or selector, the scorer fails, or Luna wall timing is absent or negative.
- Any bound artifact differs from its frozen SHA-256 or size.

### FALSIFIED

- The Luna arm wall time exceeds 300000 ms.
- The Luna arm has less than complete mandatory-task coverage.
- The Luna quality score plus 5 points is lower than the Sol reference quality score.

### SURVIVED

- No INVALID condition holds, Luna wall time is at most 300000 ms, coverage is complete, and Luna quality plus 5 points is at least the Sol reference quality.

## Non-goals

- General Luna and Sol model equivalence
- RunPod, H200, GB10, or vLLM serving-capacity proof
- Cost, energy, production reliability, publication, or deployment authority
- Semantic quality beyond the frozen structured-card fields

## Reproducibility

1. Verify all exact refs and deterministic views before releasing model work.
1. Run the Luna waves and Sol reference with frozen prompts and preserve raw JSON and wall-clock receipts.
1. Validate cards with the existing micro-swarm harness, then invoke score_parity.mjs with the frozen control cards.
1. Recompute the verdict from preserved inputs; never accept a model-authored scientific verdict.

## Claim ceiling

A verdict applies only to this exact six-task control and grants no capability adoption, model-equivalence, publication, release, deployment, or external-effect authority.
