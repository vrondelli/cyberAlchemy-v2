# Dispatch Spec validation

- Dispatch: `DISPATCH.json`
- Validator:
  `arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py`
- Initial result: block on two unsupported boundary-kind values, four
  unsupported receipt-field values, and an unbound recomposition technique.
- Repair: map boundaries to live schema kinds, use the accepted receipt-field
  vocabulary, and bind recomposition to the Task Session step.
- Final result: `VALIDATION=pass`
- Flags: none
- Blocks: none

This validates route shape only. It does not authorize SWU execution.

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
