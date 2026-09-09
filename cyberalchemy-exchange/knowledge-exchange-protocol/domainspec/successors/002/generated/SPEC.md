# Knowledge Exchange Protocol Successor Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `c31c5a788973d039e2c823ccbf619aaffe097835c9bfedc5efd0ed62614d56bf`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `encrypted-knowledge-coownership.ArtifactVersion` | Entity | Represent one immutable knowledge-artifact content identity and propagation-policy identity independently from ciphertext rotation. |
| `encrypted-knowledge-coownership.CoownershipGrant` | Entity | Represent one replay-safe authenticated command bound to an exact prior state revision and a current recipient encryption-key binding. |
| `encrypted-knowledge-coownership.DecryptionAcknowledgement` | Entity | Represent replay-safe recipient-authorized evidence bound to the exact state, artifact version, epoch, envelope, ciphertext commitment, and fresh delivery challenge. |
| `encrypted-knowledge-coownership.EncryptedCoownershipInvariant` | Rule | Return true only when exact state and policy bindings, replay protection, current key bindings, owner preservation, bounded acknowledgements, same-epoch lost-key reissue, and complete compromise rotation all hold. |
| `encrypted-knowledge-coownership.EncryptedCoownershipState` | Entity | Represent the exact revision, owner set, epoch, ciphertext reference, recipient envelopes, acknowledgements, and replay-protection sets for one artifact version. |
| `encrypted-knowledge-coownership.KeyReissue` | Entity | Represent an authorized same-epoch replacement of one recipient envelope while proving protected state and every other recipient envelope remain unchanged. |
| `encrypted-knowledge-coownership.KeyReissueRequest` | Entity | Represent a replay-safe recipient-authenticated request bound to the exact prior state and both the previous and current replacement key bindings. |
| `encrypted-knowledge-coownership.KnowledgeIdentity` | Entity | Represent one stable protocol identity with independently versioned authorization and time-bounded, challengeable encryption-key bindings. |
| `encrypted-knowledge-coownership.PropagationPolicy` | Entity | Represent the immutable per-artifact-version rules selecting who may grant co-ownership and issue replacement access material. |
| `encrypted-knowledge-coownership.RecipientKeyEnvelope` | Entity | Represent opaque key-envelope bytes bound to one identity, exact current key binding, artifact version, and encryption epoch. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |

This file is generated; edit machine sources and rebuild.
