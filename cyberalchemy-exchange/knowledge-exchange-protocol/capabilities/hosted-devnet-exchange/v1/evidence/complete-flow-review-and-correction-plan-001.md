# Hosted KEP Complete Flow Review And Correction Plan 001

Status: planning candidate; not admitted, approved, implemented, deployed, or released  
Route: `CA2-ROUTE-PLAN`  
Review mode: UX Evidence Validator `spec`  
Target: `https://kep.cyberalchemylab.com/#explore`  
Reviewed: 2026-09-04  
Authority effect: none

## Outcome

The hosted Knowledge Expansion Protocol is capable of completing the intended
Devnet grant and reissue transitions, and its current implementation contains
meaningful cryptographic, finality, replay, and interruption protections. The
complete journey is not yet a safe, repeatable product test for a new user.

The limiting layer is the user-session model, not the Solana program. The UI
does not yet keep these concepts visibly and consistently separate:

```text
human operator
  -> selected protocol role (A or B)
  -> stable Knowledge Identity
  -> wallet authorization key
  -> encryption key version
  -> browser-held secret state
  -> exact artifact / policy / operation
```

That gap caused the live test to reuse the wrong identity state, produced an
opaque registration conflict, and made the browser-generated artifact and
policy identifiers impossible to bind to the prepared external test fixture
before any effect. The next product correction should therefore begin with an
explicit identity/session/preflight substrate, then rebuild the complete flow
on top of it.

## Evidence Boundary

### What is established by current evidence

- The live `/health` endpoint returned `status: ok`, network
  `solana-devnet`, program
  `ns5yjVYuX3bsaMWdG4pPF5hmajdD21xHDVLMbJUCeh1`, and
  `custody: ciphertext-only` on 2026-09-04.
- Current source defines separate share, receive, restore, and inspect flows.
- Browser cryptography tests cover recipient-envelope isolation and one Rust to
  browser interoperability vector.
- The error registry distinguishes wallet, transport, HTTP, JSON-RPC,
  transaction, instruction, KEP program, finality, hosted API, input, and
  cryptography layers.
- Reissue fulfillment persists a transaction signature before hosted
  reconciliation and can inspect that saved signature without submitting a
  second transaction.
- The server checks that a finalized reissue changes the recipient envelope and
  revision while preserving owners, policy, and encryption epoch.
- The completed live test proves one particular reissue path worked. It does
  not prove that the general browser journey is clear, durable, accessible, or
  repeatable for a fresh user.

### What this review does not establish

- It is not a WCAG conformance assessment.
- It is not a real-device, mobile-wallet, cross-browser, or assistive-technology
  result.
- It does not prove comprehension, trust, ease, or successful use by real
  participants.
- It does not approve changed product bytes or authorize deployment.
- It does not expand the protocol claim into legal ownership, licensing, or
  production readiness.

## Current Journey DAG

```text
                                  +----------------------+
                                  | Inspect public state |
                                  +----------^-----------+
                                             |
+---------+     +-----------------+     +-----+------+     +------------------+
| Choose  | --> | Establish role | --> | Do task    | --> | Export / handoff |
| task    |     | identity + key  |     | transition |     | public card      |
+----+----+     +--------+--------+     +-----+------+     +---------+--------+
     |                   |                    |                      |
     |                   |                    |                      |
     |      +------------v----------+         |          +-----------v--------+
     +----> | Share as A             |---------+--------> | B receives + opens |
            | seal -> init -> grant  |                    +-----------+--------+
            +------------------------+                                |
                                                                      v
            +------------------------+                    +--------------------+
            | Restore as B           | -- public card --> | Restore as A       |
            | new key -> request tx  |                    | fulfill -> reconcile|
            +------------------------+                    +----------+---------+
                                                                      |
                                                                      v
                                                           B opens revision + 1
```

The protocol edges are sounder than the entry edge. Every branch currently
inherits one shared `sessionStorage` object, one connected-wallet field, and
role state that can survive task switching. Hidden random artifact and policy
identifiers are created when Share starts. These facts make the entry edge the
highest-priority correction.

## Intended Journey DAG

```text
Start
  -> choose task
  -> choose A or B role
  -> choose fresh session or resume an exact saved session
  -> connect wallet and verify network
  -> select existing identity or create a new identity
  -> review and export a public preflight card
  -> freeze exact operation inputs
       |
       +-> A: seal -> review -> initialize -> B card -> grant -> reconcile
       |                                                     |
       |                                                     v
       |                                            finalized { A, B }
       |                                                     |
       +-> B: public identity card -> receive artifact -> authorize read -> open
       |                                                     |
       +-> B restore: new key -> request -> request tx ------+
       |                                                     |
       +-> A restore: verify request -> fulfill tx -> reconcile
       |                                                     |
       +-----------------------------------------------------+
                                                             v
                                     evidence center / resume / inspect
```

Every arrow crossing a participant, browser session, hosted write, or Solana
submission must have a public card, frozen identifier, or durable receipt. A
screen transition by itself is not evidence of that crossing.

## Fifteen Review Areas In Priority Order

| Priority | Area | Current finding | Required correction | Validation class |
| --- | --- | --- | --- | --- |
| P0.1 | Person, role, identity, wallet, and encryption-key model | The server permits multiple identity IDs to bind the same wallet, while the browser rejects the same wallet when both roles remain in one tab. Copy also says wallets must be independently controlled. A single human operating two test roles is not modeled explicitly. | Define the five concepts separately. Decide whether distinct identities require distinct wallets. For the proof trial, require two identities and state whether one human may control both. Enforce the same rule in definitions, client, server, and tests. | hard gate after owner decision |
| P0.2 | Session and role isolation | Share, receive, and restore reuse one state object, one wallet field, and remembered identities. Changing task does not start an isolated task session. | Add a session chooser: `Start fresh`, `Resume exact session`, and `Inspect only`. Bind each session to one task, role, identity ID, wallet, network, and generated session ID. Never silently inherit a conflicting role. | hard gate |
| P0.3 | New identity versus returning identity | Registration has only `POST /v1/identities`. An existing identity or operation returns one combined `409`, so a returning user cannot safely distinguish resume, exact replay, and collision. | Add an authenticated identity-resolution contract. Show `Create new identity` and `Use registered identity`; support exact-match idempotent recovery without converting a conflicting binding into success. Return distinct machine error codes. | hard gate |
| P0.4 | A-side public preflight | B can export an identity card, but A cannot export an equivalent public identity/preflight card before registration. Browser-generated artifact and policy IDs are hidden. | Before the first signature, show and copy/download a public-only preflight card containing session ID, role, identity ID, wallet, encryption public key/version, artifact ID, policy ID, epoch, network, program ID, and consideration. Exclude plaintext and all private/content keys. | hard gate |
| P0.5 | Exact operation freezing | Registration, artifact, grant, and reissue operation IDs are generated immediately before calls and are not reviewable or reusable as exact retry identities. | Materialize each operation as `draft -> frozen -> signed -> hosted prepared -> submitted -> finalized -> reconciled`. Show the frozen operation ID and digest before the wallet prompt. An uncertain effect resumes the same operation; it never mints a successor implicitly. | hard gate |
| P0.6 | Browser key durability | The UI correctly warns that keys stay in the tab, but the reissue flow depends on B keeping the exact replacement private key through A's later fulfillment. `sessionStorage` does not survive tab closure. | Provide an explicit encrypted backup/export or a clearly bounded same-tab test mode. The reissue request card must say whether the matching private key is currently recoverable. Block request submission if the chosen durability promise is not satisfied. | hard gate for declared mode; human review for wording |
| P0.7 | Error recovery and attempt lookup | Persistent errors are saved, but generic hosted conflicts collapse into `hosted_api_error`; operation kinds can become implementation-derived names; users cannot retrieve an attempt by ID from the public interface. | Preserve semantic operation kind at every call, add exact error codes for existing identity, operation replay, binding conflict, and state mismatch, and add a privacy-bounded attempt inspector with effect status, known signature, safe next action, and evidence timestamp. | hard gate |
| P0.8 | Deterministic two-party test fixture | Current unit tests validate primitives and source markers, but do not drive one complete A-to-B-to-reissue browser scenario. Browser random IDs cannot be bound to an external prepared fixture. | Add deterministic injectable IDs only in a test build/profile. Test two isolated browser contexts, exact cards, two wallets, hosted state, finalized/mock finality, B open, B reissue, A interrupted fulfillment, A resume, and B open at revision 2. | hard gate |
| P1.9 | Wallet and Devnet readiness | The UI identifies Devnet but does not preflight wallet network behavior, available balance, estimated fee/rent, or which actor pays each transaction. B may reach reissue submission with no SOL. | Before each transaction, show payer, network, balance, estimated fee/rent, expected account creation, and whether knowledge consideration is zero. A read-only readiness check may block before wallet signing; it grants no funding authority. | hard gate for network/payer; soft flag for estimate precision |
| P1.10 | Handoff-card lifecycle | Cards are schema-checked, but the UI does not show card digest, creation state, expiration/currentness, or whether a newer artifact/reissue revision supersedes it. | Give every card a canonical digest and purpose; show producer role, network, program, artifact/revision, and currentness check. Treat file and paste paths identically. Never accept private-key-shaped fields. | hard gate |
| P1.11 | Transaction interruption states | Reissue fulfillment now persists a submitted signature, but initialize, grant, and request-reissue do not expose the same durable stage model to users. | Apply the interruption-safe state machine to all effectful operations. On timeout or close, inspect by frozen operation/signature before permitting any new submission. Show `prepared`, `submitted`, `finalized`, and `reconciled` separately. | hard gate |
| P1.12 | Evidence center | Inspect currently returns a small hosted projection and local activity. It does not join public card, hosted preparation, Solana signature, finality, reconciliation, and local decrypt evidence. | Build a bounded evidence timeline keyed by artifact and operation. Clearly label source, timestamp, digest/signature, finality, and claim ceiling. Export public evidence separately from private local diagnostics. | hard gate for exact fields; screenshot review for presentation |
| P1.13 | Form and status accessibility | The persistent alert is a good start. Most errors are global rather than associated with the field or step; focus restoration, keyboard traversal, status announcements, and zoom/reflow are not browser-tested. | Add field-specific text, `aria-describedby`/`aria-invalid`, focus to the interrupted control or summary, non-duplicative live regions, logical headings, keyboard-only operation, 200% zoom and 320 CSS px reflow tests, and reduced-motion checks. | standards-backed hard gates plus manual AT residue |
| P2.14 | Mobile, cross-device, and localization | The flow assumes a desktop injected Phantom provider and same-tab state. Copy localization exists, but dynamic protocol/error copy and card movement across mobile devices are not comprehensively validated. | Define supported wallet surfaces and handoff methods. Test mobile deep-link or explicitly mark it unsupported. Test every state in EN and PT-BR with long values and narrow viewports. Keep cross-device key transfer out of scope unless encrypted transfer is designed. | soft flag until support matrix is owner-confirmed |
| P2.15 | Privacy, retention, and destructive recovery | `Clear session` warns of irreversible key loss, but the product does not enumerate what remains in browser, hosted SQL, error journal, Solana, downloads, and backups. | Add a data-residency summary before first effect and at clear/export. Define retention, backup, deletion limits, secret redaction, diagnostic access, and the exact consequences of clearing local state. | hard gate for secret exclusion; policy decision for retention |

## Scene Contract

Each scene should answer five questions without exposing implementation detail:

1. **Where am I?** Task, actor role, identity, and step.
2. **What will happen?** Local computation, signed message, hosted write, Solana
   transaction, or read-only inspection.
3. **What exact data is involved?** Human-readable summary plus expandable exact
   identifiers and canonical digest.
4. **What can this change?** Owners, revision, key binding, fees, or no protocol
   state.
5. **How do I safely continue after interruption?** Same operation, signature,
   card, or session receipt.

The minimalist visual language should keep one primary action per scene, one
short boundary label, and progressive technical disclosure. Minimalism must
not hide identity, payer, network, operation, or effect.

## Product Construction Plan

### Current construction frontier

The interruption-safe reissue deployment is historical evidence for the exact
deployed candidate. This review identifies a materially revised product. Its
frontier returns to **prototype definitions** for the identity/session/preflight
correction. No changed implementation candidate exists yet.

### Runnable construction now

1. Author definitions for `HumanOperator`, `ProtocolRole`, `KnowledgeIdentity`,
   `WalletAuthority`, `EncryptionKeyBinding`, `ClientSession`,
   `FrozenOperation`, `PublicPreflightCard`, and `RecoveryReceipt`.
2. Resolve the same-human/same-wallet rule and the supported key-durability
   mode as explicit owner decisions.
3. Extend product and business ontology scaffolds with the actor-to-identity,
   identity-to-wallet, identity-to-key-version, session-to-role, and
   operation-to-effect-state relations.
4. Describe the four flows and interruption transitions in DomainSpec v2,
   including changed, preserved, and forbidden fields at every effect.
5. Compile the state machine into the system-ontology scaffold and interface
   contracts.
6. Implement the smallest P0 slice: isolated session entry, identity
   resolution, A public preflight export, frozen operations, and semantic
   errors.
7. Add the deterministic two-context browser fixture before broader visual
   refinement.
8. Produce one exact product candidate, run current product tests, then ask the
   product owner for product approval. Deployment remains a later, separate
   decision.

### Candidate implementation surfaces

These are proposed targets, not mutation authority:

- `implementation/ui-src/app.js`: session entry, role isolation, preflight,
  frozen-operation state, semantic recovery, and scenes.
- `implementation/ui-src/protocol.js`: canonical card/digest helpers and
  interruption-state helpers.
- `implementation/ui-src/errors.js` and `implementation/error-registry/v1.json`:
  exact conflict/recovery meanings.
- `implementation/src/api.rs`, `implementation/src/model.rs`, and
  `implementation/src/store.rs`: identity resolution, idempotency, attempt
  inspection, and durable operation state.
- `implementation/ui-src/app.test.js`: deterministic state and cross-client
  contract tests.
- a new browser scenario package under `implementation/ui-src/` or
  `implementation/tests/`: two isolated contexts and full flow evidence.

## Operational Support Lane

| Task | Owner | Affected construction stage | Blocking basis | State |
| --- | --- | --- | --- | --- |
| Provide a Linux-native Node runner or a containerized UI test command; current `npm` resolves through Windows and fails on the WSL UNC path | development environment owner | product-test | Exact browser/unit validation prerequisite after implementation, not a definitions blocker | pending |
| Add a conventional `test` script that invokes the declared check suite | implementation owner | product-test | Test discoverability and CI consistency; not a definitions blocker | proposed |
| Prepare disposable Devnet A/B wallets with bounded SOL | Devnet trial owner | post-approval live trial | Required only for an authorized live trial | deferred |
| Prepare VPS image, database backup envelope, and one-attempt deployment envelope | deployment owner | deployment only | Operational effect requires separate product approval and deployment authority | deferred |
| Retain or purge test identities, attempts, and local secret fixtures | data/credential owner | no construction stage unless fixtures are selected as current evidence | Privacy and destructive-action boundary | decision required |

The first two tasks may become exact prerequisites for product-test execution.
The remaining operational tasks do not block definition, ontology, DomainSpec,
or local implementation prototypes.

## Test Contract

### Deterministic hard gates

- A fresh session contains no identity, wallet, role, artifact, or operation
  inherited from another session.
- Resume requires an exact session receipt and shows its bound role, identity,
  wallet, network, and pending effect before any action.
- Client and server enforce one owner-selected wallet/identity multiplicity
  rule.
- Public preflight export is available before the first signature and contains
  no private key, content key, or plaintext.
- Exact card digest is stable across copy, download, paste, and file upload.
- An existing exact identity is distinguishable from a conflicting identity.
- Every effectful operation has a stable operation ID before signing.
- No automatic retry occurs after a possible submission.
- A saved signature is inspected before any successor submission is enabled.
- Initialize, grant, request-reissue, and fulfill-reissue each expose finalized
  and hosted-reconciled as distinct states.
- A cannot grant or fulfill while the connected wallet differs from the frozen
  A binding; B cannot request or open under a mismatched B binding.
- The two-party fixture proves `{ A } -> { A, B }`, B decryption at revision 1,
  envelope-only reissue, unchanged artifact/policy/epoch/owners, revision 2,
  and B decryption with only the replacement private key.
- Every invalid field or card has a textual error associated with the
  interrupted control and a known safe correction where one exists.
- Error evidence excludes plaintext, private keys, content keys, and unredacted
  wallet payloads.
- Clear-session requires confirmation and accurately enumerates unrecoverable
  local state.

### Browser evidence matrix

Required evidence for the product candidate:

| Dimension | Minimum |
| --- | --- |
| Browsers | Chromium plus one independent engine |
| Contexts | isolated A and B contexts; fresh and resumed A context |
| Viewports | desktop, 320 CSS px reflow, and one real or emulated mobile viewport |
| Input | pointer, keyboard only, paste, and JSON file upload |
| States | loading, empty, validation error, wallet rejection, hosted conflict, blockhash expiry, submitted/finality unknown, finalized, reconciliation interruption, resumed success |
| Content | empty, typical, maximum allowed encrypted payload boundary, long identity, EN, and PT-BR |
| Evidence | screenshots, trace, accessibility snapshot, ARIA snapshot, console/network summary, final state/card digests, and residue ledger |

### Soft flags and human-study residue

- Whether the terms identity, owner, envelope, epoch, and revision are
  understood by first-time users.
- Whether the distinction between a signed message and a transaction is trusted
  and remembered.
- Whether the two-person handoff feels manageable on real devices.
- Whether the warnings are calm and useful rather than alarming.
- Whether the minimalist density remains legible with long keys and localized
  copy.

These are not deterministic release gates until backed by an owner-confirmed
product requirement and appropriate user evidence.

## External Evidence Cards

1. W3C WCAG 2.2, Error Identification:
   <https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html>.
   Allowed use: require textual identification of detected input errors.
2. W3C WCAG 2.2, Error Suggestion:
   <https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html>.
   Allowed use: require a known correction suggestion when security does not
   prohibit it.
3. W3C WCAG 2.2, Status Messages:
   <https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html>.
   Allowed use: design non-focus status announcements. Browser and AT testing
   remains required.
4. W3C WCAG 2.2, Error Prevention (Legal, Financial, Data):
   <https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html>.
   Allowed use: require review and confirmation before consequential or
   difficult-to-reverse actions. This reference does not assert that KEP grants
   legal ownership.
5. Solana, Transaction Confirmation and Expiration:
   <https://solana.com/developers/cookbook/transactions/confirmation>.
   Allowed use: motivate fresh-blockhash construction and explicit expiry,
   submission, and finality states.
6. Solana, Sign and Verify a Message:
   <https://solana.com/developers/cookbook/wallets/sign-message>.
   Allowed use: explain cryptographic message authorization separately from a
   submitted transaction.

External guidance supplies scenarios and standards-backed expectations. It
does not approve the product or authorize a hard gate beyond an exact product
contract and calibrated fixture evidence.

## Review Validation

- Live health: PASS on 2026-09-04.
- Live HTML markers: PASS for task journey, persistent error panel, and Devnet
  labeling.
- Source-to-review trace: PASS for flow list, session storage, hidden artifact
  and policy IDs, B-only identity-card export, combined registration conflict,
  interruption-safe reissue fulfillment, and current tests.
- `npm test`: BLOCKED because no `test` script exists.
- `npm run check:ui`: NOT EVALUABLE in this environment because the selected
  `npm`/`node` path crosses into Windows `CMD.EXE`, which rejects the WSL UNC
  working directory before loading `ui-src/app.test.js`.
- Playwright evidence: NOT RUN. The current UX Evidence Validator skill is a
  seed contract and no calibrated browser fixture was selected for this review.
- Fixture calibration: NOT RUN.

## Completion Criteria For This Plan

This planning candidate is complete when it identifies the full journey,
prioritizes the observed risks, separates deterministic gates from human-study
claims, exposes product construction and operational support independently,
and defines a D65-compatible path to one new tested product candidate.

The next lifecycle step is **definition authoring for the P0 identity/session/
preflight correction**, followed by ontology scaffolds and DomainSpec—not
immediate implementation or deployment.

## Claim Ceiling

This document is an evidence-backed planning candidate. It records current
findings and proposes a correction sequence. It does not prove the current UI
unusable, establish accessibility conformance, change protocol semantics,
approve requirements, authorize implementation, approve a product candidate,
admit an ontology, or authorize publication, release, deployment, credentials,
funding, hosted writes, or Solana transactions.
