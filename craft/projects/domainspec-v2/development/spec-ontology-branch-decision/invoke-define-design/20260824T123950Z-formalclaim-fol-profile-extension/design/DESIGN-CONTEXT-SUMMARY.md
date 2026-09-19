# Design Context Summary

Design starts from the stable-for-this-request Define outputs. The target is not
a new ontology branch. It is a successor contract addition inside the existing
`formal-claims-specification` branch, paired with a separately owned validation
assessment that connects the claim to TDE, EVF, SMT-provider, and proof routes.

The current executable evidence is narrower than the new source language:
DS-SFOL is bounded and finite, and EVF's admitted solver profile is QF_LIA.
Therefore source expressiveness and tool capability must be independently
versioned and digest-bound.

Frozen @4 remains unchanged and verification-pending. This Design can prove
only its own closed selection contract; it cannot admit owners, implement
interfaces, execute planned witnesses, or create Plan evidence.
