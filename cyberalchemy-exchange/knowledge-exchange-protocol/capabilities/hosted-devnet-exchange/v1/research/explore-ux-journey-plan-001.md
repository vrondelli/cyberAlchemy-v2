# KEP Explore UX Journey Plan 001

Status: research-backed design candidate  
Target: `https://kep.cyberalchemylab.com/#explore`  
Route: `CA2-ROUTE-RESEARCH`  
Authority effect: none  
Implementation and deployment authority: none

## Outcome

Replace the current six chapter-like carousel scenes with role-specific,
single-purpose scenes. Each scene asks for one meaningful human decision,
entry, confirmation, or action. Generated and read-only protocol fields are
shown as results or optional technical details; they do not become separate
form tasks merely because they exist in the data model.

The primary journey is the no-price transfer of encrypted knowledge from A to
B while A remains an owner. Reissue and evidence inspection become separate
tasks instead of mandatory steps in that happy path.

## Evidence boundary

Observed in the live interface on 2026-09-03:

- The interface has six broad scenes: identity, artifact, grant, access,
  reissue, and evidence.
- The identity scene combines role choice, wallet state, knowledge identity,
  encryption-key creation, registration, and card export.
- The artifact scene combines plaintext entry with editable artifact ID,
  policy ID, and encryption epoch.
- `Continue` can move to later chapters before the current prerequisite is
  satisfied.
- A and B share one persistent role toggle even though they act in different
  browser sessions and own different steps.
- Raw JSON handoff cards are the main cross-person interaction.
- Reissue, an exceptional recovery path, appears as step 5 of the primary
  exchange.
- The red next button is visually prominent. Color preference is a review
  question, not a deterministic defect, but normal progress, errors, and
  high-consequence actions need distinguishable visual semantics.

External guidance used as planning evidence:

1. GOV.UK Question Pages recommends beginning with one question per page,
   explaining why information is requested, preserving answers on Back, and
   avoiding repeated entry:
   https://design-system.service.gov.uk/patterns/question-pages/
2. W3C WAI Multi-page Forms recommends logical smaller stages, clear progress,
   repeated overall context, and access to completed steps:
   https://www.w3.org/WAI/tutorials/forms/multi-page/
3. USWDS Step Indicator treats the indicator as orientation for high-level
   chapters—not navigation—and requires a separate heading and Back/Next
   controls:
   https://designsystem.digital.gov/components/step-indicator/
4. W3C Error Prevention requires an opportunity to check, correct, or confirm
   consequential transactions before final submission:
   https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html
5. GOV.UK Check Answers recommends an explicit review screen with specific
   action wording immediately before a consequential submission:
   https://design-system.service.gov.uk/patterns/check-answers/
6. W3C User Notification requires clear, concise success and error feedback,
   with useful repair instructions:
   https://www.w3.org/WAI/tutorials/forms/notifications/
7. Phantom documents wallet connection as an explicit permission request that
   may be accepted, rejected, or closed:
   https://docs.phantom.com/solana/establishing-a-connection
8. Solana Mobile recommends connecting/signing from direct user actions and
   using descriptive wallet choices on mobile:
   https://docs.solanamobile.com/get-started/web/ux-guidelines

These sources support structure and test scenarios. They do not prove that
real KEP users will understand, trust, or complete the exchange; those claims
remain user-research questions.

## Journey architecture

```text
Explore
  -> Choose a task
      -> Share knowledge as A
      -> Receive knowledge as B
      -> Restore access
      -> Inspect an exchange

Share as A
  -> Identity
  -> Knowledge
  -> Seal locally
  -> Create on Devnet
  -> Add B
  -> Confirm grant
  -> Finality + handoff

Receive as B
  -> Identity
  -> Send identity card to A
  -> Resume from A's artifact card
  -> Verify access request
  -> Retrieve + decrypt locally
  -> Confirmation

Restore access
  -> B requests a replacement key envelope
  -> A verifies and fulfills the request
  -> Finality confirms envelope replacement

Inspect an exchange
  -> Enter or import artifact reference
  -> Read bounded public state
```

### Chapters versus scenes

Use the visible progress indicator for stable high-level chapters. Use
`Step x of y` in the scene heading for the current role-specific micro-flow.
Do not place every micro-scene in a wide desktop progress rail.

Suggested chapters:

```text
Identity -> Knowledge -> Recipient -> Confirm -> Complete
```

The chosen task and role determine the micro-scenes inside those chapters.

## Entry scene: choose the user's task

Question: **What do you want to do?**

- Share knowledge — “I am A. I have knowledge to encrypt and share.”
- Receive knowledge — “I am B. I need to create my access identity or open an artifact.”
- Restore access — “B lost access and needs a replacement envelope.”
- Inspect an exchange — “I have an artifact reference and only want to view public state.”

Do not connect a wallet before the user chooses a task. Explain that the
service is on Devnet and does not use Mainnet SOL.

## Journey A: share knowledge

| Scene | User-facing heading | Primary input or action | Just-in-time explanation | Completion state |
| --- | --- | --- | --- | --- |
| A1 | Connect the wallet that will represent A | `Connect Solana wallet` | “Your wallet proves which participant authorized each operation. This trial uses Devnet.” | Wallet address shown; rejection remains recoverable. |
| A2 | Name this knowledge identity | Knowledge identity | “This is a protocol name, not your legal identity. Example: `research-team-a`.” | Valid identity retained. |
| A3 | Create the key that protects access | `Create encryption key` | “The public key may be shared. The private key remains in this browser tab.” | Key-created confirmation; public-key preview under Technical details. |
| A4 | Register A's identity | Review card + `Sign identity registration` | “This signs a one-purpose message. It does not create a Solana transaction or spend SOL.” | Registered identity; downloadable public card. |
| A5 | What knowledge are you sharing? | Knowledge textarea | “Encryption happens in this browser. Plaintext is not sent to the service.” | Non-empty content retained locally. |
| A6 | Review how this artifact will work | No editable technical inputs | “A remains an owner. The first recipient will be added for 0 SOL. Only ciphertext and commitments leave this browser.” | Explicit acknowledgement of the data boundary. |
| A7 | Seal the knowledge locally | `Encrypt knowledge` | “This creates ciphertext, commitments, and an encryption envelope locally.” | Sealed summary; plaintext hidden by default but editable via Back. |
| A8 | Review the Devnet artifact | Summary + change links | Show network, A identity, owner set `{ A }`, price `0 SOL`, plaintext boundary, and estimated wallet effect. Artifact ID, policy ID, and epoch live under Technical details and are generated automatically. | Review confirmed. |
| A9 | Create the artifact on Devnet | `Create artifact on Devnet` | “Your wallet will ask you to approve one Devnet transaction.” | Submitted state with signature and finality progress. |
| A10 | Add B's identity | Upload/paste B's public identity card | “This card contains public identity material only. We will show you B before anything is submitted.” | Parsed human-readable B summary; raw JSON stays collapsed. |
| A11 | Check the access grant | Review + change B | “A keeps access. B becomes an additional owner. Price: 0 SOL. B receives a recipient-specific encrypted envelope.” | Explicit confirmation enabled. |
| A12 | Grant B access on Devnet | `Grant B access on Devnet` | “Your wallet will ask you to approve one grant transaction.” | Transaction signature shown; waiting for finalized observation. |
| A13 | Share the finalized artifact with B | Download/copy artifact card | “The owner set is now `{ A, B }`. Send this public card to B. Never send your private encryption key.” | Receipt saved; clear `Start another exchange` and `Inspect evidence` choices. |

## Journey B: receive knowledge

| Scene | User-facing heading | Primary input or action | Just-in-time explanation | Completion state |
| --- | --- | --- | --- | --- |
| B1 | Connect B's wallet | `Connect Solana wallet` | “Use a wallet controlled independently from A.” | B wallet shown. |
| B2 | Name B's knowledge identity | Knowledge identity | Same protocol-name explanation as A. | Valid B identity retained. |
| B3 | Create B's access key | `Create encryption key` | “A will encrypt B's envelope to this public key. The private key stays in this browser tab.” | Key-created confirmation. |
| B4 | Register B and send the public card to A | `Sign identity registration`, then copy/download | Clarify that message signing is not a paid transaction. | Public identity card exported. |
| B5 | Continue when A sends the artifact card | Upload/paste artifact card | Replace the generic waiting chapter with a resumable handoff screen. | Parsed artifact summary. |
| B6 | Check what you are opening | Review only | Show artifact reference, A, current owner set, revision, Devnet, and the fact that decryption occurs locally. | Access request enabled. |
| B7 | Retrieve and decrypt | `Sign access request` | “The signature authorizes this read. It does not transfer SOL.” | Ciphertext and active envelope retrieved; local decryption attempted. |
| B8 | Knowledge opened in this browser | Plaintext result + receipt | “Only this browser recovered plaintext. Public state proves the bounded grant, not legal ownership or licensing.” | Save/copy result and inspect evidence options. |

## Recovery journey: reissue access

Keep recovery outside the primary exchange progress.

```text
B1 Select/import artifact
 -> B2 Create replacement key
 -> B3 Review what changes and what does not
 -> B4 Submit reissue request on Devnet
 -> B5 Send public reissue card to A
 -> A1 Import and verify B's request
 -> A2 Review envelope-only replacement
 -> A3 Fulfill on Devnet
 -> Finality: owner set, artifact, policy, and epoch unchanged
```

The confirmation must state: B's envelope and revision change; the owner set,
artifact bytes, propagation policy, and encryption epoch do not.

## Evidence journey

Evidence inspection is a separate read-only task:

1. Enter an artifact ID or import an artifact card.
2. Show whether the record was found.
3. Present owner set, revision, transaction signatures, and finality as a
   human-readable timeline.
4. Put raw JSON and technical identifiers under **Technical evidence**.
5. Repeat the claim ceiling: this is protocol state, not legal title,
   licensing, publication, or production-readiness evidence.

## Scene component contract

Every scene should contain, in this order:

1. **Context:** task, role, Devnet badge, and `Step x of y`.
2. **Question or action heading:** one sentence, phrased in the user's language.
3. **Why this is needed:** one or two sentences before the control.
4. **One primary input or action.** Closely coupled controls may remain together
   only after user testing supports the grouping.
5. **Data-boundary note:** `Stays in this browser`, `Public card`, `Sent as
   ciphertext`, or `Recorded on Devnet`.
6. **Back** and one action-specific forward button.
7. **Technical details** disclosure for IDs, hashes, keys, revision, and raw
   cards.

Never label an on-chain action `Continue`. Use its effect:

- `Create artifact on Devnet`
- `Grant B access on Devnet`
- `Request replacement access on Devnet`
- `Fulfill B's reissue on Devnet`

## What should no longer be editable by default

- Artifact version ID: generate automatically.
- Propagation policy ID: bind to the selected no-price policy automatically.
- Encryption epoch: derive as `1` for creation and from current state later.
- Expected revision: derive from finalized public state.
- Encryption public key: show as a result, not an empty-looking field.
- Connected wallet: show as identity/status, not a text input.

Advanced testing may expose overrides behind a clearly marked **Developer
options** switch that is absent from the normal journey.

## Handoff design

Replace raw JSON textareas as the primary interaction with:

- `Choose card file`
- `Paste card`
- `Copy secure handoff text`
- `Download public card`

After import, validate the card and render a human summary before enabling the
next action. Show card kind, participant, wallet abbreviation, artifact
abbreviation, revision, and what the card permits. Keep **View raw JSON** as a
secondary disclosure.

Do not call the card “secure” without qualification: it is public transport
material and contains no private encryption key.

## Visual hierarchy and color

- Keep one dominant action per scene.
- Use the same neutral primary treatment for ordinary progress.
- Give transaction actions a distinct “crosses onto Devnet” treatment that
  includes text and iconography, not color alone.
- Reserve the error treatment for actual errors. If brand red remains the
  normal CTA color, errors need a second unambiguous visual vocabulary.
- Completed, current, and pending progress states need text/ARIA semantics in
  addition to color.

Whether users interpret the current red next button as danger is a
`screenshot_review` and user-study question, not a hard failure.

## State and interruption behavior

- Back restores the exact previous answer.
- Browser Back follows the scene history without repeating a one-time action.
- Upcoming scenes are not directly actionable; explain which prerequisite is
  missing.
- Completed scenes may be reviewed, but a finalized transaction cannot be
  submitted again.
- Before key creation, explain the tab-lifetime constraint.
- After creating a private encryption key, warn before actions that would lose
  access. Durable encrypted key export is a future capability and must not be
  invented as a UI-only feature.
- Handoff scenes must provide a clear resume path for the other participant.

## Feedback states

Every action has explicit states:

```text
ready -> waiting for wallet -> submitted -> awaiting finality -> finalized
  \-> rejected by user
  \-> failed before submission
  \-> submitted but outcome unknown
```

Never collapse `submitted but outcome unknown` into failure or silently retry.
Show the transaction signature as soon as it exists and provide a read-only
`Check status` action.

Errors must:

- retain the user's input;
- identify the specific field or action;
- explain how to repair it;
- move focus to an error summary or the affected control;
- remain available to assistive technology instead of relying only on a
  transient toast.

## Priority plan

### P0 — fix the journey model

1. Add task selection before wallet connection.
2. Split A, B, recovery, and evidence into separate routes/state machines.
3. Make one meaningful field or action the focus of each scene.
4. Prevent advancing until the current prerequisite is complete.
5. Move reissue out of the happy path.
6. Auto-generate protocol IDs and hide them under Technical details.

### P1 — make handoffs and transactions understandable

1. Replace raw-card-first textareas with import/export actions and summaries.
2. Add review screens before each Devnet transaction.
3. Use action-specific button labels.
4. Show wallet rejection, submission, ambiguous outcome, finality, and success
   as distinct states.
5. Add a completion receipt with a clear next action.

### P2 — accessibility and resilience

1. Implement semantic progress and focus movement.
2. Add persistent inline errors plus an error summary.
3. Preserve Back/browser-Back state safely.
4. Verify keyboard-only, 200% zoom, reduced motion, 390px mobile, wallet
   rejection, slow finality, and network interruption.
5. Make the session-key loss warning explicit and test comprehension.

### P3 — validate with people

Run moderated tests with at least paired A/B participants. Observe whether they
can complete a handoff without the facilitator explaining JSON, keys,
ownership, or finality.

## Browser-verifiable acceptance checks

These are candidate hard gates after implementation and fixture calibration:

- One scene exposes no more than one primary editable concept.
- The heading includes the current task and `Step x of y` in accessible text.
- The progress component identifies current and completed chapters without
  color-only meaning.
- Next/primary action cannot skip an unmet prerequisite.
- Back and browser Back preserve non-sensitive answers and do not repeat
  transactions.
- Generated IDs, policy, epoch, and revision are not editable in the normal
  journey.
- Every input has a programmatic label and associated instructions.
- Invalid submission retains values and focuses a persistent error summary.
- Wallet rejection returns to a recoverable scene state.
- Every on-chain action is preceded by a human-readable review and uses an
  effect-specific label.
- Transaction states distinguish pre-submit failure, rejection, submitted,
  unknown outcome, and finalized.
- No automatic retry occurs after a transaction may have been submitted.
- Handoff-card import rejects malformed/wrong-kind cards and presents a
  human-readable summary for valid cards.
- Keyboard focus moves to the new scene heading after navigation.
- Status changes are announced through an appropriate live region.
- The flow remains usable at 390px width, 200% zoom, and reduced motion.

## Soft flags and screenshot review

- More than one visually dominant action in a scene.
- Help text competes with the primary question.
- Technical language appears before the user needs it.
- Red normal-progress controls are confused with errors or irreversible risk.
- Ownership and data-boundary summaries are visually separated from the
  action they explain.
- Mobile users lose task/step context after scrolling.

These should prompt review, not mechanically block release without calibrated
fixtures and owner-promoted thresholds.

## Human-study residue

Browser automation cannot prove that users:

- understand the difference between wallet authority and encryption access;
- understand that A remains an owner after B is added;
- understand that `0 SOL` means no-price, not no network fee;
- understand what leaves the browser;
- trust a public handoff card without mistaking it for a private key;
- can coordinate the A/B handoff across two people and browser sessions;
- understand finalized protocol state versus legal ownership or licensing;
- perceive the red CTA as brand emphasis rather than danger.

Suggested success questions after the task:

1. “Who can access the artifact now?”
2. “What information left your browser as plaintext?”
3. “What did the wallet approve?”
4. “What would change during a reissue?”
5. “What does the Devnet evidence prove—and what does it not prove?”

## Definition of ready for implementation

Before UI mutation, the product owner should approve:

- the four entry tasks;
- the A and B scene order;
- which values are generated versus user-controlled;
- exact transaction review facts;
- the handoff transport supported in v1;
- the tab-lifetime/private-key warning;
- whether brand red remains a normal CTA color.

After those decisions, author the UX Product Capability and capability-local
business ontology revision, then DomainSpec v2 source, compiled system
ontology, exact implementation binding, and browser conformance evidence.

