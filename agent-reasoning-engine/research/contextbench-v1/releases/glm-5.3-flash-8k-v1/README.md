# GLM-5.3-flash 8K ContextBench milestone v1

Release-candidate snapshot: 2026-09-16. Authority effect: none.

## Result

The H72 request-local terminal evidence-handle mechanism passed a fresh
development canary and an independent eight-pair confirmation at the 8,000-token
experimental window.

| Confirmation metric | Control | Treatment | Difference |
| --- | ---: | ---: | ---: |
| Macro Span-F1 | 2.70% | 15.85% | +13.15 percentage points |
| Span coverage | 1.46% | 17.66% | +16.20 percentage points |
| Span precision | 22.96% | 29.03% | +6.07 percentage points |
| File coverage | 25.00% | 41.67% | +16.67 percentage points |
| File precision | 50.00% | 62.50% | +12.50 percentage points |
| Valid selections | 6/8 | 8/8 | +2 |
| Logical model tokens | 586,770 | 583,202 | -3,568 |

All eight confirmation pairs were complete and causally valid. No receipt had
unknown token use, no automatic retry occurred, and every frozen semantic,
instrument, provenance, and token check passed.

## Claim correction

`round55-confirmation-outcome.json` and its closeout contain the historical field
`benchmark_cleared: true`. In this release that field means the bounded
GLM-5.3-flash **8K context-selection milestone** passed. It does not mean that
the full `acceptance.json` contract passed.

The full contract also requires all 1,136 pinned identities to be accounted for,
10K and 12K windows, two confirmation repetitions, full source/language/token
tier reporting, and the declared statistical checks. Those requirements remain
open. The normalized release status is therefore:

- `milestone_cleared`: `true`
- `full_contextbench_acceptance_cleared`: `false`

Raw frozen records are retained unchanged so their hashes and historical
meaning remain auditable.

## Supported claim

For GLM-5.3-flash at the 8K experimental window, the H72 treatment improved
terminal source-context selection on the registered development and independent
confirmation cohorts while using fewer cumulative model input-plus-output
tokens.

This snapshot does not establish full-dataset ContextBench clearance, code
repair correctness, a production default, larger-window behavior, non-code
transfer, or cross-model transfer. Absolute confirmation quality also remained
limited: treatment Span-F1 was 15.85%.

## Mechanism

At a held terminal decision, treatment presents at most three short request-local
handles with source path and range information. The model selects handles;
outside the prompt, ARE resolves them one-to-one to exact receipt-bound evidence.
The treatment state and tool schema contain no full evidence identifiers, and
identifiers inherited by both arms must have equal occurrence counts.

## Reproduce the release checks

From the repository root:

```bash
node agent-reasoning-engine/research/contextbench-v1/releases/glm-5.3-flash-8k-v1/verify.mjs
```

The verifier checks every manifest hash, task-manifest membership, the frozen
Round 55 digest, the reported metrics, the normalized claim boundary, and the
absence of credential files from the release set. It does not make live model
calls or reconstruct deleted temporary worktrees.

The release-scoped suite passes **447/447 tests**. A broader 1,183-test workspace
audit has 21 failures in unrelated router/generated AlchLang and
requirement-research fixtures (missing research files and generated hash drift).
Those failures do not touch the release manifest, but they prevent describing
the whole repository as green.

The applicable source regression command is recorded in `validation.json`.
Live replay additionally requires the original model endpoint, pinned public
repositories, and credentials supplied outside the release. Credentials,
caches, generated worktrees, and local retained-data roots are intentionally
excluded.

## Contents

- `manifest.json`: exact release file inventory and normalized status.
- `verify.mjs`: offline integrity and semantic verifier.
- `validation.json`: generated verifier and regression results.
- `../../CONTEXTBENCH-RESEARCH-REPORT.md`: plain-language research history.
- `../../round52-outcome.json`: successful development evidence.
- `../../round55-confirmation-outcome.json`: successful independent confirmation.
- `../../round55-closeout.json`: reviewed bounded decision.
- `../../larger-window-v1/PLAN.md`: gated 10K then 12K successor plan.

## Open Questions

- Does the unchanged H72 mechanism transfer to 10K and then 12K?
- What full-dataset execution design can meet `acceptance.json` without weakening
  its fixed denominator or token accounting?
- Does better selected context improve completed task correctness?
