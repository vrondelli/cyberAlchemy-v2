---
artifact_id: ux-rule-remove-item-research
canonical_kind: research
authority_kind: Evidence
process_origin: example-ux-evidence-research
durability: ephemeral
authority_state: none
example_status: illustrative
---

# Research: Accessible-Name Evidence Plan

## Candidate Claim

A browser can deterministically report whether the scoped remove-item button
exposes a non-empty accessible name.

## Claim Classification

| Claim | Class | Evidence needed | Boundary |
| --- | --- | --- | --- |
| The scoped button has a non-empty accessible name. | hard gate candidate | browser accessibility tree or role/name query plus calibrated fixtures | Does not prove the name is understood or preferred. |
| The wording is clear to users. | human study | user-task evidence | Browser evidence cannot settle this claim. |
| The interface is fully accessible. | not automatable | broader accessibility and human evidence | This one check cannot support the claim. |

## Required Evidence Before Promotion

- known-good, known-bad, and false-positive fixtures;
- actual browser role/name observations;
- a calibration report;
- challenge review;
- explicit owner decision.

No external standard or research source is asserted by this synthetic example.
A real run must add source cards before strengthening the claim.

