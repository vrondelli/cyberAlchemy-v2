# W1B — L0B Validation Execution

## Question

Do the unchanged L0A contracts and semantic validators reject every
independently frozen red case and emit recomputable, non-admitting evidence?

## Entry, Work, Exit

Current L0A publication verification passes and the exact immutable L0A
publication receipt is preserved. Entry remains blocked until validation-owner
fixture payloads and no-follow topology inputs exist and a red manifest and
freeze receipt truthfully bind them to the governing publication digests. Once
selected, execute only
`SWU-BTE-L0B-001`; published L0A bytes and `validation-inputs/l0/` are read-only.

Exit is a non-admitting `ValidationReceipt` whose raw case set exactly equals
the frozen manifest and whose write manifest proves containment. Failure routes
to L0B repair or the validation owner. Only a passing L0B receipt opens W2.
