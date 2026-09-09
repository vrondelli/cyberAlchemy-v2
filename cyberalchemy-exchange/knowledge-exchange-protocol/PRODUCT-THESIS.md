# CyberAlchemy Knowledge Exchange Protocol Product Thesis

Status: candidate
Canonical kind: product-thesis
Thesis ID: CA2-PRODUCT-THESIS-KNOWLEDGE-EXCHANGE-PROTOCOL
Canonical definition: CAV2-D63
Commitment state: draft
Visibility: private
Meaning owner: CyberAlchemy v2 Knowledge Exchange Protocol product owner
Authority effect: none

## Product Identity

The **CyberAlchemy Knowledge Exchange Protocol**
(`CA2-PRODUCT-KNOWLEDGE-EXCHANGE-PROTOCOL`) is a CyberAlchemy subproduct for
sharing governed knowledge artifacts between stable identities. Its first
realization target is Solana, but the product meaning is not owned by Solana or
by one implementation.

## Thesis

People should be able to expand the recognized co-ownership of an exact
knowledge-artifact version and deliver decryptable access to another identity
without publishing the knowledge, surrendering the originator's membership, or
confusing a chain record with possession of plaintext.

The smallest useful proof is not a marketplace. It is an evidence-bound
transition from owner set `{A}` to `{A, B}`, accompanied by an encrypted
artifact reference, a recipient-specific key envelope, and B's signed
acknowledgement for the exact artifact version.

## Problem

Knowledge can be copied cheaply, while provenance, permission, originator
continuity, delivery evidence, and economic rules are difficult to preserve.
Putting plaintext or a content key on a public chain destroys confidentiality;
recording ownership alone does not prove that the recipient obtained usable
knowledge; and changing an encryption key must not silently change ownership.

## Participants

- **Knowledge Originator** creates or first registers the governed artifact.
- **Knowledge Recipient** is invited to become an additional co-owner.
- **CyberAlchemy Identity** is the stable protocol identity that signs actions
  and binds replaceable signing and encryption keys.
- **Authorized Co-owner** may perform only the propagation or reissue actions
  allowed by the immutable policy of the artifact version.

## Value Mechanism

```text
exact artifact version and policy
  -> external content-addressed ciphertext
  -> stable identities with separate signing and encryption keys
  -> signed co-ownership grant
  -> recipient-specific key envelope
  -> recipient decryption acknowledgement
  -> durable evidence for later paid and licensed sharing
```

## First-Order Principles

1. **Co-ownership expands** — adding B does not remove A.
2. **Versioned policy** — each artifact version binds one immutable propagation
   policy; new rules require a successor version.
3. **Encrypted delivery** — plaintext and content keys never appear in public
   protocol state.
4. **Identity is not a key** — stable identity, signing authority, and
   encryption keys remain distinct.
5. **External artifact custody** — the protocol records a content-addressed
   ciphertext reference but does not promise blob custody.
6. **Recipient-specific access** — each co-owner receives an independently
   wrapped key envelope.
7. **Reissue preserves ownership** — a key reissue changes access material, not
   owner membership, artifact identity, or economic state.
8. **Compromise creates a new epoch** — a compromised key cannot be repaired by
   merely rewrapping the same content key.
9. **Evidence is bounded** — a valid record is not cryptographic security,
   plaintext possession, legal ownership, licensing, or product value.

## Intended Outcomes

- `CA2-OUT-ENCRYPTED-COOWNERSHIP-RECORDED` — A remains a co-owner while B is
  added for one exact artifact version.
- `CA2-OUT-RECIPIENT-DECRYPTION-ACKNOWLEDGED` — B can acknowledge successful
  decryption without exposing the plaintext or content key.
- `CA2-OUT-KEY-REISSUE-RECOVERABLE` — B can request a replacement key envelope
  through the stable identity without creating a new ownership event.

## Project

`CA2-PROJECT-KNOWLEDGE-EXCHANGE-SOLANA-PROOF` coordinates the model,
DomainSpec v2 source, compiled system ontology, Solana realization, and evidence
needed for one bounded identity-to-identity proof. The Project does not grant
implementation, publication, deployment, or transaction authority.

## Goal

`CA2-GOAL-KNOWLEDGE-EXCHANGE-ENCRYPTED-COOWNERSHIP` seeks a local proof in
which A authorizes B as an additional co-owner of one encrypted artifact
version, B obtains a recipient-specific key envelope, and B produces an
acknowledgement bound to that version. The Goal excludes SOL consideration and
all downstream market mechanisms.

## Boundaries

The first product slice does not:

- transfer A's ownership away;
- store plaintext or a content-encryption key on-chain;
- custody or guarantee availability of the encrypted artifact;
- equate a wallet address with a permanent protocol identity;
- make reissue equivalent to a new grant;
- revoke knowledge that a recipient already decrypted;
- exchange SOL or prove fair secret delivery;
- establish licensing, royalties, legal title, or reputation;
- select a cryptographic suite without security review; or
- authorize publication, release, deployment, or an external transaction.

## Hypotheses And Evidence

The first hypothesis is that a signed owner-set expansion plus recipient-bound
encrypted delivery can create a useful and inspectable knowledge-sharing event.
Evidence requires exact state-transition traces, envelope binding, recipient
acknowledgement, negative authorization tests, lost-key reissue tests, and a
separate compromised-key epoch test. Model validation alone cannot satisfy any
runtime proof.

## Revision Criteria

Revise the model if stable identity cannot safely survive key replacement, if
co-ownership cannot be distinguished from access, if a recipient cannot detect
an invalid envelope before accepting the proof, if external artifact
availability makes the proof unusable, or if a simpler model preserves the same
originator, recipient, confidentiality, and evidence boundaries.

## Claim Ceiling

This candidate selects a private product direction, Project, Goal, and first
Product Capability model. It does not adopt the capability, prove cryptographic
security, create a DomainSpec v2 or system-ontology admission, implement or
deploy a Solana program, transfer SOL, establish legal or economic rights, or
prove product value.
