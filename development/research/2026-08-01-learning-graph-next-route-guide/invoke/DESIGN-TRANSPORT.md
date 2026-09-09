# Design Transport

## Inputs

- approved Define artifacts
- closed `DESIGN-SCOPE-MANIFEST.json`
- `DESIGN-DENOMINATOR-RECEIPT.json`
- `DESIGN-SELECTION-RESULT.json`

## Outputs

- [ARCHITECTURE.md](ARCHITECTURE.md): six views and selected extensions
- [UX-PLAN.md](UX-PLAN.md): natural-person semantic-surface companion
- [WITNESS-CONTRACTS.md](WITNESS-CONTRACTS.md): planned fixtures/validators
- [GLOSSARY-CONSISTENCY.md](GLOSSARY-CONSISTENCY.md)
- [DESIGN-RISKS-AND-GAPS.md](DESIGN-RISKS-AND-GAPS.md)

## Evidence State

The deterministic selection receipt controls whether the state is
`design-validator-pass`. Planned witnesses remain `plan-evidence-pending`; no
implementation or browser evidence is represented here.

## Next Route

Normal Invoke Plan only if the selection receipt passes. Host mutation remains
blocked by DG-001 even if Plan authoring completes.
