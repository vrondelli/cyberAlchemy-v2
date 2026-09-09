# CyberAlchemy Exchange

## Knowledge Expansion Protocol (KEP)

Encrypted co-ownership, durable delivery, and evidence-bound state on Solana

Working white paper · Draft 0.3 · 6 September 2026

Status: research candidate; not approved for publication

## Abstract

CyberAlchemy Exchange is the participant-facing product built around the
Knowledge Expansion Protocol (KEP). Digital knowledge can be copied without
being surrendered. That simple fact makes ordinary transfer metaphors
unreliable: after an originator gives a recipient usable knowledge, the
originator normally still knows it. KEP therefore begins with a smaller and
more honest primitive than a sale or exclusive transfer. For one immutable
Knowledge Artifact Version, an authorized originator A adds an independently
controlled recipient B to the recognized owner set, changing `{A}` to `{A,B}`
while preserving A.

The knowledge itself is encrypted off-chain. A participant client encrypts and
decrypts locally; the hosted storage layer retains ciphertext and sealed
recipient envelopes; Solana records protocol membership, commitments,
revisions, and replay protection. Solana never sees plaintext, content keys,
recipient private keys, ciphertext bytes, or envelope bytes. If the recipient
loses a non-compromised key, a governed reissue replaces only that recipient's
envelope and key binding; it does not repeat the grant or change membership.

This paper describes the product model, layered architecture, Solana state
transition, durable-storage boundary, hosted Rust application, and the
CyberAlchemy-v2 D65 construction method. It also reports the present evidence:
a bounded Lean theorem check, local two-identity Rust and browser tests, a
disposable PostgreSQL persistence/recovery test, an HTTP smoke test, and a
read-only observation of a prior finalized Solana Devnet transaction. These
results establish selected model and implementation observations. A later
bounded candidate-013 analysis also separates ten reachable safety paths from
formal obligations and external-network evidence. These results do not
establish production security, legal ownership, independent backup topology,
market demand, Mainnet readiness, or full D65 conformance.

## Correctness evidence at a glance

Correctness is supported property by property. Formal-model checks, implementation
observations, and independent review are complementary; their totals do not prove
that the complete current system is correct. The following are recorded results,
not experiments rerun by this documentation update.

| Property | Evidence we have | What it supports | Boundary and receipt |
| --- | --- | --- | --- |
| Protocol model | Lean theorem checked twice | The modeled grant preserves A, adds B, binds the envelope commitment, advances revision, consumes replay identity, and keeps consideration zero. | Historical formal-model receipt. No proof that Rust or Solana faithfully implements the model. [LOCAL-LEAN-EVIDENCE](../../capabilities/solana-coownership/formalization/claims/CA2-FC-KEP-SOLANA-CORE-GRANT-001/THEOREM-OBLIGATION-RECEIPT.json) |
| Broader formal checks | 7 claims · 15 deterministic projections | Recorded bounded checks across Lean, TLC, and Alloy cover encoding, storage gating, grant, activation, reissue, cost separation, and secret placement. | Historical EVF PASS_BOUNDED. Model assumptions and finite bounds apply; no end-to-end implementation refinement. [LOCAL-EVF-FORMAL-RECEIPT-V2](../../capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/formal-evidence/conformance-v2/generated/provider-receipt.json) |
| Checkpoint recovery | 34 JavaScript tests passed | Six added regressions exercise checkpoint failure and submission ambiguity. Known pre-submission failures can retry; restored uncertain submissions stay blocked. | September 6 local test run. No live-chain submission or arbitrary crash-recovery proof. [LOCAL-SEP6-CHECKPOINT](evidence/20260906/checkpoint.json) |
| Original-file recovery | Identical original recovered | An isolated browser restored identity and a 10,246-byte original with the same SHA-256 digest, and retried interrupted saves and download acknowledgements. | September 6 browser run before the writer repair. Test signer only; no wallet-extension or memory-zeroization proof. [LOCAL-SEP6-BROWSER-RECOVERY](evidence/20260906/browser-recovery.json) |
| Lost responses and stale tabs | Retry preserved revision · stale save rejected | After a committed response was dropped, retry used the same ciphertext and revision. A competing stale tab received HTTP 409; explicit discard and recovery succeeded. | One backend process, before the writer repair. Divergent-edit merging and backend crashes were not tested. [LOCAL-SEP6-COMMIT-TABS](evidence/20260906/commit-tabs.json) |
| Database writer exclusion | 9 Rust + 4 PostgreSQL tests passed | The repair checks second-writer rejection, takeover after shutdown, and failure of stale writes after connection loss. A separate process test confirmed startup exclusion and takeover. | September 6 repair run. Participating upgraded writers only; disconnected reads can remain stale. [LOCAL-SEP6-SINGLE-WRITER](evidence/20260906/single-writer.json) |
| Independent review | Candidate 011 · bounded pass | Review 009 recorded zero unresolved high or critical findings and ten carried medium residues for its exact frozen candidate. | Historical candidate review, not a review of the current hosted console or a production security clearance. [LOCAL-EVF-INDEPENDENT-REVIEW-009](../../capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/evidence/independent-review/009/review.json) |

The source register binds each receipt by SHA-256. Rechecking that digest verifies
receipt identity, not the experiment itself. The combined repaired console still
needs a browser run against one frozen source set. Rust-to-model refinement,
real wallet compatibility, independent backup recovery, and production security
remain open. Historical approvals and reviews apply only to their original bytes.

## September 6 development evidence epoch

This section describes the hosted development console. Older counts and decisions
below remain evidence for their named snapshots, not approval of these source
changes. The new local source entries and copied receipts are in `SOURCES.json`
and `evidence/20260906/`. Documentation validation rechecks their bytes; it does
not rerun the experiments.

### Account and recovery

A wallet signs account requests; a separate encryption identity controls sealed
knowledge. The browser encrypts its account snapshot with a random recovery key
and stores only ciphertext on the service. The downloaded recovery file contains
a secret: it must be retained privately. It restores encryption identity and
exchange context, including prepared content keys, but is not a backup of original
file payloads. Wallet access alone cannot decrypt that account backup. Recovery
file loss, compromise rotation, and an account reset flow remain unresolved.

Revision checks reject stale account saves. Retrying the same committed encrypted
snapshot is idempotent. A known checkpoint failure before wallet submission can be
retried; a restored uncertain submission marker remains blocked pending
reconciliation. This does not prove arbitrary transaction-crash recovery.

### Original files and usage-based expiry

The development upload limit is 10,000,000 original bytes. The browser encrypts
the original and its manifest; filename, type, size, and integrity digest belong
to that encrypted manifest. Extraction is a proposed derived provenance record,
not an implemented replacement for the original.

The first signed download acknowledgement starts one calendar year of retention;
a later distinct acknowledged download resets it. Replaying the same attempt
does not extend retention. Before the first acknowledgement there is no expiry
deadline. The client sends the acknowledgement after decryption and integrity
verification. This is not proof that the user saved a file to disk, nor a server
proof of plaintext possession. Expiry removes the new hosted payload while
retaining metadata/provenance. Legacy archives remain preserved; independent
backup deletion and revocation of already downloaded copies are not established.

### Persistence and bounded verification

One participating hosted writer may hold a PostgreSQL database at a time. A
session advisory lock is acquired before loading state; all writes use that same
connection. A second writer is rejected, and connection loss prevents the old
writer from saving stale state after takeover. Direct SQL and older binaries are
outside that exclusion. A disconnected instance can still serve stale in-memory
reads and must be removed from service. This is not active-active replication.

The recorded checkpoint run passed 34 JavaScript tests. An isolated Chromium
journey recovered identity and a 10,246-byte original with an identical digest,
retried interrupted saves and acknowledgements, and showed no overflow at 320px.
A separate browser run recovered after a committed response was lost and rejected
a stale tab with HTTP 409. Explicit discard and reload were tested; divergent-edit
merging was not. These browser runs used a test signer and preceded the writer
repair. The later writer repair passed nine ordinary Rust tests, four PostgreSQL
tests, and process startup rejection/takeover checks. No combined post-repair
browser run, real wallet-extension trial, live-chain transaction, production
backup exercise, or Rust-to-Lean refinement is claimed by these receipts.

Runnable construction work remains: test the complete repaired console against
one frozen source set, address recovery/abuse-policy gaps, and prepare current
product-test evidence. Operational support remains separately owned by the
operator: failed-instance removal, independent backups, and deployment topology.
Older acceptance-bound drift remains historical residue; this paper update does
not refresh approval digests or grant publication or deployment authority.

## 1. Who encrypts, what is stored, and what Solana proves

KEP separates cryptographic ability from protocol authorization. Participants
hold the secrets and perform encryption. Durable Storage retains sealed bytes.
Solana records the public transition that the protocol recognizes.

```text
A client
  plaintext V + random 32-byte content key K
       |                         |
       | XChaCha20-Poly1305      | RFC 9180 HPKE to B's X25519 public key
       v                         v
  ciphertext C             recipient envelope E_B
       |                         |
       +-----------+-------------+
                   v
        Durable Storage, off-chain
           stores C and E_B

  hash(C) + hash(E_B) + A/B membership + revision + replay identity
                   |
                   v
              Solana state

B client retrieves C and E_B
  B's private encryption key opens E_B -> K
  K decrypts C locally -> plaintext V
```

Solana recognizes which recipient and envelope commitment belong to the
finalized protocol state. It does not control the private key and cannot perform
decryption or re-encryption. Finality authorizes the hosted service to release
B's prepared envelope; successful local decryption establishes usable access.

### 1.1 Data placement and custody

| Component | Can see | Performs | Never receives |
| --- | --- | --- | --- |
| A's client | plaintext, content key, B's public key | encrypts V and creates B's envelope | B's private key |
| hosted Durable Storage | ciphertext, sealed envelopes, public metadata | persists and verifies sealed material | plaintext, content key, private keys |
| Solana | membership, commitments, revision, replay identity | validates and records the public transition | ciphertext, envelope bytes, content key, plaintext |
| B's client | ciphertext, B's envelope, B's private key | opens the envelope and decrypts locally | A's private material |

The public chain stores commitments to encrypted material, not the encrypted
knowledge itself. The current hosted design stores ciphertext and recipient
envelopes in an SQL-portable durable record layer and binds those bytes to the
on-chain commitments.

### 1.2 The envelope is an encrypted content key

The current test profile uses two distinct cryptographic layers:

```text
artifact encryption
  XChaCha20-Poly1305-IETF
  32-byte random content key K
  24-byte nonce, 16-byte authentication tag

recipient envelope
  RFC 9180 HPKE Base mode
  DHKEM(X25519, HKDF-SHA256)
  HKDF-SHA256
  ChaCha20Poly1305
  seals K for one versioned recipient encryption-key binding
```

The HPKE context binds the artifact version, epoch, recipient identity, and
recipient encryption-key binding. Associated data binds the ciphertext object,
content nonce, policy, and envelope revision. The envelope contains an
encrypted content key, not plaintext and not a generic protocol-wide
"decryption key."

This is public-key encryption, not a traditional certificate-authority PKI.
KEP binds a stable Knowledge Identity to separate, versioned signing and
encryption public keys. A wallet signature and policy authorize the operation;
HPKE Base mode only protects the content key for B and does not authenticate A.

### 1.3 Reissue exposes a production custody obligation

To create a replacement envelope, A or another policy-authorized fulfiller
must recover the unchanged content key and seal it to B's replacement public
key. The browser trial demonstrates this with local state. A production design
still needs an explicit, durable content-key custody or recovery model that
does not give the hosted service plaintext capability. That obligation is not
resolved by Solana and is not hidden by the word "reissue."

## 2. The problem: knowledge does not behave like a coin

Most digital-asset protocols start from an object that can be transferred,
spent, or reassigned. Knowledge is different. If A communicates a theorem,
procedure, ontology, definition set, model, or design to B, the physical act of
communication does not erase A's copy or memory.

This creates several distinct questions:

- Which exact version of the knowledge was shared?
- Who originated or previously controlled that version?
- Who was authorized to add another recognized participant?
- Did the originator remain recognized after the event?
- Was B given access material specifically bound to B?
- Did B receive bytes that decrypt to the intended version?
- Which propagation policy and encryption epoch governed the event?
- Can a command be replayed or applied against stale state?
- Can B replace a lost encryption key without changing ownership?
- Which later economic or legal rules, if any, apply?

A blockchain entry alone cannot answer all of them. A database row cannot
provide public consensus. Ciphertext possession does not establish protocol
membership. Membership does not prove decryptable delivery. A wallet key is
not a durable identity. KEP separates these concerns and then reconnects them
through exact commitments and evidence.

Bitcoin's paper is an important structural precedent because it begins with a
specific trust failure and proposes a minimal cryptographic coordination
mechanism [1]. KEP uses the same problem-first discipline, but not Bitcoin's
transfer semantics. Its first transition expands a set rather than spends an
exclusive output.

## 3. The smallest useful protocol claim

Let `V` be one immutable Knowledge Artifact Version, `A` its originator, `B` an
intended recipient, `P` its immutable Propagation Policy, and `E` its current
Encryption Epoch.

The core transition is:

```text
before: owners(V) = {A}
after:  owners(V) = {A, B}
```

It is not:

```text
before: exclusive_owner(V) = A
after:  exclusive_owner(V) = B
```

The first outcome is complete only when public membership and private delivery
can be connected:

```text
immutable version V under policy P and epoch E
  + A-authorized grant for B
  + ciphertext commitment
  + B-specific key-envelope commitment
  + finalized public state
  + retrieved bytes matching those commitments
  + B-side decryption of V
  = bounded evidence of encrypted co-ownership delivery
```

"Ownership" in this paper means protocol-defined membership for one exact
version. It is not automatically copyright, legal title, exclusivity, a
license, a right to resell, or proof that a party continues to possess
plaintext.

## 4. Core model

### 4.1 Knowledge Artifact and Version

A Knowledge Artifact is the enduring conceptual work. A Knowledge Artifact
Version is the immutable protocol subject. Content commitment, originator,
policy, and encryption context are interpreted against that version. Material
changes create a successor version instead of silently mutating the old one.

This resembles the role of immutable content identifiers in content-addressed
systems such as IPFS [4], while KEP additionally binds identity, policy,
encryption, and delivery semantics.

### 4.2 Stable Knowledge Identity

A Knowledge Identity represents a participant across key changes. It is
distinct from both:

- a wallet or transaction-signing key; and
- an encryption public/private key pair.

```text
Knowledge Identity
  -> current signing-key binding for authorized actions
  -> current encryption-key binding for recipient envelopes
```

Replacing either key need not create a new participant. Every command must
nevertheless prove authority through the current binding and exact policy.

### 4.3 Propagation Policy

The Propagation Policy is immutable for a Knowledge Artifact Version. It
specifies who may add co-owners and who may fulfill reissue requests. A future
policy may describe licensing or economics, but the current capability has no
knowledge price.

### 4.4 Encryption Epoch

An Encryption Epoch identifies one content-encryption state. The distinction
between a lost key and a compromised key is fundamental:

```text
lost key, no compromise suspected
  -> preserve V, P, E, owners, and content key
  -> replace only B's encryption binding and envelope

suspected compromise
  -> create successor epoch E+1
  -> generate new content key and ciphertext
  -> issue replacement envelopes for every current owner
```

Ordinary reissue cannot safely repair compromise because rewrapping the same
content key does not remove access from a compromised key holder.

### 4.5 Recipient Key Envelope

A Recipient Key Envelope contains the content key encrypted for exactly one
recipient binding. It is bound to the artifact version, epoch, recipient,
cryptographic profile, policy, and envelope revision. Public chain state holds
a commitment to the envelope, not its sealed bytes, its content key, or the
recipient private key.

### 4.6 Membership and access are related but not identical

```text
membership without a valid envelope -> recognized owner, access unavailable
valid envelope without membership   -> invalid protocol state
membership plus active envelope     -> prepared deliverable access
verified retrieval and decryption   -> observed usable delivery
```

This distinction prevents an on-chain record from being inflated into proof of
plaintext possession.

## 5. Protocol invariants

The first vertical is governed by ten central invariants:

1. Every mutation is authorized by an exact wallet-signed canonical message.
2. Plaintext, content keys, wallet secrets, and encryption private keys remain
   client-held.
3. Ciphertext and envelope bytes must match their declared content identity.
4. Prepared storage is not active recipient access.
5. Activation requires a matching finalized Solana observation.
6. Adding B preserves A and all existing owners.
7. An access response exposes only the authenticated owner's active envelope.
8. Reissue preserves owners, artifact version, policy, and epoch.
9. Knowledge consideration is zero; infrastructure costs remain separate.
10. Logical database layers are not represented as independent backups.

## 6. State-transition model

Ethereum's white paper provides a useful notation for protocol execution as a
state-transition function that either produces a successor state or rejects
the transaction [2]. KEP follows that presentation.

Let state `S` contain:

```text
ArtifactState {
  artifact_version_id
  policy_id
  encryption_epoch
  owners
  active_envelope_commitment_by_owner
  state_revision
  consumed_replay_identities
}
```

Then:

```text
Grant(S, command, A, B, envelope_commitment) -> S' or ERROR
```

The grant is valid only if the artifact, policy, epoch, expected revision,
current identity bindings, A's membership and authority, B's intended identity,
envelope commitment, no-price boundary, and replay identity all match.

On success:

```text
owners' = owners union {B}
A remains in owners'
active_envelope_commitment_by_owner[B] = envelope_commitment
state_revision' = state_revision + 1
replay_identity becomes consumed
knowledge_consideration = 0
```

On failure, the pre-state must remain unchanged.

The bounded Lean FormalClaim checks this pure proposition for its modeled
transition. It does not prove that the Rust or Solana implementation refines
the model.

## 7. Layered architecture

```text
                         product meaning and authority
                definitions -> D65 gates -> exact decisions
                                      |
                                      v
 +----------------+ signed command +------------------------+
 | A or B browser |--------------->| hosted Rust HTTP API   |
 | wallet + local |                | signature verification |
 | cryptography   |<---------------| recipient-only access  |
 +-------+--------+ ciphertext /   +-----------+------------+
         |          own envelope               |
         | signed Solana instruction           | snapshot / journal /
         v                                     | ciphertext archive
 +------------------------+                    v
 | Solana Devnet program  |           +---------------------+
 | owners, commitments,   |           | SQL-portable store  |
 | revision, replay state |           | PostgreSQL baseline |
 +-----------+------------+           +---------------------+
             ^
             | finalized transaction and exact account bytes
             +---------------- hosted finality observer
```

This three-tier client/middleware/chain separation has a useful comparison in
Ocean Protocol's treatment of browser applications, provider middleware,
off-chain data, and on-chain access control [5]. KEP's semantic difference is
that its first unit is an identity-bound, recipient-specific, no-price
co-ownership grant rather than a fungible access token or marketplace sale.

OriginTrail similarly separates applications, a knowledge-graph layer, and
blockchain anchoring, and treats provenance and verifiability as central to
knowledge assets [6]. KEP does not currently claim global discoverability or a
decentralized knowledge graph. Its present scope is confidential delivery and
co-owner continuity for an exact artifact version.

### 7.1 Client responsibility

The participant client:

- controls the wallet and encryption private key;
- generates or receives the content key;
- encrypts and decrypts knowledge locally;
- creates recipient envelopes;
- displays the exact operation before requesting a wallet signature; and
- submits the signed Solana transaction as an explicit participant action.

### 7.2 Hosted service responsibility

The Rust service:

- registers stable identities and public-key bindings;
- verifies Ed25519 signatures over canonical messages;
- accepts ciphertext, public keys, commitments, and envelopes only;
- records prepared grants and reissues;
- persists ciphertext-only state;
- independently observes finalized Devnet transactions and program accounts;
- reconciles prepared expectations with observed chain state; and
- returns only the authenticated recipient's current envelope.

The service does not receive wallet seeds, encryption private keys, content
keys, or plaintext. It does not sign or submit transactions for participants.

### 7.3 Solana responsibility

Solana provides the first public coordination substrate. Its role is atomic
public state transition, ordering, ownership of the program account, and
finalized observable state—not knowledge custody. Solana's own architecture
describes a replicated state machine and separates leader, verifier, state,
ordering, and consensus concerns [3]. KEP relies on the resulting Devnet
finality interface but makes no independent claim about Solana's performance or
security. In particular, Solana never receives or executes a participant's
encryption secret and never decrypts or re-encrypts knowledge.

### 7.4 Durable storage responsibility

The storage port separates qualified byte identity from provider and locator:

```text
Layer 1: operational snapshot
Layer 2: append-only recovery journal
Layer 3: immutable ciphertext archive
```

All layers close over the same encrypted object identity. The PostgreSQL
baseline demonstrates these logical mechanisms on one host. A production
three-layer backup design additionally requires a physically independent,
encrypted, off-host archive and a verified clean restore.

## 8. Storage-first, release-after-finality

KEP cannot claim an atomic distributed transaction across a database, archive,
and Solana. Instead, it makes ordering and reconciliation explicit:

```text
persist encrypted material
  -> journal the operation
  -> archive immutable bytes
  -> retrieve and verify stored identities
  -> prepare the public transition
  -> participant signs and submits
  -> wait for finalized
  -> fetch exact program-owned account state
  -> reconcile state with prepared commitments
  -> release the recognized recipient's envelope
  -> recipient decrypts locally
```

Failure remains typed:

- storage failure before submission blocks signing and submission;
- transaction failure leaves prepared material inactive;
- ambiguous submission triggers read-only reconciliation, not blind retry;
- finalized membership with unavailable bytes becomes a delivery failure;
- commitment mismatch withholds delivery; and
- weaker-than-finalized observation does not authorize envelope release.

## 9. End-to-end grant and reissue

### 9.1 Grant

1. Select immutable version `V`, policy `P`, and epoch `E`.
2. Resolve stable identities A and B and their current key bindings.
3. Encrypt `V` under a fresh content key for `E`.
4. Wrap the key into a recipient-specific envelope for B.
5. Persist and re-read ciphertext and envelope commitments.
6. Prepare the exact no-price grant at the expected revision.
7. A signs and explicitly submits the Solana instruction.
8. The program validates authority, policy, state, and replay identity.
9. The hosted observer waits for finalized and reads the program account.
10. The service releases B's envelope only if every observed field matches.
11. B authenticates, receives ciphertext and B's envelope, and decrypts locally.

### 9.2 Reissue

1. B binds a replacement encryption public key.
2. B signs a replay-safe reissue request.
3. The authorized fulfiller creates and durably prepares a new envelope.
4. The fulfiller signs the policy-authorized replacement transition.
5. Solana advances the revision and changes B's active commitment.
6. The service reconciles finalized state before activating the replacement.

Reissue changes B's access material. It does not add B again, remove A, change
the artifact, alter policy, rotate the epoch, or create payment.

It does require access to the unchanged content key. In the present browser
trial that key is recoverable from participant-local state. Production must
define who may retain or reconstruct it, how that authority survives loss, and
how recovery avoids turning the hosted service into a decryption oracle.

## 10. Construction method: definitions before implementation

CyberAlchemy-v2 uses the D65 construction invariant:

```text
prototype definitions
  -> agent-facing ontology scaffolds
  -> product, business, DomainSpec, compiled-system,
     and implementation prototypes
  -> one exact testable product candidate
  -> current product-test evidence
  -> product approval
  -> only then separate authority, admission, activation,
     cutover, publication, release, or deployment decisions
```

The prototype stages are iterative and non-authoritative. A language model may
draft every artifact in the chain, but cannot accept its own definitions,
adopt its Product Capability, admit its ontology, approve the product, or
convert test output into operational authority. Decisions bind immutable
digests; changed acceptance-bound bytes require a new test and approval epoch.

This method is not part of the public transaction protocol. It is the process
used to keep product meaning, system intent, implementation, and evidence from
quietly diverging.

## 11. Implementation snapshot

The current hosted candidate contains:

- a Rust/Axum HTTP service;
- Ed25519 canonical-message authorization;
- a browser workbench with client-side encryption and wallet interaction;
- XChaCha20-Poly1305 content encryption in the selected test profile;
- RFC 9180 HPKE with X25519/HKDF-SHA256/ChaCha20-Poly1305 envelopes;
- an SQL-independent persistence port and PostgreSQL realization;
- snapshot, append-only journal, and immutable ciphertext archive tables;
- a Solana Devnet finality adapter bound to the exact genesis and program;
- deterministic DomainSpec compilation and a generated system ontology;
- container configuration that exposes the application on loopback by default;
  and
- tests for the two-party grant, decryption, reissue, browser boundary, and
  persistence recovery.

The accepted implementation binding fixes 29 implementation files,
two source assets, and an exact selector map covering all 12 admitted graph
nodes, 13 graph edges, and six runtime constraints. Two deterministic
preacceptance validations and the named local executable checks pass. This
supported an exact owner acceptance of the candidate, binding record, and
implementation-material digests. Acceptance fixes the conformance target; it
does not itself establish D65 conformance.

The selected algorithms are an implementation target, not a production
security approval. The historical implementation README records no critical or high
finding and one moderate transitive advisory through
`@solana/web3.js -> jayson -> uuid`; the interface does not call the affected
UUID APIs, but that is not proof of non-exploitability. The system still needs
that residue adjudicated, known-answer coverage expansion, malformed-input and
fuzz testing, zeroization and side-channel analysis, broader dependency review,
wallet/browser compatibility work, abuse controls, and an independent security
audit.

## 12. Evidence

### 12.1 Formal model evidence

Lean 4.32.0 checked the named core-grant theorem twice with deterministic empty
output. The theorem covers the pure modeled property: successful transition
preserves A, adds B, records B's commitment, advances revision, consumes replay,
and preserves zero consideration; modeled rejection preserves pre-state.

The encrypted durable successor adds a second, broader formal claim set. Seven
claims cover canonical CBOR, three-layer storage gating, grant, finalized
activation, reissue, cost separation, and secret placement. Those claims have
fifteen deterministic `PASS_BOUNDED` projections across Lean 4.33.1, TLC 1.7.2,
and Alloy 6.2.0. The different formalisms are complementary: their results do
not vote, and one cannot compensate for a missing mandatory premise in another.

These results remain bounded model evidence. They do not cover signer
implementation, exact refinement to Rust or Solana bytes, cryptographic
security, storage durability, hosted orchestration, or external execution.

### 12.2 EVF implementation and review evidence

The EVF provider-observation set records five bounded provider classes:

- 29 Rust local conformance cases;
- 3 cryptographic known-answer cases;
- 1 disposable PostgreSQL three-layer integration case;
- 13 Solana program-test cases; and
- 7 formal-provider cases.

All report `PASS_BOUNDED` for their exact selected sources and environments. A
separate relation matrix contains 204 distinct mappings from compiled
system-ontology relations to providers. Those records demonstrate structural
coverage, but each explicitly disclaims independent relation-specific
behavioral proof.

Independent review 009 recomputed the immutable candidate-011 and 26-file
runtime identities, inspected the bounded ambiguity repair, and reported zero
unresolved high or critical findings. It also carried ten medium residues. The
review therefore does not establish production readiness or aggregate
conformance.

The later residuality closure candidate-013 makes the remaining surface more
explicit. It declares fifteen specification-closed paths, identifies ten
reachable safety paths, and currently has external evidence for two of them.
Its ten formal obligations are `PASS_BOUNDED`, including two deterministic Lean
runs, a Rust refinement check, and bounded exploration of 120 states. The
aggregate result remains `not_evaluable`: formal closure of an obligation does
not manufacture the missing finalized Devnet observation for its corresponding
external path.

The missing join is exact refinement: no accepted receipt yet proves that every
formal transition and rejection condition corresponds completely and
exclusively to the selected Rust, Solana, SQL, and browser implementation
bytes.

### 12.3 Local hosted functional evidence

The accepted-target preacceptance run recorded passing local checks including:

- definition and index validation;
- Product Capability schema and digest validation;
- ontology validation;
- deterministic DomainSpec currency;
- exact implementation-binding currency;
- Rust formatting;
- three browser-client tests;
- browser bundle/source equality; and
- the two-identity Rust integration test.

The Rust test uses distinct Ed25519 identities and distinct recipient
encryption keys. It rejects B signing A's grant, denies B access before
finalization, applies `{A}->{A,B}`, lets B recover and decrypt the exact bytes,
and reissues B's envelope at revision 2 without changing owners or epoch. Its
finality gateway is mocked, so this is local functional—not public-network—
evidence.

The G1.5 preacceptance receipt validates the then-current binding record, its
admitted system-ontology predecessor, 31 selector mappings, and the local
Rust/browser surfaces. That exact target was subsequently accepted.

The fresh post-acceptance assessment then found that the mutable binding path
had changed from accepted binding `50a0e5ce...` and material `e96a517c...`.
Later UI and documentation work changed implementation-bearing bytes again.
Those current bytes are not the accepted target. The assessment is therefore
`BLOCK`; implementation-dependent checks are `not_evaluable` against the
accepted target rather than being silently run against substituted bytes.

One replacement state is preserved in immutable binding snapshot
`41c3bf98...` and replacement candidate `92883021...`, rather than only at the
mutable generator output. Two deterministic candidate validations plus the
then-current local Rust and browser checks passed at preacceptance. Before final
freeze, however, UI bytes changed again, and this draft changes them further.
The candidate is therefore stale historical evidence, not a current product
candidate and not a basis for reopening conformance.

### 12.4 PostgreSQL evidence

A disposable PostgreSQL 17 Alpine container bound to loopback completed the
migration, wrote two append-only journal events, stored one immutable ciphertext
archive object, and allowed a new application instance to recover identity and
artifact state. Cleanup was recorded as complete.

This proves one local adapter path. It does not prove independent backup
failure domains, off-host restoration, retention, RPO, RTO, or production
operations.

### 12.5 HTTP evidence

A loopback process returned the expected capability, Devnet network, program
identifier, and ciphertext-only custody posture at `/health`. This is a route
and process smoke test, not evidence of public hosting, TLS, perimeter security,
availability, or scaling.

### 12.6 Public Devnet observation

The finality adapter made read-only public RPC observations against the Solana
Devnet genesis. It found a prior transaction finalized successfully, verified
that the bound KEP program participated, verified ownership of the artifact
account by that program, decoded the exact account layout, and observed
revision 2 with the expected recipient and envelope commitment.

No credential, signing action, submission, or new transaction occurred in this
observation. It is not a fresh hosted third-party end-to-end trial.

### 12.7 Evidence status

The pieces are deliberately not collapsed:

```text
seven formal claims through fifteen projections
  + bounded Rust, crypto, SQL, browser, and Solana provider behavior
  + 204 structural relation-to-provider mappings
  + one independent review of immutable candidate 011
  + local PostgreSQL behavior
  + local HTTP behavior
  + read-only finalized Devnet state
  != accepted formal-to-implementation refinement
  != full hosted D65 conformance
  != aggregate conformance or production readiness
```

Hosted D65 conformance remains `not_evaluable`. The exact hosted definition set
is owner-accepted, the exact hosted Product Capability is owner-adopted, and
the exact business-system bridge material is owner-admitted. The exact
DomainSpec v2 source candidate is also owner-admitted by a separate digest-bound
decision. The immutable generated-system-ontology candidate passed two
deterministic validations and is owner-admitted by a separate exact decision.
The exact implementation binding is owner-accepted. A fresh post-acceptance
assessment is now `BLOCK`, however, because the mutable binding path and
implementation material no longer match the accepted digests. The current
implementation bytes are not an accepted conformance target. Replacement
candidate 002 preserved one exact intermediate target and passed preacceptance,
but later UI drift made it stale. Candidate-013 improves bounded residual
coverage but remains `not_evaluable` for missing external observations. There
is no current frozen, approved product candidate. D65 conformance remains
`not_evaluable`.

## 13. Threat and failure model

### 13.1 Secret disclosure

Plaintext, content keys, wallet secrets, recipient private keys, database
passwords, and RPC credentials must not enter Git, logs, evidence, SQL state,
archive metadata, or public chain state.

### 13.2 Identity substitution

The protocol must reject designs that collapse stable identity into a wallet or
encryption key. Otherwise key replacement silently changes the participant.

### 13.3 Replay and stale state

Each mutation binds an expected revision and fresh operation identity. A stale
or repeated command must fail without partial mutation.

### 13.4 Commitment mismatch

The service recomputes the exact byte digest and checks its bound context.
Provider identifiers, database row IDs, locators, and transport success are not
substitutes for content verification.

### 13.5 Cross-system inconsistency

There is no atomic commit across Solana and external storage. Preparation,
finalized observation, and reconciliation constrain the inconsistency window
but do not eliminate every availability failure.

### 13.6 Learned knowledge cannot be revoked

Removing an envelope or future membership cannot make previously decrypted
knowledge unknown. Later licensing and revocation language must reflect this
physical limit.

## 14. Economics and rights are successor layers

The present protocol distinguishes:

```text
knowledge consideration = zero
Solana cost             = fee, rent, and RPC infrastructure
storage cost            = database, journal, archive, retrieval, operations
```

Network or hosting cost is not silently treated as payment for knowledge.

A paid successor would need explicit definitions for denomination, quote,
payer, settlement, originator payout, downstream royalty, failure, refund, and
delivery conditions. Rights and licensing would need equally explicit rules
and legal review. Economic reputation would require evidence about behavior and
resistance to gaming. None of these layers is implemented by the current
no-price capability.

## 15. Related systems

The selected comparison set is intentionally small:

- Bitcoin contributes problem-first protocol exposition and explicit trust
  boundaries [1].
- Ethereum contributes state-transition and rejection notation [2].
- Solana contributes the concrete public execution and finality substrate [3].
- IPFS contributes content-addressed and versioned object reasoning [4].
- Ocean contributes a close comparison for off-chain data, on-chain access,
  browser clients, providers, and later market layers [5].
- OriginTrail contributes knowledge-asset, provenance, verification, and
  layered-knowledge architecture comparisons [6].

The current review is insufficient for a novelty claim. Peer-reviewed work on
encrypted sharing, proxy re-encryption, capability systems, decentralized
identity, key transparency, fair exchange, and digital rights remains to be
surveyed.

## 16. What remains to be proved

Before describing the system as production-ready or publishable, at least the
following gaps must close:

1. Integrate the current main, residuality, and historical observation baselines
   without collapsing their distinct evidence epochs.
2. Freeze one exact testable product candidate, produce current product-test
   evidence, and obtain a separate product approval before any operational
   authority decision.
3. Resolve the production content-key custody and recovery design used by
   reissue without granting the service plaintext capability.
4. Independently review cryptography and application security, including
   malformed input, fuzzing, resource exhaustion, concurrency, zeroization,
   side channels, and dependency residue.
5. Produce wallet and browser compatibility evidence.
6. Prove physically independent encrypted backup and clean restoration.
7. Close the eight reachable residuality paths that lack external evidence;
   any new Devnet execution remains a separately authorized operation.
8. Establish VPS, DNS, TLS, firewall, monitoring, incident, and credential
   procedures before public operation.
9. Run user and legal research before mapping protocol membership to ownership,
   licenses, rights, market value, or reputation.
10. Complete a broader related-work review and explicit novelty adjudication.

## 17. Conclusion

KEP's starting point is not that knowledge can be made scarce. It is that a
specific sharing event can be made explicit, confidential, recipient-bound,
and inspectable without pretending the originator stopped knowing the work.

The resulting primitive is small:

```text
{A} -> {A,B}
```

Its implementation is not small because meaningful evidence crosses identity,
cryptography, storage, public state, finality, and client-side delivery. The
architecture therefore separates responsibilities and uses commitments to join
them. CyberAlchemy-v2's construction discipline adds another separation:
meaning, system intent, code, evidence, and authority are related, but none may
silently stand in for another.

The current work demonstrates a credible candidate substrate and several
bounded observations. The next milestone is not a broader market claim or an
automatic repeat of the external trial. It is baseline integration followed by
one new exact product candidate and current product-test evidence. Any later
Devnet execution, product approval, deployment, publication, or release remains
a separate decision with its own immutable scope.

## References

[1] S. Nakamoto, “Bitcoin: A Peer-to-Peer Electronic Cash System.”
<https://bitcoin.org/bitcoin.pdf>

[2] V. Buterin et al., “Ethereum Whitepaper.”
<https://ethereum.org/whitepaper/>

[3] A. Yakovenko, “Solana: A New Architecture for a High Performance
Blockchain.” <https://solana.com/solana-whitepaper.pdf>

[4] J. Benet, “IPFS — Content Addressed, Versioned, P2P File System.”
<https://research.protocol.ai/publications/ipfs-content-addressed-versioned-p2p-file-system/>

[5] T. McConaghy et al., “Ocean Protocol Technical Whitepaper V3 and V4.”
<https://oceanprotocol.com/tech-whitepaper.pdf>

[6] Trace Labs, “Verifiable Internet for Artificial Intelligence: The
Convergence of Crypto, Internet and AI.”
<https://origintrail.io/documents/Verifiable_Internet_for_Artificial_Intelligence_whitepaper_v3_pre_publication.pdf>

## Local evidence index

The byte-bound local sources and their lifecycle postures are recorded in
[`SOURCES.json`](SOURCES.json). Claim-by-claim treatment is recorded in
[`CLAIM-LEDGER.md`](CLAIM-LEDGER.md), and evidence ceilings are summarized in
[`EVIDENCE-MATRIX.md`](EVIDENCE-MATRIX.md).
