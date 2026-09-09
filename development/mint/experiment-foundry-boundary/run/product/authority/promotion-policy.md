<!--
  RUN OUTPUT — promotion-policy for the API-contract governance domain. Every gate resolves to
  this repo's own authority/. At least one gate is domain-originated (Obs-A rule-level).
-->

# Promotion Policy

Status: active local policy
Owner: API-contract governance owner

API-contract governance promotes by evidence and owner route, not by release pressure.

## Promotion Ladder

| State | Meaning | May promote to |
| --- | --- | --- |
| Published contract | The current contract surface in its own context. | Source record. |
| Source record | Path, date, source kind, and boundary captured. | Contract diff. |
| Contract diff | A proposed change vs the current surface. | Compatibility ruling. |
| Compatibility ruling | An owner-ratified breaking/non-breaking verdict. | [if breaking] Deprecation schedule binding; else gate evaluation. |
| Deprecation schedule | A bound T0/T1/T2 sunset commitment for a removed element. | Gate evaluation. |
| Candidate compat rule | A proposed compatibility condition for a contract class. | Validation request after collapse test and a workflow witness. |
| Workflow witness | A concrete past contract change for testing a compat rule. | Evidence harness or external review. |
| Ship recommendation | A source-backed "compatible (or scheduled), recommend ship" with residual risk. | External owner decision (ship / hold). |

## Required Gates

| Gate | Required when | Standard |
| --- | --- | --- |
| Source-kind gate | A new source is added or cited. | Primary, supporting, related, analogy, inference, or residue is explicit. |
| Authority gate | A claim could affect a ship/compatibility decision. | Route to **this repo's `authority/`** and mark non-policy until external owner review. *(Resolves locally — never to a framework.)* |
| **Compatibility-ruling gate** ⟵ *domain-originated* | A contract diff enters review. | The breaking/non-breaking verdict is **ruled by `compatibility-governance` over the diff, not accepted from the author's version label**; a mislabeled breaking change is re-ruled before it may proceed. |
| **Deprecation-schedule gate** ⟵ *domain-originated (the temporal-commitment gate — cav2 has NO analog)* | A compatibility ruling is `breaking` for an element consumers rely on. | A **binding T0/T1/T2 sunset schedule** must be authored by `lifecycle-scheduling` BEFORE the change may proceed; **block if removal is scheduled before T2, or if a warn window is shortened mid-flight.** *(This gate enforces a future-dated obligation over time — the genuinely domain-originated rule-level support for Obs-A.)* |
| Surface-boundary gate | A change adds/removes a type/endpoint/field. | The change is checked against the **contract surface** (in/out of public promise); removing an unpromised internal element is non-breaking, removing a promised one requires a deprecation schedule. |

## Promotion Blocks

Block promotion when:

- the compatibility verdict is taken from the author's semver label rather than ruled by
  `compatibility-governance`;
- a breaking removal has no bound deprecation schedule, or a schedule's T2 is moved earlier for
  an element already in its warn window;
- the claim depends on an analogy (an external standard) without a bridge decision;
- the proposal skips its required compatibility ruling or deprecation schedule;
- the recommendation has no witness, falsifier, or audit route;
- **the promotion would resolve by traversing into a framework attachment** (no framework edge
  is a promotion path — Obs-B at the promotion level).
