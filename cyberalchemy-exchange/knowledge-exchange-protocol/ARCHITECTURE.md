# CyberAlchemy Exchange and KEP Architecture

Status: private architecture guide; current-state reconciliation

Snapshot date: 2026-09-04

Product identity: `CA2-PRODUCT-KNOWLEDGE-EXCHANGE-PROTOCOL`

Working product brand: **CyberAlchemy Exchange** (candidate)

Protocol name: **KEP — Knowledge Expansion Protocol** (candidate expansion)

Current target: no-price, encrypted, durable co-ownership expansion on Solana
Devnet

Authority effect: none

This guide explains the product model, construction chain, runtime components,
evidence system, current implementation state, and remaining work. It is a
selective map of repository evidence. It does not replace definitions, adopt a
Product Capability, admit ontology or DomainSpec bytes, approve a product,
accept an implementation, authorize an external effect, or publish a claim.

The repository path still uses `knowledge-exchange-protocol`. The selected
participant-facing names are recorded in
[PRODUCT-BRAND-CANDIDATE.json](PRODUCT-BRAND-CANDIDATE.json), which remains a
naming candidate rather than a canonical protocol change.

## 1. Practical Status

KEP is no longer only a local state-machine idea. The repository contains:

- governed product definitions, capabilities, business ontologies, DomainSpec
  sources, compiled system ontologies, and decision records;
- a Rust protocol kernel with cryptography, storage, and Solana ports;
- a native Solana program and SBF build path;
- a PostgreSQL reference adapter behind SQL-neutral storage contracts;
- a trial CLI with effect envelopes, journals, reconciliation, and bounded
  deployment continuation;
- a hosted Rust HTTP application with participant-side browser cryptography;
- an English and Portuguese participant interface;
- a white-paper package and EVF formal-evidence stack; and
- historical public-Devnet observations from a disposable deployment attempt.

The combined product is **not currently one frozen, approved candidate**. The
latest material is split between the main checkout and the unintegrated
`codex/kep-residue-closure` worktree. Current main-checkout bindings have also
drifted from previously accepted bytes. The correct aggregate state is
therefore `BLOCK` or `not_evaluable`, depending on the dependent claim—not
“complete,” “approved,” or “deployed.”

### 1.1 Three evidence ledgers

All current claims must identify which ledger they consume:

| Ledger | What it contains | How it may be used |
| --- | --- | --- |
| Main checkout | Hosted vertical, white paper, current product packages, Rust workspaces, and current validators | Observed current source; several selected bindings are stale or blocked |
| Residue-closure worktree | Candidate-013 continuation model, EVF path coverage, Lean evidence, Rust refinement, bounded exploration, and continuation plan | Unintegrated candidate evidence only |
| Historical external observations | A disposable Devnet attempt and its reconciled journal | Bounded facts about that attempt only; not current deployment or protocol success |

Bytes from different ledgers must not be silently combined into one digest,
binding, approval, conformance result, or publication claim.

## 2. Product Model

The first KEP product slice lets an originator A expand recognized membership
for one exact encrypted Knowledge Artifact Version to recipient B while A
remains present:

```text
before: owners(V) = {A}
after:  owners(V) = {A, B}
```

It is not an exclusive transfer:

```text
not: owner(V) = A -> owner(V) = B
```

The bounded success thesis is:

```text
exact artifact version V
  + immutable propagation policy P
  + stable originator identity A
  + independently controlled recipient identity B
  + encrypted artifact bytes
  + recipient-specific encrypted key envelope
  + A-authorized replay-safe state transition
  + finalized chain observation
  + verified durable retrieval
  + B-side decryption evidence
  = evidence that recognized membership expanded from {A} to {A, B}
```

The chain does not hold the knowledge. It coordinates public state and
commitments. Plaintext, content keys, recipient private keys, and wallet secrets
remain outside public chain state and outside the hosted service.

### 2.1 Current economic boundary

The current vertical is no-price:

```text
knowledge consideration = 0

infrastructure cost = Solana fees + rent + RPC + SQL + archive + operations
```

Infrastructure cost is not a knowledge price. Licensing, royalties, paid
propagation, resale, user-right policies, and economic reputation are successor
product layers. They require new definitions and product meaning rather than a
reinterpretation of Devnet fees.

### 2.2 Ownership, access, and legal rights

KEP deliberately separates:

- recognized protocol membership;
- availability of a valid recipient envelope;
- ability to retrieve ciphertext;
- ability to decrypt plaintext;
- legal title, copyright, or license; and
- economic consideration.

Protocol co-ownership is a typed membership relation for one version. It does
not, by itself, prove legal ownership, continuing possession of plaintext, or
an enforceable license.

## 3. Architecture at a Glance

```text
                         CONSTRUCTION AND AUTHORITY PLANE
  definitions -> ontology scaffolds -> DomainSpec -> compiled system intent
       -> exact implementation candidate -> product tests -> product approval
       -> separate admission / activation / deployment / publication decisions
                                      |
                                      v
                         PARTICIPANT AND RUNTIME PLANE

 +------------------+    ciphertext + signed intent    +---------------------+
 | Originator A     | -------------------------------> | Hosted KEP API      |
 | browser + wallet |                                  | no secret custody   |
 +--------+---------+                                  +----+-----------+----+
          |                                                 |           |
          | signed Solana instruction                       |           |
          v                                                 v           v
 +------------------+       finalized observation      +---------+ +----------+
 | Solana program   | <------------------------------> | SQL port | | Journal  |
 | public state and |                                  +----+----+ +----+-----+
 | commitments      |                                       |           |
 +------------------+                                       +-----+-----+
                                                                  |
                                                                  v
                                                        +------------------+
                                                        | Immutable archive|
                                                        | SQL-independent  |
                                                        +--------+---------+
                                                                 |
                                                                 v
                                                        +------------------+
                                                        | Recipient B      |
                                                        | local decryption |
                                                        +------------------+

                         EVIDENCE AND EVALUATION PLANE
  source digests + formal claims + refinement + local tests + external reads
       -> typed EVF observations -> collect-all adjudication -> claim ceiling
```

The runtime has no cross-system atomic transaction spanning Solana, SQL, and
the archive. It uses storage-first preparation, finalized activation,
append-only journals, idempotent effect identities, and reconciliation.

## 4. Construction Invariant

All new or materially revised implementation-bearing KEP capabilities follow
the current `CAV2-D65` construction invariant:

```text
prototype definitions
  -> agent-facing ontology scaffolds
  -> product, business, DomainSpec, compiled-system, and implementation prototypes
  -> one exact testable product candidate
  -> current product-test evidence
  -> product approval
  -> only then separate authority, admission, activation, cutover,
     publication, release, or deployment decisions
```

Prototype stages are iterative and non-authoritative. Existing historical
acceptance and admission records remain evidence about their exact bytes, but
they do not make changed bytes current. A validator may expose a candidate or
detect drift; it cannot manufacture product approval or operational authority.

### 4.1 Semantic dependency direction

```text
CyberAlchemy-v2 product meaning
  -> capability-local business meaning
  -> DomainSpec v2 typed intent
  -> deterministic compiled graph and system ontology
  -> exact Rust/browser/SQL/Solana implementation binding
  -> bounded product and environment evidence
```

Dependencies flow in this direction. Rust, a UI, a passing test, or a Devnet
signature cannot silently redefine ownership, price, identity, or authority.

### 4.2 Construction versus operations

KEP work is maintained in two independent lanes:

- **Product construction** changes definitions, models, ontology scaffolds,
  DomainSpec, compiled system intent, implementation, or product tests.
- **Operational support** prepares hosting, credentials, backups, monitoring,
  migration, publication, or an external trial without changing the product
  being tested.

An unrelated waiting operational item does not block runnable prototype work.
An operational task blocks construction only when it is the exact prerequisite
for the next construction action or when proceeding would violate a safety,
credential, privacy, destructive-action, or external-effect boundary.

## 5. Runtime Components

### 5.1 Participant browser and wallet

The browser workbench is responsible for participant-side behavior:

- distinguish the originator from the recipient;
- construct canonical protocol messages;
- request wallet signatures without receiving the wallet secret;
- create or consume ciphertext and recipient envelopes locally;
- show the protocol state and finalized observations;
- keep private encryption material on the participant side; and
- support English and Portuguese interface copy.

The participant UI is an implementation prototype and explanatory surface. Its
existence and visual quality are not protocol conformance evidence.

### 5.2 Hosted KEP API

The hosted Rust service provides a network-addressable, non-custodial boundary.
Its current source includes:

- an Axum HTTP API;
- Ed25519 authorization;
- a Solana finality gateway;
- PostgreSQL persistence;
- static participant and white-paper surfaces;
- typed error intelligence;
- container and VPS deployment candidates; and
- two-party, persistence, and interface test surfaces.

The service accepts public material, signed commands, ciphertext, commitments,
and recipient envelopes. It must not accept or log wallet secrets, recipient
private keys, content keys, or plaintext knowledge.

The current hosted package is a locally implemented candidate. Its accepted
implementation binding is stale relative to current bytes, so its
implementation-dependent tests are currently `not_evaluable` for the accepted
target.

### 5.3 Rust protocol kernel

The core Rust workspace owns product-meaning-preserving state transitions and
ports, including:

- encrypted/durable Devnet model types;
- grant and reissue protocol behavior;
- replay and revision checks;
- evidence construction;
- cryptography, Durable Storage, and Solana ports;
- adapters for cryptography and SQL;
- a native Solana program workspace member; and
- the terminal trial and deployment-continuation CLI.

The kernel must remain independent of one hosted UI or one SQL dialect. Runtime
code realizes selected system obligations; it does not decide product meaning.

### 5.4 Solana program

The Solana program is the public coordination component. Its responsibility is
to validate and apply replay-safe state transitions over exact public inputs,
not to custody knowledge.

Its semantic state includes equivalents of:

```text
ArtifactState {
  artifact_version_id
  propagation_policy_id
  encryption_epoch_id
  owners
  active_envelope_commitment_by_owner
  state_revision
  consumed_replay_identities
}
```

The repository contains native program source, program-test surfaces, an SBF
build path, and a bounded deployment mechanism. A source tree or SBF artifact
is not a deployed-program claim. Current external evidence records an incomplete
historical deployment attempt and zero protocol submissions.

### 5.5 Durable Storage port

Durable Storage is a provider-neutral capability consumed by KEP. It owns:

- immutable byte identity;
- verified persistence and retrieval;
- typed failures;
- replacement and migration behavior;
- append-only recovery evidence; and
- restoration into a clean conforming destination.

KEP specializes the port for encrypted artifact objects and recipient-envelope
objects. The Solana product does not select a provider or redefine the storage
capability.

### 5.6 SQL-neutral three-layer protection

```text
Layer 1: operational SQL realization
  -> current qualified object identity and locator metadata

Layer 2: append-only recovery journal
  -> immutable operation and recovery events

Layer 3: SQL-independent immutable archive
  -> exact content-addressed bytes recoverable without Layer 1
```

The current reference adapter uses PostgreSQL, but the core contract is defined
through behavioral ports. Another SQL engine may be used only after it proves
the same obligations. “Any SQL” means adapter portability, not that every SQL
database is automatically conformant.

### 5.7 Trial CLI and effect journal

The trial CLI separates preparation, validation, signing, submission,
observation, and reconciliation. It binds:

- exact effect envelopes;
- cluster and genesis identity;
- program and SBF identity;
- disposable participant and deployment identities;
- maximum submission counts;
- semantic effect IDs;
- append-only attempt journals;
- finalized reads; and
- fail-closed ambiguity handling.

A submitted effect with an ambiguous outcome must be reconciled before any
retry. Transaction count alone is not sufficient; the journal reasons over
typed semantic effects and their signatures.

## 6. Core Domain Model

### 6.1 Artifact and version

A Knowledge Artifact is the enduring conceptual work. A Knowledge Artifact
Version is the immutable protocol subject. Material meaning or immutable policy
changes create a successor version.

### 6.2 Stable identity and replaceable keys

A Knowledge Identity is not a wallet address and not an encryption key:

```text
Knowledge Identity
  -> signing-key bindings over time
  -> encryption-key bindings over time
  -> stable participant identity across key replacement
```

Signing authority and encryption access are separate bindings with explicit
validity and policy scope.

### 6.3 Propagation policy

The version-bound Propagation Policy determines who may add a co-owner and who
may fulfill reissue. A current owner is not universally authorized; the exact
policy and current signing binding must permit the action.

### 6.4 Encryption epoch and recipient envelope

An Encryption Epoch identifies one content-encryption state. A Recipient Key
Envelope is recipient-specific encrypted material that recovers the content
key and binds at least:

- artifact version;
- epoch;
- recipient stable identity;
- recipient encryption-key binding;
- cryptographic profile;
- policy context; and
- envelope revision.

Solana stores a commitment to the envelope, never its plaintext or a private
key.

### 6.5 Membership and access state

```text
membership without valid envelope -> recognized member; access unavailable
envelope without membership       -> invalid protocol state
membership + prepared envelope    -> recognized member; access prepared
finalized activation + retrieval  -> deliverable access for the bounded flow
```

### 6.6 Revision and replay identity

Each mutation binds an expected state revision and a fresh replay identity. A
successful transition advances the revision and consumes the replay identity
atomically. Stale, duplicated, or unauthorized commands fail without partial
protocol-state mutation.

## 7. Cryptographic Boundary

The selected Devnet profile uses XChaCha20-Poly1305-IETF for artifact content
and RFC 9180 HPKE Base mode with X25519/HKDF-SHA256/ChaCha20Poly1305 for
recipient envelopes. SHA-256 domain-separated commitments and deterministic
CBOR encoding bind objects to their context.

The architecture requires:

- authenticated decryption before plaintext release;
- context-bound associated data;
- operating-system cryptographic randomness;
- exact library and lockfile binding;
- malformed-input and negative vectors;
- explicit private-key and plaintext custody boundaries; and
- independent dependency and security review.

Algorithm selection and passing test vectors are not a production security
proof. The current profile remains bounded to controlled Devnet work.

## 8. End-to-End Protocol Flows

### 8.1 Grant and activation

```text
1. A identifies exact V, policy P, epoch E, and recipient B.
2. A's browser encrypts V and creates B's recipient envelope.
3. The client computes domain-separated commitments.
4. The storage adapter prepares operational, journal, and archive layers.
5. Retrieval verifies exact bytes and context before signing is allowed.
6. A signs the canonical grant command.
7. The Solana program validates A, P, B, revision, and replay identity.
8. The program preserves A, adds B, records B's envelope commitment,
   advances revision, and consumes replay identity.
9. The observer waits for the exact transaction and account state at finalized.
10. The hosted service activates recipient access only against that observation.
11. B retrieves ciphertext and B's envelope.
12. B decrypts locally and verifies the exact plaintext commitment.
```

Preparation before Solana can leave orphaned inactive objects. That is an
accepted consequence of refusing to claim cross-system atomicity. Reconciliation
and retention policy must handle those objects explicitly.

### 8.2 Lost-key reissue

```text
B signs reissue request
  -> policy-authorized fulfiller verifies stable identity and new key binding
  -> same artifact version
  -> same owner set
  -> same encryption epoch
  -> same content key
  -> new B-specific envelope and commitment
```

Ordinary reissue changes access material, not membership, artifact identity,
policy, or price.

### 8.3 Suspected key compromise

```text
suspected compromise
  -> successor encryption epoch
  -> new content key
  -> new ciphertext
  -> replacement envelopes for every current member
```

Rewrapping the old content key is insufficient when compromise is suspected.

### 8.4 Ambiguous external effect

```text
submission outcome unknown
  -> stop successor effects
  -> read finalized chain state for the recorded signature and effect
  -> append reconciliation observation
  -> only a separate decision may authorize any remaining effect
```

## 9. EVF and Formal Evidence Architecture

EVF is an evidence composition framework, not a single proof tool. It selects
providers according to the property that needs evidence. Lean, TLC, Alloy,
Rust tests, bounded exploration, browser tests, SQL tests, Solana program tests,
and finalized reads are complementary; none is mandatory by brand alone.

```text
E0 semantic sources and authority records
  -> E1 formal claims and provider projections
  -> E2 formal-to-implementation refinement
  -> E3 bounded local implementation observations
  -> E4 bounded environment observations
  -> E5 independent review
  -> E6 typed collect-all adjudication
  -> E7 publication-safe claim projection
```

### 9.1 Residuality-first path analysis

The recent candidate-013 work uses residuality as the base for adversarial path
discovery:

1. enumerate ways the desired guarantee can degrade;
2. identify the residue that must remain under each stressor;
3. classify reachable safety paths;
4. select the evidence kind each path requires;
5. bind formal obligations to exact implementation symbols and tests; and
6. preserve missing external observations as `not_evaluable`.

The candidate-013 validator currently reports:

- 15 declared paths;
- 15 paths closed at the specification level;
- 10 reachable safety paths;
- 2 paths with the currently required evidence support;
- 10 of 10 bounded formal obligations discharged;
- deterministic Lean evidence over two runs;
- `PASS_BOUNDED` exact Rust refinement;
- `PASS_BOUNDED` exploration of the declared `5 x 4 x 6 = 120` abstract-state
  universe; and
- finalized Devnet observation still `not_evaluable`.

The aggregate candidate remains `BLOCK` / `not_evaluable`. Specification
closure and bounded proofs do not substitute for the missing environment
observation or product approval.

### 9.2 Broader conformance model

The unchanged conformance-v2 package validates:

- 7 formal claims;
- 13 obligations; and
- 204 typed evidence relations.

Its current result is `PASS`, with no authority effect. It demonstrates model
and relation closure, not acceptance of the combined implementation or a live
protocol trial.

## 10. Current Evidence Matrix

This matrix reports the validators executed against exact current bytes on
2026-09-04.

| Surface | Current observation | Interpretation |
| --- | --- | --- |
| Root KEP product package | `BLOCK` | Parent product-thesis source digest drift; last reported lifecycle meaning cannot be promoted |
| Hosted definitions | `PASS` | Exact hosted definition candidate and historical decision closure validate |
| Hosted Product Capability | `PASS` | Exact recorded capability decision validates; no implementation claim |
| Hosted ontology scaffold | `PASS` | Current selected package validates; no runtime enforcement effect |
| Hosted DomainSpec and compiled system ontology | `PASS` | Current source and deterministic candidate/decision relationships validate |
| Hosted accepted implementation target | `BLOCK` | Accepted binding/material digests no longer match current bytes |
| Hosted functional/browser/conformance checks | `not_evaluable` | Deliberately not run against substituted bytes after binding drift |
| White-paper package | `BLOCK` | `LOCAL-HOSTED-CONFORMANCE` source digest drift |
| Durable Storage current D65 chain | `BLOCK` | Native DomainSpec lint now requires `invariant_refs` on the selected value object |
| Durable Storage Rust reference runtime | `PASS` | `rustfmt` plus 12 tests on each of two runs; Clippy unavailable and non-mandatory for this bounded gate |
| Conformance-v2 formal package | `PASS` | 7 claims, 13 obligations, 204 relations; no authority effect |
| Candidate-013 continuation evidence | `not_evaluable`; readiness `BLOCK` | Formal and refinement evidence pass boundedly; finalized external observation remains absent |

### 10.1 Hosted binding drift

The accepted hosted target was:

```text
binding record:          50a0e5ce9cbc811c8e9d5249b28ae0c1bb4b19824d27a8b4adce7dd7afd2bf92
implementation material: e96a517ca08db35294010db5002a02ae8ccc37e1d2b0d14bc834cc2eca92795f
```

The observed current target is:

```text
binding record:          544429b5ed32e9a433d09b52b262338780271a23eaab3ed477508aa3fa846c00
implementation material: a168eb6f68e56e0a35c571099a5ee987811e3c01d5ff447bb2d1641e39b52490
```

The old decision remains historical evidence for the old bytes. It does not
accept the new bytes.

## 11. Historical Devnet Observation

The disposable trial journal records a bounded incomplete deployment attempt:

- 57 recorded deployment signatures;
- 57 reconciled finalized successes;
- zero reconciled failures or pending effects;
- finalized buffer creation;
- finalized SBF write prefix covering chunks `0..55` of 128;
- first unwritten chunk `56`;
- 72 remaining chunk writes plus one final deploy, for exactly 73 potential
  additional deployment submissions in the authored continuation plan; and
- zero protocol submissions.

The candidate-013 continuation plan proves bounded local properties about
starting at the first unwritten chunk, not replaying finalized effects, keeping
one signature per semantic effect, stopping on ambiguity, and deploying only
after all writes finalize.

That plan is authored local evidence and has not executed an external effect.
The historical deployment is incomplete, and no A-to-B KEP protocol trial is
established by it.

## 12. Testing and Observability Alignment

### 12.1 Test layers

| Layer | What it checks | What it cannot claim |
| --- | --- | --- |
| Definition and schema validators | Shape, bindings, index sync, source currency | Product truth or runtime behavior |
| Ontology and DomainSpec checks | Typed relationship closure and deterministic compilation | Implementation conformance |
| Lean/TLC/Alloy/bounded exploration | Selected model properties in declared bounds | Exact runtime or environment behavior |
| Refinement provider | Traceability from obligation to exact symbols and focused tests | Universal equivalence |
| Rust and browser tests | Exact local positive and negative behavior | Public-Devnet or production behavior |
| SQL recovery tests | Adapter behavior and verified restore | Independent production failure domains |
| Solana program tests | Program behavior in the test harness | Exact public deployment behavior |
| Finalized public reads | One external observation | Perpetual availability or production readiness |
| Independent review | Findings and challenged assumptions | Self-executing acceptance |

### 12.2 Required observability

Every effectful run should preserve, without secrets:

- packet, binding, program, SBF, fixture, and source identities;
- cluster endpoint class and genesis identity;
- semantic effect ID and expected submission cardinality;
- transaction signature, slot, commitment, and error state;
- pre/post account byte digests;
- operational, journal, and archive object identities;
- reconciliation observations;
- explicit `PASS`, `BLOCK`, or `not_evaluable` states; and
- a bounded claim ceiling.

Logs and evidence must exclude plaintext, content keys, private keys, seed
phrases, database passwords, customer material, and reusable credentials.

## 13. Failure and Threat Boundaries

### 13.1 Identity substitution

A wallet or encryption public key must never replace the stable Knowledge
Identity. Rotation must not create a new participant or silently grant policy
authority.

### 13.2 Commitment mismatch

Every retrieved object is recomputed under the exact profile and context. A
provider ETag, SQL row ID, archive path, or transaction field alone is not proof
of the qualified byte identity.

### 13.3 Replay and stale state

Expected revision and fresh replay identity are mandatory. Duplicate or stale
effects fail closed, and ambiguity is reconciled before retry.

### 13.4 Partial failure

Storage preparation may succeed while Solana fails; Solana may finalize while
an observer is temporarily unavailable. The architecture preserves explicit
prepared, submitted, finalized, active, and reconciled states rather than
pretending those systems commit atomically.

### 13.5 Availability and recovery

One successful retrieval or local restore is not perpetual custody. Production
retention, independent failure domains, regions, RPO, RTO, off-host restore,
and operator recovery remain separately selected and tested concerns.

### 13.6 Irreversibility of learned knowledge

Removing membership or an envelope cannot revoke plaintext already learned.
Future licensing and access products must not claim otherwise.

### 13.7 Resource and dependency risk

Before a production candidate, the system still needs bounded input sizes,
request and connection controls, account-growth limits, parser fuzzing,
concurrency tests, dependency review, zeroization review, and independent
application/cryptographic assessment.

## 14. Current Product-Construction Frontier

The immediate frontier is **baseline integration**, not another external trial.
The main checkout and residue-closure worktree do not yet name one immutable,
dependency-closed candidate.

### 14.1 Runnable product construction

1. Freeze an exact source inventory across the intended KEP baseline.
2. Decide which residue-closure files belong in the main candidate while
   excluding `runtime/target/**`, `node_modules/**`, caches, temporary
   credentials, and unrelated dirty bytes.
3. Integrate candidate-013 EVF, refinement, exploration, and continuation model
   without importing historical external state as authority.
4. Repair root product-thesis drift or select an exact successor source.
5. Repair the Durable Storage DomainSpec value-object lint requirement and
   regenerate only governed outputs.
6. Re-author one exact hosted implementation binding over the intended current
   Rust, browser, SQL, assets, and deployment files.
7. Run product tests against that exact candidate and collect all dependent
   results.
8. Present the immutable product candidate and current tests for product-owner
   approval.

No operational authorization is needed to continue these local prototype
steps. None of them authorizes a deployment or protocol effect.

### 14.2 Causal construction blockers

| Blocker | Exact effect on construction |
| --- | --- |
| Main/residue split | Prevents one current source and evidence identity |
| Root product-thesis digest drift | Blocks the root KEP package validator |
| Hosted accepted-target drift | Makes implementation-dependent hosted checks `not_evaluable` |
| Durable Storage DomainSpec lint failure | Blocks current full D65 chain evaluation despite local runtime PASS |
| Missing finalized candidate observation | Leaves most reachable environment paths unsupported |

## 15. Operational Support and Deferred Residue

| Operational task | Owner | Affected stage | Current relation to construction |
| --- | --- | --- | --- |
| Off-host backup/restore and independent failure-domain proof | Durable Storage and operations owners | Hosted readiness | Open; does not block local baseline integration |
| VPS, DNS, TLS, firewall, monitoring, and incident rehearsal | Operations/security owner | Hosted readiness | Remote effect; separately authorized |
| Browser/wallet compatibility matrix | Hosted KEP owner | Product test/readiness | Runnable locally where environments exist |
| Fresh disposable credentials and funding | External-effect owner | Devnet trial | Deferred until exact approved candidate and envelope |
| Deployment continuation | External-effect and KEP product owners | Devnet observation | Not authorized by this guide |
| Fifteen-case A-to-B trial | KEP product/evidence owners | Product environment test | Requires completed exact deployment and separate authorization |
| White-paper reconciliation | Evidence/publication owner | Publication preparation | Locally runnable after source baseline; publication remains separate |
| Legal, novelty, market, licensing, and economic analysis | Respective product/legal/research owners | Successor product/publication | Does not block the no-price implementation prototype |

## 16. Recommended Closure Sequence

```text
L0  reconcile and freeze one exact source baseline
  -> L1 repair selected drift and build one testable product candidate
  -> L2 run current local product, security, storage, browser, and EVF tests
  -> L3 obtain product approval for the exact candidate
  -> L4 separately prepare hosted readiness and a disposable trial envelope
  -> L5 separately authorize and execute one bounded deployment/trial
  -> L6 reconcile external observations and independently review claims
  -> L7 update the white paper and make a separate publication decision
```

The next safe action is L0. Reusing historical credentials or continuing the
old deployment is not implied by the existence of a continuation plan.

## 17. Target Hosted Deployment Shape

The target, after product approval and separate operational decisions, is:

```text
participant browser/wallet
  -> TLS reverse proxy
  -> non-custodial Rust KEP API
       -> SQL-neutral operational port -> PostgreSQL reference adapter
       -> append-only recovery journal
       -> immutable SQL-independent archive
       -> finalized Solana RPC observer
  -> exact deployed Solana program
  -> monitoring and redacted evidence export
```

Production still requires explicit choices for topology, providers, program
upgrade posture, key custody, credential lifecycle, backup regions, RPO/RTO,
rate limiting, incident response, supported browsers/wallets, and monitoring.
The presence of Compose files, Dockerfiles, VPS scripts, or historical
deployment decisions does not prove that a current live deployment matches the
current source.

## 18. Architectural Decisions

| Decision | Reason | Trade-off |
| --- | --- | --- |
| Expand `{A}` to `{A,B}` | Models copyable knowledge honestly | Exclusive-transfer products need another model |
| Separate product brand from KEP | Keeps participant experience distinct from protocol semantics | Naming candidate needs its own governance and clearance |
| Separate stable identity from keys | Preserves identity through key replacement | Requires binding registries and validity checks |
| Keep plaintext and keys off-chain and out of the service | Protects confidentiality | Requires participant cryptography and off-chain durability |
| Store commitments on Solana | Bounds public state | Chain cannot guarantee artifact availability |
| Bind policy to exact version | Prevents silent rule changes | New policy requires successor version |
| Prepare storage before signing/submission | Avoids activating missing material | Can leave inactive prepared objects |
| Activate against finalized observation | Strengthens the first trial boundary | Adds latency and is still a bounded observation |
| Deny cross-system atomicity claim | Matches actual SQL/archive/chain behavior | Requires journals and reconciliation |
| Use behavioral storage ports | Keeps the product SQL-neutral | Every adapter must prove conformance |
| Treat lost key and compromise differently | Prevents unsafe reuse of compromised content keys | Compromise rotation is more expensive |
| Select formal providers by obligation | Avoids ceremonial TLC/Alloy/Lean requirements | Provider adequacy must be justified explicitly |
| Bind every decision to immutable bytes | Prevents moving-target approval | Any material change needs new tests and review |

## 19. Source Map

### Product meaning and brand

- [Product thesis](PRODUCT-THESIS.md)
- [Product package guide](README.md)
- [Working product-brand candidate](PRODUCT-BRAND-CANDIDATE.json)
- [Product definitions](authority/definitions/DEFINITIONS.md)

### Solana and encrypted durable protocol

- [Solana capability package](capabilities/solana-coownership/README.md)
- [Encrypted Durable Devnet Product Capability](capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/product-capability.json)
- [Encrypted Durable Devnet testing guide](capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/DEVNET-TESTING.md)
- [Cryptographic profile](capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/cryptographic-profile.json)
- [Durable Storage instantiation](capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/durable-storage-instantiation.json)
- [Rust workspace](runtime/Cargo.toml)
- [Solana program](runtime/solana-program/src/lib.rs)
- [Trial CLI](runtime/trial-cli/src/main.rs)

### Durable Storage

- [Durable Storage guide](capabilities/durable-storage/README.md)
- [Storage DomainSpec guide](capabilities/durable-storage/domainspec/README.md)
- [Storage runtime guide](capabilities/durable-storage/runtime/README.md)

### Hosted product

- [Hosted vertical guide](capabilities/hosted-devnet-exchange/v1/README.md)
- [Hosted construction plan](capabilities/hosted-devnet-exchange/v1/PLAN.md)
- [Hosted implementation guide](capabilities/hosted-devnet-exchange/v1/implementation/README.md)
- [Hosted deployment layering](capabilities/hosted-devnet-exchange/v1/deployment/IMPLEMENTATION-LAYERING.md)

### Evidence and publication

- [White paper](white-paper/v1/WHITE-PAPER.md)
- [Evidence matrix](white-paper/v1/EVIDENCE-MATRIX.md)
- [Claim ledger](white-paper/v1/CLAIM-LEDGER.md)
- [Implementation roadmap](white-paper/v1/IMPLEMENTATION-ROADMAP.md)

The current candidate-013 completion layering and its formal receipts live in
the unintegrated `codex/kep-residue-closure` worktree. They are intentionally
described here but not linked as if they were current main-checkout sources.

## 20. Claim Ceiling

This document establishes only a current, evidence-grounded architectural map.
It does not establish:

- one integrated or frozen KEP product candidate;
- current product approval;
- current acceptance of the hosted implementation bytes;
- complete Durable Storage D65 conformance;
- completed Solana program deployment;
- any A-to-B public-Devnet protocol submission;
- successful recipient decryption in the current hosted environment;
- production cryptographic security, availability, durability, RPO, or RTO;
- legal ownership, licensing, royalty, resale, or reputation rights;
- current live VPS equivalence to repository source;
- publication, release, deployment, credential use, RPC, signing, submission,
  Mainnet, or other external-effect authority; or
- evidence that users want or will pay for the product.

Those claims require exact current bytes, the evidence appropriate to each
property, their designated owners, and separate decisions.
