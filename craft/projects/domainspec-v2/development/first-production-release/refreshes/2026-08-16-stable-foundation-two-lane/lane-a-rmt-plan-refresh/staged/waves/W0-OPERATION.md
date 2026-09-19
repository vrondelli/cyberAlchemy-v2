# W0 — Operation

After the historical ontology-v2 prerequisite remains satisfied and the exact
S1 plan bytes are live, independently reviewed, owner-accepted, and
revalidated, `RMT-OP-001..010` run serially. `RMT-OP-001` is the
trust-building admission slice and the sole frontier; staging selects nothing.

W0 closes the versioned transaction/effect-group observation, atomic
state-plus-durable-outbox commit, stable occurrence identity, commit outcome,
provider-proof separation, and failures before state write and between state
and outbox. A committed fact cannot be rolled back; later failure routes
forward.
