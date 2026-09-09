---
title: Governance Fitness planned validation contracts
status: planned-witnesses
authority_effect: none
enforcement_effect: none
---

# Validation Contracts

These are planned witnesses, not active governance gates and not executed Plan
evidence.

## Observe-only substrate

| ID | Planned witness | Expected result |
| --- | --- | --- |
| GF-W01 | Native governance detector exits `1`; observe-only adapter receives it. | Native verdict is preserved as evidence; work-facing exit remains `0`. |
| GF-W02 | Native governance detector exits `2`. | Infrastructure diagnostic is recorded; no lifecycle, owner request, or source mutation occurs. |
| GF-W03 | Missing or malformed posture. | Surface remains `unconfigured`; no blocking edge is attached. |
| GF-W04 | Ambient hook receives matching files. | Git working tree and index remain byte-identical. |
| GF-W05 | CI governance job finds violations. | Job publishes diagnostics without controlling merge; external required-check configuration is separately inspected. |
| GF-W06 | Effectful tuning path would open an issue, start an agent, create a branch, commit, push, or open a PR. | Every external or mutation path is suppressed. |
| GF-W07 | Two identical posture-resolution inputs. | Result bodies are byte-identical without hashing the repository. |
| GF-W08 | Product test fails while governance is observe-only. | Product test failure retains its original effect; posture does not hide non-governance failures. |

## First Governance Fitness vertical

| ID | Planned witness | Expected result |
| --- | --- | --- |
| GF-W09 | Rule projection has no axiom/harm or catastrophic-risk justification. | Assessment is `not_evaluable`. |
| GF-W10 | Rule has an inherited A6 basis but no unique incident. | Justification is representable without inventing rule-local harm. |
| GF-W11 | Metric lacks population, window, privacy boundary, missing-data behavior, or claim ceiling. | Metric remains incomplete and cannot support an assessment. |
| GF-W12 | Assessment recommends `prune` with no owner decision. | Rule and lifecycle remain unchanged. |
| GF-W13 | Unrelated product node changes. | Product binding remains current; no rule refresh. |
| GF-W14 | Referenced product node changes. | Only the binding becomes `non_current`; semantic and lifecycle identity stay unchanged. |
| GF-W15 | New observation is appended. | New assessment evidence; no new rule epoch. |
| GF-W16 | Semantic rule statement or applicability changes. | New semantic rule version is required; prior evidence remains historical. |
| GF-W17 | Whole-package validation digest changes because README changes. | No semantic, currentness, authority, or lifecycle change. |

## Definition and ontology identity

| ID | Planned witness | Expected result |
| --- | --- | --- |
| GF-W18 | Resolve `CAV2-D34`. | It resolves only to Authority. |
| GF-W19 | Resolve `CAV2-D58` and all Constitution aliases. | They resolve only to Constitution. |
| GF-W20 | Inspect the Stable Repository Constitution after D58 promotion. | Its status remains `candidate`; no validation mode or selector is activated. |
| GF-W21 | Validate ontology relation endpoints and forbidden relations. | Every declared endpoint exists and no `GovernanceRule -> enforces -> work operation` edge exists. |

## Seven-refresh replay

The future pilot should materialize the reported sequence as typed events and
classify every refresh cause. Acceptance for the observe-only pilot is:

- zero task blocks caused by governance findings;
- zero owner requests;
- zero lifecycle transitions;
- zero source or Git-index mutations by observers;
- unrelated changes cause zero currentness updates;
- referenced changes cause targeted currentness only;
- the stable rule identity accumulates observations rather than seven refresh
  epochs.

No numeric target is adopted until the event population and baseline exist.

## Current Design checks

This bundle may be checked for JSON parsing, internal path existence, six-view
coverage, bundle `authority_effect: none`, D34/D58 identity separation, and the
exact companion Definition repair inventory. Those checks validate the Design's
structure and canonical vocabulary only; they do not apply the modeled
governance rule.

## Open questions

See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
