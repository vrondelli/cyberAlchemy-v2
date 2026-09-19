# Handoff ordering rework

The first handoff invocation rejected `activationSource: goal-batch` because the
Invoke handoff contract accepts only `direct-user`, `delegated`, or
`continuation`. The shell sequence did not use fail-fast behavior, so the two
already validated staged postimages were copied to their exact live targets
after that rejection.

The approved scope and target bytes did not change. Closeout requires the
corrected direct-user handoff to pass, exact staged/live comparison, and a
passing post-apply material validation. Future multi-command mutation sequences
in this goal run use fail-fast behavior.
