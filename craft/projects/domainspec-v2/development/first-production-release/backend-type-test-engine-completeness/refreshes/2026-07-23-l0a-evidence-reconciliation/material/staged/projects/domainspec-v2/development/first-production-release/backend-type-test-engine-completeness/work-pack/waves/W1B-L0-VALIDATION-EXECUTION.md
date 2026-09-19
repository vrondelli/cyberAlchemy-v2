# W1B — L0B Validation Execution

## Question

Do the unchanged L0A contracts and semantic validators reject every
independently frozen red case and emit recomputable, non-admitting evidence?

## Entry, Work, Exit

Entry requires current passing L0A publication verification, the exact immutable
L0A publication receipt, and a validation-owner red manifest and freeze receipt
whose governing contract digests match that publication. Execute only
`SWU-BTE-L0B-001`; published L0A bytes and `validation-inputs/l0/` are read-only.

Exit is a non-admitting `ValidationReceipt` whose raw case set exactly equals
the frozen manifest and whose write manifest proves containment. Failure routes
to L0B repair or the validation owner. Only a passing L0B receipt opens W2.
