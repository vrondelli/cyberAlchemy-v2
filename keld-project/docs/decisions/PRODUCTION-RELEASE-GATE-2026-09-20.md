# KELD and ARE production release decision gate

- **Status:** BLOCK
- **Prepared:** 2026-09-20
- **Scope:** first production release of the KELD storefront, identity service,
  three-provider checkout, artifact delivery, and public ARE chat
- **Authority:** product, merchant, security, license, and operations owners
- **Current technical baseline:** schema-v3 r23 staging manifest

This record isolates the owner choices that the implementation cannot safely
infer. It does not authorize production deployment. A selection is effective
only when the named owner supplies it explicitly; silence is not consent.

## Decisions already established

| ID | Decision | Scope and evidence |
| --- | --- | --- |
| R1 | Use `staging.keld.studio`, `auth.staging.keld.studio`, and `are.keld.studio` for the current public staging system. | Live route and monitor evidence; this does not reserve the same topology for production. |
| R2 | Serve ARE at `/`; redirect exact `/are` and `/are/` to `/`. | Current edge behavior and owner direction. |
| R3 | Keep ARE anonymous-public for the presentation/staging period. | Presentation decision only; long-lived production policy is D4 below. |
| R4 | Use a merchant-fixed 5.10 BRL/USD quote for new checkouts with reference `merchant-fixed-5.10` and no expiry. | Bound by r23; changing it requires a new manifest. |
| R5 | Preserve provider-confirmed Stripe, Mercado Pago, and PayPal purchase/download evidence. | Privacy-safe r23 receipt; genuine Mercado Pago and PayPal webhook recovery remains separate. |

## Blocker decisions

### D1 — Production identity image

**Owner:** security and license owners  
**Blocks:** exact production candidate, identity canary, final manifest

| Option | Benefit | Cost or risk | Downstream impact |
| --- | --- | --- | --- |
| D1-A — Wait for a supported upstream image that passes the same raw scan and regression surface | Preserves upstream support and minimizes local dependency ownership | Delays production; no delivery date is guaranteed | Rebuild, raw-scan, restore-rehearse, and rerun signup/session isolation before candidate freeze |
| D1-B — Accept the rehearsed Bouncy Castle 1.85 downstream overlay | Removes both Bouncy Castle findings now and already has restored-state/browser evidence | KELD owns a downstream security update and support boundary; three raw findings still require exact dispositions | Security owner must approve or revise the exact-subject VEX proposal; license owner must accept the unchanged notice inventory; then canary the exact candidate |
| D1-C — Keep stock Keycloak 26.7.4 and accept all five raw findings | Smallest runtime change and fully upstream-built image | Greatest known raw-finding exposure; requires a documented bounded-affectedness acceptance | Bind signed owner dispositions to the stock digest and retain raw scan visibility |

**Selection:** unresolved. No option is selected by this document.

### D2 — First-release account onboarding

**Owner:** product and security owners  
**Blocks:** production realm configuration and browser acceptance

| Option | Benefit | Cost or risk | Downstream impact |
| --- | --- | --- | --- |
| D2-A — Invite-only first release; disable public self-registration and recovery | Avoids launching an unverified public email/recovery surface; smallest safe first-release boundary | Manual onboarding; users cannot self-recover | Apply a reversible realm change, verify invite/login/logout/session renewal, publish support recovery procedure |
| D2-B — Public signup with verified email, password recovery, SMTP, and explicit signup abuse controls | Complete self-service customer journey | Requires an approved SMTP provider, sender identity, bounce/abuse handling, rate limits, and recovery support | Configure private SMTP credentials; enable verification/reset; add abuse and browser regression evidence |
| D2-C — Public signup without email verification or recovery | Fastest and matches current staging behavior | Unverified identities, weak recovery, higher abuse/support risk | Not admissible for production under the current security plan without an explicit security-owner override |

**Selection:** unresolved. D2-A is the smallest production-capable first-release
scope; it is a recommendation, not an owner decision.

### D3 — Refund, dispute, and future-access behavior

**Owner:** product and merchant owners  
**Blocks:** post-payment transitions and the final provider-event allowlists

Facts that apply to every option:

- bytes already downloaded cannot be recalled;
- provider observations alone never authorize a refund API call; the separately
  selected checkout D2-C policy requires exact verified late-payment evidence,
  an idempotent refund command, and outcome reconciliation;
- ambiguous, partial, conflicting, or unbound events remain in audited review;
- an authenticated event alone cannot change entitlement without current
  provider-state verification and an explicit policy transition.

| Option | Benefit | Cost or risk | Downstream impact |
| --- | --- | --- | --- |
| D3-A — Revoke future unused download grants and future support after a verified full refund or lost dispute; review partial refunds and ambiguity without automatic revocation | Balanced default with a narrow automated consequence | Requires entitlement/review transitions and customer messaging | Implement idempotent revocation, retain audit, test late/duplicate events, then narrow each provider allowlist to the required settlement/refund/dispute classes |
| D3-B — Keep future download access after every refund/dispute | Simple and customer-friendly | Enables refund-and-retain abuse and weakens commercial controls | No automatic revocation; still ingest events for audit/support and disclose the policy |
| D3-C — Revoke future access after any nonzero refund or dispute | Strongest revenue protection | Partial refunds can remove all access and create support/legal friction | Implement immediate idempotent revocation for full and partial refund classes and make the consequence prominent before purchase |

**Selection:** D3-A, confirmed by the owner in this task on 2026-09-21 at
18:50 UTC. Partial refunds go to review without automatic revocation. This
selection unblocks construction of D3's candidate transitions, not activation
or the separate final production release gate.

### D4 — Long-lived ARE access and data policy

**Owner:** product and security owners  
**Blocks:** production ARE configuration, privacy copy, and abuse-response runbook

| Option | Benefit | Cost or risk | Downstream impact |
| --- | --- | --- | --- |
| D4-A — Continue anonymous-public chat with bounded source-address admission, 1,800-second process-memory retention, approved token/call/spend ceilings, and a dated review | Preserves the public demo and lowest-friction evaluation | Source addresses are imperfect identity; public model spend and abuse remain possible | Approve exact ceilings and proxy trust boundary, publish provider/retention notice, test rate behavior, alert on budget exhaustion, set review date |
| D4-B — Require an authenticated KELD session for live model calls | Stronger abuse attribution and per-account controls | Adds identity coupling and blocks anonymous trials | Design a least-privilege token exchange without giving ARE commerce authority; add login/session/privacy acceptance |
| D4-C — Keep documentation public but disable live model calls | Lowest spend and abuse exposure | Removes the interactive product demonstration | Deploy configured-unavailable chat state and update copy/monitor expectations |

**Selection:** unresolved for production. R3 selects D4-A only for the current
presentation/staging period; it does not approve permanent anonymous operation.

### D5 — Backup custody, retention, RTO, and RPO

**Owner:** operations and security owners  
**Blocks:** recoverability acceptance and public rollback drill

| Option | Benefit | Cost or risk | Downstream impact |
| --- | --- | --- | --- |
| D5-A — Independent key custodian, encrypted off-site object storage, documented retention, target RPO 24 hours and RTO 4 hours | Clear separation of ciphertext and recovery authority; measurable first-release target | Requires a custodian, destination, lifecycle policy, and timed drills | Schedule backup, prove independent decrypt/restore, measure full-service recovery, then perform bounded traffic cutover/rollback |
| D5-B — Two-person manual off-site custody with the same explicit RPO/RTO | Avoids a new storage automation dependency | More operator effort and greater missed-backup risk | Define handoff cadence, dual custody, verification log, and escalation for missed copies |
| D5-C — Retain only the present operator-controlled copies | No immediate setup cost | No independently controlled recovery key, approved retention, or enforceable RPO | Not admissible for production under the current recovery plan |

**Selection:** unresolved. The numeric targets in D5-A/B are proposed first-
release bounds and require owner confirmation.

### D6 — External health alerting

**Owner:** operations owner  
**Blocks:** external failure detection and canary admission

| Option | Benefit | Cost or risk | Downstream impact |
| --- | --- | --- | --- |
| D6-A — Managed missed-heartbeat receiver with two named notification paths | Fastest independent detection and escalation | External service dependency and recipient-data handling | Supply the private HTTPS receiver URL, name primary/secondary recipients, approve missed interval, prove success receipt and missed-heartbeat alert |
| D6-B — Self-hosted receiver outside the KELD VPS failure domain | Greater control of evidence and data | Adds another operated service and its own availability burden | Deploy separately, test independent failure, alert delivery, and retention |
| D6-C — Local systemd/journal monitoring only | Already working | Cannot notify when the VPS or network is unavailable | Not admissible for production under the current monitoring plan |

**Selection:** unresolved. Receiver URLs and recipients remain private operator
inputs and must not be committed.

### D7 — Artifact, license, and customer support offer

**Owner:** product, license, and support owners  
**Blocks:** exact production artifact admission and customer-facing terms

| Option | Benefit | Cost or risk | Downstream impact |
| --- | --- | --- | --- |
| D7-A — Package and approve the real ARE production artifact under its reviewed license, with a named support destination/window and required notices/source offers | Produces the actual product the storefront promises | Requires release packaging, security/license review, and new exact-delivery evidence; the current 208-byte synthetic artifact cannot substitute | Bind the production artifact hash, notice bundle, customer terms, support address/window, and owner approval; rerun all-provider delivery before final freeze |
| D7-B — Launch the public site and ARE chat without paid artifact sales | Allows product evaluation while commercial release packaging finishes | No checkout revenue or customer delivery at launch | Disable production checkout routes and purchase calls, update storefront copy, and keep sandbox commerce as non-production evidence |
| D7-C — Continue using the 208-byte synthetic artifact | No new packaging work | It is test evidence, not a commercially admitted ARE release | Staging-only; not admissible for production sales |

**Selection:** unresolved.

### D8 — Production canary and rollback authority

**Owner:** product, merchant, security, and operations owners  
**Blocks:** final cutover

| Option | Benefit | Cost or risk | Downstream impact |
| --- | --- | --- | --- |
| D8-A — Invite-only canary, enable one provider at a time, explicit automatic stop thresholds, manual go/no-go | Smallest customer and payment blast radius | Slower rollout and more operator coordination | Freeze exact candidate, back up, prove alerts, run bounded live transactions, stop on auth/payment/delivery/monitor failure, then authorize each expansion |
| D8-B — All three providers in one bounded canary | Faster cross-provider signal | Larger simultaneous failure surface and harder diagnosis | Requires all gates and rollback readiness before the first customer |
| D8-C — Immediate general availability | Fastest launch | No bounded learning window; unacceptable while current gates are open | Not admissible under the reviewed implementation layering |

**Selection:** unresolved. D8-A is recommended for the first production release.

## Decisions that are not owner-policy blockers

- Genuine Mercado Pago and PayPal signed webhook/restart/replay evidence needs a
  coordinated sandbox event window, not a product-policy choice. The
  [provider-specific acceptance runbook](../PROVIDER-WEBHOOK-RECOVERY-ACCEPTANCE.md)
  owns its phased evidence and the separate PayPal fault-injection question.
- The current 5.10 quote remains in force until the merchant deliberately
  replaces it; no automatic PTAX update is authorized.
- The old `/react-preview` presentation gallery is historical. The React
  storefront already owns the staging root.

## D65 construction boundary

- **Current product frontier:** the exact r23 staging candidate is live and
  verified; it is not an approved production candidate.
- **Runnable product work:** the exact reviewed Mercado Pago/PayPal webhook
  verifier is installed standalone on staging and passes installed-source,
  read-only live compatibility checks. It is intentionally not an input to
  unchanged r23. Genuine provider recovery can now run during a coordinated
  sandbox event window. After an individual owner decision is recorded, its
  selected implementation branch and focused tests may run without waiting for
  unrelated decisions.
- **Operational tasks and owners:** D5-D6 belong to operations/security; D1 and
  D7 require security/license owners; D2-D4 require product/security/merchant
  owners; D8 requires the joint cutover owners.
- **Exact affected stages:** D1 identity image; D2 realm/onboarding; D3 event and
  entitlement transitions; D4 ARE edge/chat/broker configuration and notice;
  D5 backup/restore; D6 monitoring; D7 artifact/storefront/delivery; D8 release
  freeze, canary, and rollback.
- **Causal blockers:** only the decision governing a stage blocks mutation of
  that stage. D1-D7 and genuine provider webhook proof all block D8.
- **Deferred operational residue:** production DNS/cutover, live credentials,
  final manifest, and public traffic remain outside the current staging
  candidate and require separate exact authorization even after this gate passes.

## Response format

The owner may answer in stages. Use the exact identifiers so the selection can
be recorded without ambiguity, for example:

```text
D1=B
D2=A
D3=A
D4=A; retain=1800s; hourly=$5; monthly=$50; review=YYYY-MM-DD
D5=A; custodian=<role>; destination=<class>; retention=<policy>; RPO=24h; RTO=4h
D6=A; missed=<interval>; primary=<role>; secondary=<role>
D7=A; support=<destination>; window=<hours/days>
D8=A
```

Secrets, receiver tokens, personal addresses, backup keys, and credentials must
be supplied through the private operator workflow, not in this document or chat.

## Gate result

- **Result:** BLOCK
- **Decisions resolved in this record:** D3 only (1 of 8); implementation and
  validation of D3 remain open
- **Remaining owner decisions:** D1, D2, D4-D8; all final release evidence remains open
- **Deferred decisions:** none; owners may answer incrementally, but production
  candidate mutation waits for the decision that governs it
- **Assumptions:** none
- **Validation:** options reconciled against the current r23 execution DAG,
  Keycloak candidate evidence, webhook authority boundary, ARE presentation
  decision, backup evidence, and staged heartbeat sender
- **Next step:** obtain explicit owner selections, record their source and UTC
  timestamp here, then implement only the selected branches

## Open Questions

1. Which option is selected for D1, D2, and D4-D8?
2. When can the merchant/operator coordinate the two genuine sandbox webhook
   recovery runs that are independent of these policy decisions?
