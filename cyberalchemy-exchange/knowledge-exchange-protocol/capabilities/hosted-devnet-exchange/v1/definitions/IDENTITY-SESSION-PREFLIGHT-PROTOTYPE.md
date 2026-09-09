# Identity, Session, And Preflight Prototype

Status: non-authoritative construction prototype
Prototype: `KEP-HOST-IDENTITY-SESSION-PREFLIGHT-001`

This additive prototype defines the client substrate required by the complete
hosted KEP journey. It does not change accepted definition bytes or authorize
deployment.

## KEP-HOST-PD19: Human Operator

A Human Operator is a person controlling one or more protocol roles during a
test or exchange. Human identity is outside the protocol record. One Human
Operator may operate both A and B without collapsing their distinct Knowledge
Identities.

## KEP-HOST-PD20: Protocol Role

A Protocol Role is the bounded acting position `originator` or `recipient` in
one Client Session. It is not a person, wallet, or durable Knowledge Identity.

## KEP-HOST-PD21: Wallet Authority Binding

A Wallet Authority Binding connects a Knowledge Identity to the public Solana
key that authorizes its purpose-specific messages and transactions. Multiple
Knowledge Identities may bind the same wallet. Such a configuration proves
distinct protocol identities, but not independent wallet custody.

## KEP-HOST-PD22: Encryption Key Binding

An Encryption Key Binding connects one Knowledge Identity to one public
encryption key and positive key version. Its private half remains client-held.
Changing the binding requires the governed reissue transition.

## KEP-HOST-PD23: Client Session

A Client Session is isolated browser state bound to one session identifier,
task, Protocol Role, network, wallet, Knowledge Identity, and exact pending
operations. Starting fresh cannot silently inherit identity or effect state
from another Client Session. Resuming requires the exact saved session.

## KEP-HOST-PD24: Frozen Operation

A Frozen Operation is an immutable pre-effect record containing the semantic
operation kind, stable operation identifier, network, acting identity, and
exact public inputs. Its state advances only through:

`draft -> frozen -> signed -> prepared -> submitted -> finalized -> reconciled`

An uncertain effect resumes the same Frozen Operation. It never creates a
successor automatically.

## KEP-HOST-PD25: Public Preflight Card

A Public Preflight Card is a canonical public-only export created before the
first signature. It identifies the Client Session, Protocol Role, Knowledge
Identity, wallet, encryption public key and version, network, program, and—when
the share task is selected—artifact, policy, epoch, and consideration.

It excludes plaintext, wallet secrets, encryption private keys, content keys,
and sealed private session material.

## KEP-HOST-PD26: Exact Identity Resume

An Exact Identity Resume occurs when a signed registration request names an
already registered Knowledge Identity and its wallet, encryption public key,
and key version exactly equal the stored binding. It returns the registered
result without replacing the binding. A reused operation identifier or any
binding mismatch remains a typed conflict.

## KEP-HOST-PD27: Safe Attempt Projection

A Safe Attempt Projection is a read-only view addressed by a high-entropy
attempt identifier. It exposes only operation kind, stage, canonical error,
effect status, retry disposition, safe message, known public transaction
signature, and evidence status. It excludes diagnostic detail and secrets.

## Prototype Invariants

1. Distinct Knowledge Identities remain distinct even when controlled by one
   human or wallet.
2. Shared wallet authority is disclosed as non-independent custody.
3. A fresh Client Session inherits no prior role, identity, key, or operation.
4. Every effectful action uses a visible Frozen Operation created before
   signing.
5. Public Preflight Card bytes contain no secret material.
6. Exact Identity Resume changes no stored identity binding.
7. Safe Attempt Projection grants no retry or effect authority.

## Prototype Claim Ceiling

These definitions guide a new testable product candidate. They do not prove
independent custody, durable secret recovery, accessibility conformance,
product approval, or authority for deployment, publication, release, hosted
writes, credentials, or Solana transactions.
