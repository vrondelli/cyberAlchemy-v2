# Knowledge Exchange Protocol Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `d29479182cbbd8a20dd9c8a87e24713ba3e9c66d9036ba0480c62c2829c4ae4c`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `encrypted-knowledge-coownership.ArtifactVersion` | Entity | Represent one immutable knowledge-artifact content identity and propagation-policy identity independently from ciphertext rotation. |
| `encrypted-knowledge-coownership.CoownershipGrant` | Entity | Represent one authenticated command that adds a recipient to an existing owner set without removing prior owners and binds the recipient envelope metadata. |
| `encrypted-knowledge-coownership.DecryptionAcknowledgement` | Entity | Represent a recipient-authenticated acknowledgement bound to the exact artifact version, encryption epoch, envelope, and delivery challenge without claiming plaintext secrecy. |
| `encrypted-knowledge-coownership.EncryptedCoownershipInvariant` | Rule | Return true only when authorization is exact, the artifact version and policy match, existing owners are preserved, B receives an epoch-current key envelope, acknowledgements are recipient-bound, lost-key reissue preserves protected state, and compromise creates a new fully covered encryption epoch. |
| `encrypted-knowledge-coownership.EncryptedCoownershipState` | Entity | Represent the current owner set, encryption epoch, content-addressed external ciphertext reference, issued recipient envelopes, and bounded acknowledgements for one artifact version. |
| `encrypted-knowledge-coownership.KeyReissue` | Entity | Represent the evaluated lost-key reissue result separately from its request and prove that only one recipient envelope changes within the same encryption epoch. |
| `encrypted-knowledge-coownership.KeyReissueRequest` | Entity | Represent a recipient-authenticated request to replace access material while distinguishing lost-key rewrap from compromised-key epoch rotation. |
| `encrypted-knowledge-coownership.KnowledgeIdentity` | Entity | Represent one stable protocol identity with distinct replaceable authorization and encryption-key bindings. |
| `encrypted-knowledge-coownership.PropagationPolicy` | Entity | Represent the immutable per-artifact-version rule selecting whether only the originator or any current co-owner may grant or reissue access. |
| `encrypted-knowledge-coownership.RecipientKeyEnvelope` | Entity | Represent opaque client-produced key-envelope bytes through their digest and exact recipient, key, version, and epoch bindings without exposing a content key. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |

This file is generated; edit machine sources and rebuild.
