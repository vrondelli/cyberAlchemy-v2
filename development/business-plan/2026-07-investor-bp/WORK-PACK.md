---
module: investor-package-language-value-migration
version: current
status: pass
updatedAt: 2026-07-12
docType: work-pack
---

# WORK-PACK: Investor Package Language And Value Migration

## Control Fields

| Field | Value | Notes |
| --- | --- | --- |
| workPackGateStatus | pass | Mutation planning is ready; investor circulation is not. |
| complexity | medium | Seven target artifacts, six tasks, eight SWUs, protected context, and browser validation. |
| outputMode | split | Task, wave, and shared-context contracts are present. |
| executionPackRef | `EXECUTION-PACK.md` | Cross-task choreography only. |
| layeringArtifactRef | `IMPLEMENTATION-LAYERING.md` | L0-L3 authority. |
| dispatchTechniqueTrace | `INVOKE-PLAN.md#dispatch-spec-technique-trace` | Full route: `MUTATION-DISPATCH.json`. |
| distillValidationStatus | pass | See `DISTILL-VALIDATION.md`. |
| activeLayerWindow | L0 | Evidence controls first. |
| selectedSWU | `SWU-CABP-001` | Execute one SWU only. |
| lastUpdatedAt | 2026-07-12 | Approved language research integrated. |
| readinessProfile | pilot | Private investor-conversation package, not public release. |

## Objective

Mutate every current investor-package artifact so a nontechnical investor can
identify the customer, purchase trigger, delivered work, changed customer
workflow, possible money mechanism, validation method, and current evidence
boundary without learning internal CyberAlchemy vocabulary.

Success requires artifact parity, no unsupported claim promotion, and browser
validation of the HTML derivative.

## Source Contracts

- [Approved findings](../../research/2026-07-11-investor-language-customer-value/findings.md)
- [Verbatim research](../../research/2026-07-11-investor-language-customer-value/research.md)
- [Shared execution context](work-pack/shared/context.md)
- [Cross-task decisions](work-pack/shared/cross-task-decisions.md)
- [Cross-task gaps](work-pack/shared/cross-task-gaps.md)
- [Traceability map](work-pack/shared/traceability.md)

## Delivery Slices

| Slice | Outcome | Layer | Wave | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| S-001 | Evidence registry and source trace govern the new language. | L0 | [W0](work-pack/waves/W0.md) | approved findings | Status and source parity review. |
| S-002 | Financial and operating models use the new offer and measurement contract. | L1 | [W1](work-pack/waves/W1.md) | S-001 | Cross-file offer, taxonomy, and gate parity. |
| S-003 | Canonical BP rewritten around one concrete transaction. | L2 | [W2](work-pack/waves/W2.md) | S-001, S-002 | Narrative and forbidden-claim review. |
| S-004 | Provisional claim audit classifies all Markdown artifacts. | L2 | [W3](work-pack/waves/W3.md) | S-003 | Every load-bearing claim classified. |
| S-005 | HTML rebuilt as an audited BP derivative. | L3 | [W4](work-pack/waves/W4.md) | S-004 | HTML parse, content parity, no new claims. |
| S-006 | Final browser, comprehension, and claim audit. | L3 | [W5](work-pack/waves/W5.md) | S-005 | Desktop/mobile screenshots and final verdict. |

## Task Board

| Task | Goal | Layer | Wave | Gate | Status |
| --- | --- | --- | --- | --- | --- |
| [TASK-CABP-001](work-pack/tasks/TASK-CABP-001-EVIDENCE-CONTROLS.md) | Migrate evidence registry and source trace. | L0 | W0 | ready | not-started |
| [TASK-CABP-002](work-pack/tasks/TASK-CABP-002-ECONOMICS-OPERATIONS.md) | Migrate financial assumptions and operating plan. | L1 | W1 | waits for W0 | not-started |
| [TASK-CABP-003](work-pack/tasks/TASK-CABP-003-BUSINESS-PLAN.md) | Rewrite canonical business plan. | L2 | W2 | waits for W1 | not-started |
| [TASK-CABP-004](work-pack/tasks/TASK-CABP-004-CLAIM-AUDIT.md) | Create provisional cross-artifact claim audit. | L2 | W3 | waits for W2 | not-started |
| [TASK-CABP-005](work-pack/tasks/TASK-CABP-005-INVESTOR-HTML.md) | Rewrite shareable HTML from audited BP. | L3 | W4 | waits for W3 | not-started |
| [TASK-CABP-VERIFY](work-pack/tasks/TASK-CABP-VERIFY-FINAL.md) | Run final claim, browser, and comprehension validation. | L3 | W5 | waits for W4 | not-started |

## SWU Manifest

| SWU | Parent | Dependencies | Write Scope | Done Evidence | Validation | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SWU-CABP-001` | [TASK-CABP-001](work-pack/tasks/TASK-CABP-001-EVIDENCE-CONTROLS.md) | none | `diligence-evidence-registry.md` | New findings, statuses, money tags, and missing witnesses govern registry. | Task review checks. | task-session/local-fallback | selected |
| `SWU-CABP-002` | [TASK-CABP-001](work-pack/tasks/TASK-CABP-001-EVIDENCE-CONTROLS.md) | 001 | `source-trace.md` | Outward claims map to source, status, and demotion. | Link/status consistency review. | task-session/local-fallback | blocked-by-dependency |
| `SWU-CABP-003` | [TASK-CABP-002](work-pack/tasks/TASK-CABP-002-ECONOMICS-OPERATIONS.md) | 002 | `financial-assumptions.md` | Monetary taxonomy and founder gaps are explicit. | Numeric/status review. | task-session/local-fallback | blocked-by-dependency |
| `SWU-CABP-004` | [TASK-CABP-002](work-pack/tasks/TASK-CABP-002-ECONOMICS-OPERATIONS.md) | 003 | `operating-plan.md` | Roles, workflow, burdens, and two gates agree with finance. | Cross-file parity review. | task-session/local-fallback | blocked-by-dependency |
| `SWU-CABP-005` | [TASK-CABP-003](work-pack/tasks/TASK-CABP-003-BUSINESS-PLAN.md) | 001-004 | `business-plan.md` | Complete new narrative with visible evidence boundaries. | Structure, terminology, and claim review. | task-session + whisper/local-fallback | blocked-by-dependency |
| `SWU-CABP-006` | [TASK-CABP-004](work-pack/tasks/TASK-CABP-004-CLAIM-AUDIT.md) | 005 | `claim-audit.md` | All Markdown claims classified and HTML contract frozen. | Claim matrix completeness review. | task-session/local-fallback | blocked-by-dependency |
| `SWU-CABP-007` | [TASK-CABP-005](work-pack/tasks/TASK-CABP-005-INVESTOR-HTML.md) | 006 | `investor-brief.html` | HTML mirrors audited BP and preserves professional rendering. | Parse, text parity, local browser checks. | task-session + whisper/local-fallback | blocked-by-dependency |
| `SWU-CABP-008` | [TASK-CABP-VERIFY](work-pack/tasks/TASK-CABP-VERIFY-FINAL.md) | 007 | `claim-audit.md` | Final claim/browser/comprehension verdict and repair routing recorded. | Full validation suite. | task-session/local-fallback | blocked-by-dependency |

Each SWU belongs to exactly one task. Sequential reuse of `claim-audit.md` by
006 and 008 is intentional and ordered; no parallel write overlap exists.

## Validation Strategy

| Surface | Check |
| --- | --- |
| Markdown integrity | `git diff --check`; heading/link review. |
| Language parity | Search retired external terms and inspect allowed diligence-only occurrences. |
| Claim discipline | Claim matrix contains source, status, scope, and demotion/next-proof route. |
| Monetary discipline | Every amount or financial outcome uses one approved monetary tag in supporting controls. |
| Cross-file consistency | Offer, buyer hypothesis, scenario status, gates, and financing status agree. |
| HTML structure | Parse with Python `html.parser`; no malformed document or missing required section anchors. |
| Browser behavior | Serve locally; inspect desktop and mobile screenshots, console, links, overflow, and overlap. |
| Comprehension | First-screen reviewer can answer buyer, trigger, deliverable, value metric, validation status, and financing status. |
| Private boundary | No writes to `arcanum/`; no private mechanism copied into public artifacts. |

## Blockers And Gaps

No blocker prevents honest mutation. The founder, buyer, payment, improvement,
repurchase, event-frequency, access, and financing gaps block only claims or
investor-ready promotion. See [cross-task gaps](work-pack/shared/cross-task-gaps.md).

## Gate Checks

1. Execute one selected SWU only.
2. Context Builder creates execution context at Task Session runtime.
3. Failed SWU validation blocks the next dependency.
4. HTML waits for provisional claim-audit pass.
5. Investor circulation waits for `SWU-CABP-008`.
6. Public promotion remains blocked.

## Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2026-07-10 | Initial BP build plan. | Codex |
| 2026-07-12 | Replaced stale build plan with complete language/value migration package. | Codex |
