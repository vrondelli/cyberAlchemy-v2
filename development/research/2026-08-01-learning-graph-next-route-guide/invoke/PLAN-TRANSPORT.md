# Plan Transport

## Authored Outputs

- [WORK-PACK.md](WORK-PACK.md)
- [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md)
- [EXECUTION-PACK.md](EXECUTION-PACK.md)
- [SWU manifest](work-pack/SWU-MANIFEST.json)
- task, wave, shared context, validation, closeout, Dispatch, and Distill
  contracts

## Current State

- Design evidence: `design-validator-pass`
- Planning gate: pass
- Plan implementation evidence: `plan-evidence-pending`
- Work-pack structural gate: pass
- Mutation admission: block
- Learner-view mutation admission: absent
- Owner-resolved semantic-admission evidence: absent
- Destination-owner identity/admission: absent
- Selected SWU: `none`
- Implementation: not started

## Required Next Decision

The learner-view/navigation owner must first issue mutation admission for the exact candidate
extension, write scope, evidence ceiling, and validation/supersession policy.
Only then may the user select `SWU-LGP-001` for Task Session. No route or
successor is auto-selected. That mutation receipt cannot close the semantic
evidence gap or admit the displayed candidate destination.
