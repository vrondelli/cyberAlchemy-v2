# Exchange open questions

Status: candidate decision register; resolved owner selections remain recorded.
Initial catalog: Lab, separately sold ARE, Craft + Alch, paid managed Alch hosting, and community inference with provider-selected free or paid access.

## Q1: Exchange product owner

Choose the first integrated release: host + inference + project purchases together, or staged offering types?

Affects: Release composition; existing slices can be inventoried independently.

## Q2: Exchange host owner

Which host successor and runtime profiles form the first supported Exchange Host distribution?

Affects: Packaging and host conformance; do not merge predecessor controllers by copying files.

## Q3: Exchange identity owner

How do the host project namespace, flat tenants, wallets and stable KEP identities bind across the product?

Affects: Unified onboarding and authorization; avoid equating any pair by name.

## Q4: Exchange commerce owner

Resolved: Provider-caused failures of inference requests and retry attempts are non-billable, including partial output from provider-failed attempts. Caller cancellation always costs 50 percent of the agreed usage price, independent of consumed resources or progress; the uncharged balance is released. This supersedes consumed-usage cancellation billing. Billable success requires verified complete provider delivery under the agreed requirements and passing declared objective intent checks; subjective quality feedback affects reputation separately. Exchange owns MVP billable-outcome verification using usage records, delivery evidence and declared check results. Providers set their own rates using Exchange-standardized billing units; a single agreed price per usage is selected, with exact usage boundaries and verification rules still open. The cancellation price is resolved as one half of the agreed usage price. Providers declare offering limits and checks through Exchange standard contract; accepted request terms remain fixed. Pre-acceptance limit rejection incurs no charge and is not a half-price cancellation. A provider missing the agreed execution deadline on an accepted request is a provider failure with zero charge. Paid execution requires confirmed reservation of the full agreed price. Settlement charges/releases 100/0 on verified compliant provider delivery, 50/50 on customer cancellation and 0/100 on provider failure. Each paid request separately funds and reserves its agreed amount using Exchange escrow. No reusable customer balance or deposit-once-spend-many wallet behavior; released funds are returned for that request. Unfunded quotes expire after a disclosed funding deadline; funding afterward requires a fresh quote. Exchange sets one standard quote funding timeout across providers for the MVP. The duration is five minutes from quote issuance to confirmed escrow funding. Funding arriving after quote expiry is rejected where possible; if received, the full escrow amount is returned without execution or a cancellation charge. A fresh quote is required. Authoritative confirmation evidence and deadline ordering remain open. An Exchange-caused failure preventing compliant provider delivery receives a full customer refund, with no provider reputation penalty. After verified compliant provider delivery, the full agreed price remains payable despite customer nonreceipt. Exchange failures are tracked separately from provider failures. When provider work is complete, Exchange automatically retrieves and redelivers the existing result within the disclosed bounded recovery window. Recovery does not rerun inference or add a charge. Exhausted retries do not refund verified compliant provider delivery; the result remains recoverable for 24 hours after verified provider delivery under the disclosed retention policy. The delivery recovery window is two minutes from the first failed delivery attempt, disclosed upfront. Retries do not restart or extend that clock. Verified provider delivery meeting the agreed requirements earns the full agreed usage price even if the customer does not receive or retrieve the result. Retain the result for customer recovery under a disclosed retention policy. Nonreceipt or exhausted automatic delivery retries alone does not refund compliant provider delivery. Results are retained for customer recovery for 24 hours after verified provider delivery, disclosed upfront. Exchange stores and serves the result recovery copy during the 24-hour retention period, so customer retrieval does not depend on the provider remaining online. Provider delivery counts as complete only once Exchange has stored the full result and verified the agreed requirements. This earns the full agreed usage price and starts the 24-hour retention period; customer receipt or retrieval is not required. At the end of the 24-hour retention period, Exchange automatically deletes the result content while retaining a minimal transaction receipt containing no prompts or results. Cancellation is unavailable after Exchange has stored the full result and verified the agreed requirements. Completed requests remain fully payable even if not downloaded; the half-price cancellation rule applies before completion. When cancellation and completion race, the first valid state change accepted by Exchange wins. The later competing transition cannot replace it or create a second settlement. Requests are idempotent: retrying the same request with the same identifier returns its existing status or retained result without creating another execution, escrow reservation or charge. Reusing a request identifier with different input or terms is rejected as a conflict. The original request and its accepted terms remain unchanged; a different request requires a new identifier. Request identifiers are scoped to the authenticated caller. Different callers may use the same identifier without colliding or obtaining access to each other’s requests. For the MVP, Exchange pays settlement and refund network fees from its own funds without reducing promised provider payouts or customer refunds. Operating-cost validation remains open; the customer pays the initial escrow-funding network fee, disclosed separately from the service price. The customer pays the network fee for initially funding each request escrow, disclosed separately from the service price. Exchange pays settlement and refund network fees without deducting them from promised payouts or refunds. Round the 2% Exchange fee upward to the smallest currency unit on the collected payment, for success and eligible cancellation. The provider receives the collected payment minus that rounded fee; customer charge and refund amounts are not increased by fee rounding. Round the 50% cancellation charge upward to the smallest currency unit and refund the remainder of the agreed price. Then calculate the 2% Exchange fee on that rounded charge, rounding the fee upward; the provider receives the charge minus that fee.

For paid inference, which per-intent checks, delivery evidence and Exchange verification procedures establish the selected success rule and failure attribution, what cancellation evidence, integer-rounding implementation, atomic cancellation/completion acceptance and failure/deadline ordering apply, how are compliant provider delivery and Exchange failures distinguished, and network failures and uncertain outcomes handled, and which schema and verification rules, immutable request-term binding, existing escrow compatibility and request-specific funding/refund interfaces, reservation confirmation/expiry, authorization and settlement/release mechanics apply? What fulfillment contracts apply to later offering types? What authoritative confirmation evidence, deadline ordering, late-funding return mechanics and initial funding fee disclosure and settlement/refund fee implementation apply? What authoritative recovery timestamps, deadline event ordering, retry schedule and result retrieval/retention rules apply? What authoritative retention timestamps, result handoff/storage implementation, access rules and deletion enforcement and remedies for loss during promised retention apply? What minimal receipt fields, access and retention duration apply? What authenticated caller identity binding and delegation, canonical input/terms comparison and conflict response, idempotency record retention and crash/concurrency handling apply?

Affects: Paid inference and additional markets; project-purchase rules cannot be generalized automatically. [Decision and retry boundary](QUALITY-EVIDENCE.md#retry-policy).

Selected provider unavailability during funding: If the provider becomes unavailable during escrow funding and funding completes but execution cannot start, Exchange returns the full escrow amount with no cancellation charge and no automatic provider substitution. The customer may request a fresh quote. Exchange pays the refund network fee; the separately paid initial funding network fee remains the customer’s cost. No-start evidence, funding/start/refund ordering, refund confirmation/timing and new quote/key enforcement remain open under Q4. Unknown execution-start outcomes still require reconciliation. Implementation remains pending.

For the refund after provider unavailability during funding, show Refund pending until the return transaction is confirmed, then Refund completed. Failed refund attempts remain pending for retry and reconciliation. Confirmation criteria, retry timing, reconciliation/escalation mechanics and status projection remain open under Q4.

Another attempt after a funded request fails because provider unavailability prevents execution start requires a new quote and a new idempotency key. The original key continues returning the original request and its refund status; it does not restart execution or reuse its escrow funding. New quote/key and separate-funding enforcement, pending-refund disclosure and independent reconciliation remain open under Q4.

A new attempt after funded provider-unavailability failure may proceed with separate funding while the original refund remains pending. Exchange clearly shows the pending refund. The new attempt requires a new quote and idempotency key; the original escrow cannot fund it. The original refund remains independently due and tracked. Implementation remains pending.

Escalate a refund to the Exchange operator after 15 minutes pending, preserving Refund pending and continuing reconciliation and the refund obligation. This is an alert threshold, not a completion guarantee. Exchange must have a proactive monitoring and recovery process to mitigate avoidable escalations. The proposed operational monitoring/recovery process is recorded in [QUALITY-EVIDENCE.md](QUALITY-EVIDENCE.md#operational-monitoring-and-recovery) and its machine record. Operator permissions, evidence-resolution and refund-change approval rules, retry budgets/cadence, pending-clock evidence, confirmation, watchdog, operator acknowledgement and closure enforcement remain open.

The recovery process may automatically reconcile state and retry transient failures. Conflicting evidence or changes to refund amounts or destinations require operator intervention. This does not grant unrestricted authority to alter refund entitlements or bypass existing request and escrow rules. Detailed failure classification, retry budgets and operator-action evidence remain open under Q4. Implementation remains pending.

Conflicting evidence or cases requiring operator intervention escalate immediately, without waiting 15 minutes. Affected payment actions pause while status checks continue. The 15-minute pending-refund threshold remains the fallback for unresolved routine delays; the refund obligation persists. Durable action-pause enforcement, reconciliation of already submitted transactions, operator acknowledgement and authorized resume/closure remain open under Q4. Implementation remains pending.

Before paused payment actions resume, the operator must record a resolution containing their identity, supporting evidence and the permitted recovery action. Acknowledging the alert alone does not resume payment actions. Resolution does not establish refund completion, which still requires confirmed return. Operator permission binding, resolution schema/evidence validation and atomic action-resume enforcement remain open under Q4. Implementation remains pending.

Exchange requires an independent watchdog that detects stalled recovery workers and alerts the operator. It must not depend on the worker it monitors. Pending obligations must persist durably and remain recoverable after restart. Watchdog signal evidence, timing, deployment independence, alert delivery and restart recovery mechanics remain open; implementation is pending.

Recovery health requires both a worker heartbeat and successful completion of scheduled reconciliation checks, including when no obligations are pending. A running worker alone is insufficient evidence that recovery is functioning. A completed check does not itself confirm a refund. Signal evidence, cadence, freshness thresholds and handling of unavailable dependencies remain open; implementation is pending.

During a recovery outage, Exchange temporarily blocks affected new paid requests until recovery is healthy. Existing requests retain their agreed terms and refund obligations. Free services may continue if otherwise healthy. Outage scope, admission and funding races, retry guidance and idempotency, and reopening stability mechanics remain open; implementation is pending.

After a routine recovery outage, Exchange automatically reopens affected new paid requests following sustained healthy worker heartbeats and successful scheduled reconciliation checks. Conflicting evidence and other cases requiring operator intervention retain the recorded operator-resolution requirement; recovery health alone does not clear those restrictions. Stability evidence, timer authority and atomic reopening mechanics remain open; implementation is pending.

Automatic reopening after a routine recovery outage requires 2 consecutive minutes (120 seconds) of healthy worker heartbeats and successful scheduled reconciliation checks. Any renewed recovery-health failure resets the stability timer; a fresh full healthy period is required before reopening. Existing operator-resolution restrictions remain in force. Health-signal freshness, reconciliation cadence, timer authority and restart/concurrency enforcement remain open; implementation is pending.

For affected new paid requests during a recovery outage, Exchange immediately returns Paid requests temporarily unavailable before requesting escrow funding. There is no charge or automatic queue; customers may retry later. API response details, retry timing, idempotency enforcement and funding-in-flight evidence/settlement mechanics remain open; implementation is pending.

For a request affected by a recovery outage, if escrow funding was already underway when the outage began and completes before execution starts, Exchange returns the full escrow amount with no cancellation charge or provider penalty. The customer sees Refund pending until the return is confirmed. Unknown execution-start state requires reconciliation. Evidence ordering, prevention of execution after refund selection, confirmation mechanics and new-attempt disclosure/enforcement remain open; implementation is pending.

A new attempt after the recovery-outage refund outcome requires a new quote and a new idempotency key. The original key continues returning the original request and its refund status; it cannot restart execution. Existing outage admission restrictions still apply. Pending-refund disclosure and atomic identity/funding enforcement remain open; implementation is pending.

Once affected paid requests reopen, a customer may make a new attempt with separate funding while the original recovery-outage refund remains pending. Exchange clearly shows the outstanding refund, which remains independently due. The new attempt still requires a new quote and idempotency key; the original escrow cannot fund it. Disclosure, separate funding and atomic identity/refund enforcement remain open; implementation is pending.

After an outage rejection before funding is requested, the customer may retry the unchanged request with the same idempotency key to recheck availability. Once accepted, that key returns the existing request without duplicate execution or funding. Existing caller scope and changed-request conflict rules apply. API response details, random-delay details and guidance delivery, key retention and atomic admission enforcement remain open; implementation is pending.

Outage rejection responses include a suggested retry delay, clearly described as guidance rather than a promise of service restoration. Clients should space out retries instead of continuously polling. The delay adjustment policy and API/client contract remain open; implementation is pending.

The MVP outage response suggests waiting 30 seconds before retrying. Clients add a small random delay to spread retries out. This remains retry guidance, not a promise of service restoration. The random-delay range, adjustment policy and API/client contract remain open; implementation is pending.

Exchange groups a shared outage into one operator incident linking all affected requests and refunds. Each refund retains its own pending age and escalation status; incident grouping must not hide overdue obligations. Correlation evidence, incident identity, notification behavior and closure enforcement remain open; implementation is pending.

When recovery is healthy but linked refunds remain unresolved, the operator incident is marked Service restored—refunds pending. Full incident closure requires all linked obligations to be resolved with evidence. Paid requests may reopen under the existing recovery-health rules while the incident remains open for outstanding obligations. Closure evidence validation, automation identity/permissions, concurrency and recurring-outage handling remain open; implementation is pending.

Exchange automatically closes an operator incident when recovery is healthy, every linked obligation has verified completion, and no operator-required issue remains unresolved. All three conditions are required; automatic closure does not replace confirmed refund returns or required recorded operator resolutions. Evidence validation, automation identity/permissions, atomic closure and recurring-outage handling remain open; implementation is pending.

If a previously missed unpaid refund belonging to an Exchange recovery outage is discovered after its incident was closed, Exchange reopens the original incident, preserves its history including prior closure, and alerts the Exchange operator. These incident rules concern Exchange recovery outages. Correlation evidence, atomic linking/reopening and operator alert delivery remain open; implementation is pending.

Affected customers can see the Exchange recovery-outage incident status alongside their own request and refund status. This customer view does not expose other customers' details or internal diagnostics. Shared incident status does not establish completion of an individual refund. Customer-facing fields, access enforcement, API/UI delivery and stale-status evidence/storage remain open; implementation is pending.

When fresh customer status information cannot be retrieved during an Exchange recovery outage, show the last verified status and its timestamp with Updates temporarily unavailable. Missing updates must never imply refund completion. Timestamp authority, cached-status access/storage, API/UI representation and unavailable-status enforcement remain open; implementation is pending.

When fresh status cannot be retrieved and no previous verified status is available, show Status temporarily unavailable without guessing whether the request succeeded, failed or was refunded. Customers may retry the status lookup without submitting another execution. API representation, status-only retry enforcement and distinctions from verified not-found or access denial remain open; implementation is pending.

The API and customer interface share the same status contract for the customer-visible Exchange incident, request and refund information: status, verification timestamp when available, and a freshness indicator. Both surfaces preserve the same uncertainty and privacy rules. Field names and types, per-status freshness enforcement, timestamp semantics and API/UI projection enforcement remain open; implementation is pending.

The shared status contract has three freshness values: Current means successfully verified during this lookup; Stale means last verified information with refresh unavailable; Unavailable means no verified information is available. These values describe information freshness, not request or payment outcomes. Verification evidence, timestamp authority, wire representation and per-status freshness enforcement remain open; implementation is pending.

Incident, request and refund status each carry their own freshness indicator and verification timestamp when available, in both the API and customer interface. Their freshness is independent: incident information may be Current while refund information is Stale. Per-status evidence binding, timestamp authority and API/UI projection enforcement remain open; implementation is pending.

**Accepted verification timestamp meaning.** “Verified at” means when Exchange last successfully checked that specific incident, request or refund status. It is not the time the status changed or the page loaded. A failed refresh leaves that status’s verification timestamp unchanged. Verification evidence, clock authority binding, timestamp format, storage and projection enforcement remain open.

**Accepted customer recovery notifications.** Affected customers receive notifications when their own refund completes or an incident affecting their refund reopens, once per meaningful change. Internal retries do not each generate a customer notification. Refund completion still requires confirmed return; existing customer-access and privacy restrictions apply. Customer channels are selected below; mandatory creation enforcement, change identity, duplicate suppression and durable delivery/failure enforcement remain open.

**Accepted MVP customer notification channels.** MVP customer recovery notifications use an in-app notification inbox that is also readable through the API. Email and outgoing webhook delivery are deferred beyond the MVP. Both surfaces retain affected-customer access and privacy restrictions. Inbox retention enforcement, read-state enforcement, mandatory creation enforcement, API retrieval and delivery mechanics remain open. Critical operator alerts use the separately selected dashboard and email channels below.

**Accepted notification creation failure handling.** If customer notification creation fails, refunds and recovery continue normally. Exchange retains the pending notification and retries creating it without duplicates. Notification failure never reverses a completed refund. Retries concern notification creation only and do not replay payment actions. Durable recording, crash recovery, retry cadence, escalation thresholds and duplicate suppression enforcement remain open.

**Accepted inbox notification retention.** Inbox notifications are retained for 90 days after creation, whether read or unread. Removing a notification does not delete its underlying request, refund or incident record. Creation timestamp binding, expiry enforcement across inbox and API, cleanup and duplicate suppression interaction remain open.

**Accepted notification read state.** Marking a notification as read requires an explicit action available in both the UI and API. Fetching notifications alone leaves unread notifications unread. Notification read status changes no payment, refund or incident state. Existing access restrictions and 90-day retention from creation still apply. Authenticated mutation, UI/API contract binding, persistence and concurrent updates remain open.

**Accepted mandatory customer recovery notices.** Refund-completion and incident-reopening notices are always created in the affected customer inbox when their respective triggers occur. Customers can mark these notices as read but cannot disable their creation. These notices remain available throughout the 90-day retention period from creation. Existing privacy, verified triggers, duplicate suppression and creation-failure recovery rules still apply. Mandatory creation enforcement remains open.

**Accepted critical operator alert channels.** Exchange operators receive critical alerts through an operator dashboard and email. Alert delivery is independent of the monitored recovery worker, allowing alerts when that worker stops. Customer email notifications remain deferred. Existing escalation triggers, incident grouping and payment-action restrictions still apply. Recipient configuration, dashboard access, deployment independence, durable delivery, retries, acknowledgement enforcement and reminder enforcement remain open.

**Accepted critical operator alert reminders.** Critical operator alerts send an initial email, followed by a reminder every 15 minutes while the incident remains unresolved and unacknowledged. Acknowledgement stops reminders but does not resolve the incident or resume paused payment actions. Durable scheduling, timer authority, authenticated acknowledgement, concurrent reminder suppression, email failure enforcement and enforcement on incident reopening remain open.

**Accepted operator alerts on incident reopening.** When an incident reopens, Exchange requires a fresh operator acknowledgement, sends a new operator alert and restarts the 15-minute reminders while the incident remains unresolved and unacknowledged. Previous acknowledgements remain in the incident history. Existing closure, refund-age and payment-action restrictions still apply. Reopening identity binding, atomic alert/reminder creation, duplicate reopening events and delayed acknowledgement handling remain open.

**Accepted explicit operator acknowledgement.** Operator acknowledgement requires an explicit authenticated action through the dashboard or API, recording who acknowledged and when. Opening an email or viewing the dashboard does not count as acknowledgement. Acknowledgement stops reminders without resolving the incident or resuming paused payment actions. Operator authorization, timestamp authority, durable recording, API binding and concurrent/reopening enforcement remain open.

**Accepted operator email content.** Operator alert emails include the incident ID, severity, a brief operational summary and a dashboard link. Customer details, prompts, outputs and internal diagnostics stay behind authenticated access and are excluded from the email. The summary and link respect these exclusions; existing authorization, privacy and data-retention rules still apply. Template filtering, severity assignment and authenticated dashboard link binding remain open.

**Accepted operator email delivery failure handling.** When operator email delivery fails, Exchange retains the alert, retries delivery with increasing delays and shows the delivery failure on the operator dashboard. Failed delivery never counts as acknowledgement or stops recovery. Existing payment-action restrictions and email-content rules still apply. Retry schedule enforcement, permanent-failure enforcement, durable delivery evidence, duplicate suppression and enforcement of interaction with reminders, acknowledgement and resolution remain open.

**Accepted operator email backlog prevention.** Exchange keeps one pending operator email per incident and recipient, updating it with the latest status instead of accumulating every reminder. If the incident is acknowledged or resolved before sending, Exchange suppresses the pending alert and preserves its history. Existing email-content restrictions and fresh-alert/fresh-acknowledgement requirements on reopening still apply. Atomic update and pre-send checks, in-flight or unknown delivery outcomes, reopening binding and history retention remain open.

**Accepted temporary operator email retry timing.** For temporary operator email delivery failures, Exchange waits 1, 2, 5, then 15 minutes between attempts, capped at 15 minutes thereafter, while the incident remains unresolved and unacknowledged. Reminders update the same pending email. Pre-send suppression and email-content restrictions still apply. Failure classification, durable scheduling, attempt counts, restart recovery, concurrent updates and permanent-failure enforcement remain open.

**Accepted permanent operator email failure handling.** Permanent operator email failures pause delivery to the affected address, retain the alert and show “Operator action required” on the operator dashboard. An authorized operator must correct the configuration and explicitly resume delivery. Other recipients remain unaffected. This pauses email delivery only; recovery and existing payment-action restrictions continue. Resumed delivery still suppresses alerts already acknowledged or resolved. Failure classification, durable address pauses, authorized correction/resume and recipient rebinding remain open.

**Accepted critical operator alert recipients.** MVP critical operator alerts use an operator-managed list of verified email addresses. Each listed recipient receives critical alerts, subject to existing delivery-pause rules. Acknowledgement by any authorized operator stops reminders for all recipients on that incident. Email verification and recipient listing do not grant operator permissions. Verification mechanics, recipient-management authorization, additions, removal enforcement and absence of usable addresses remain open.

**Accepted operator recipient removal.** Removing an operator alert recipient address immediately prevents new sends to it and cancels its pending emails, while preserving delivery history. Emails already handed to the email service cannot be recalled. Removal does not acknowledge or resolve incidents or alter payment-action restrictions. Authorized removal, atomic enforcement against sends, handoff evidence, pending cancellation and history retention remain open.

## Q5: Exchange security/product owner

How is wrong-key or invalid-envelope delivery prevented or remedied before using real money?

Affects: Real-money project sales; ciphertext hashing alone does not prove correct plaintext.

## Q6: Exchange operator

What are retention, backup, upgrade-key custody and recovery commitments?

Affects: Public operational promises; local product work can continue.

## Q7: Exchange deployment owner

What Devnet fee ceiling and executor should be used, with freshly verified funding and preflight?

Affects: Devnet submission only; September 8 evidence is historical.

## Q8: Exchange product/network owner

What verification, dispute, node-admission and reputation rules are required beyond permissionless seller entry?

Affects: Network trust and guarantees; no new token or consensus chosen.

## Q9: Exchange and Alch maintainers

When should Exchange-owned source be physically extracted, and which shared libraries stay with Alch/DomainSpec?

Affects: Relocation and standalone distribution; product containment is established separately.

## Q10: Exchange product owner

Which exact versions of Lab, ARE and Craft + Alch form the first listings, and who will participate in the first purchase and hosting trials?

Affects: Initial projects are selected; versions, offer contents and pilot participants remain.

Resolved context: Owner selected Lab at ../CyberAlchemy-lab, separately sold ARE, Craft + Alch, and paid managed Alch hosting.

## Q11: Exchange product owner

In what sequence should project sales, managed Alch hosting and community inference sharing ship?

Affects: All three offering families are selected; release sequence remains open.

Resolved context: Owner will sell their projects and reports an existing community that wants local-inference sharing.

## Q12: Exchange commercial owner

Resolved: For successful paid inference and task-service requests, Exchange takes a disclosed percentage fee deducted from provider payment within the single agreed customer price. The selected MVP pilot rate is 2%, with cost validation pending. On an eligible customer cancellation, Exchange takes 2% of the 50% cancellation payment. Of the original agreed price, the customer receives a 50% refund, the provider receives 49%, and Exchange receives 1%; rounding and network-fee implementation remain open. For the MVP, Exchange pays settlement and refund network fees from its own funds without reducing promised provider payouts or customer refunds. Operating-cost validation remains open; the customer pays the initial escrow-funding network fee, disclosed separately from the service price. The customer pays the network fee for initially funding each request escrow, disclosed separately from the service price. Exchange pays settlement and refund network fees without deducting them from promised payouts or refunds. Round the 2% Exchange fee upward to the smallest currency unit on the collected payment, for success and eligible cancellation. The provider receives the collected payment minus that rounded fee; customer charge and refund amounts are not increased by fee rounding. Round the 50% cancellation charge upward to the smallest currency unit and refund the remainder of the agreed price. Then calculate the 2% Exchange fee on that rounded charge, rounding the fee upward; the provider receives the charge minus that fee. Exchange enforces a minimum paid inference/task-service request price while keeping free offerings available. The minimum amount will be determined using settlement, verification and storage costs; no numeric floor is selected yet.

What cost evidence supports the 2% pilot success fee, how are other non-success outcomes treated, and what currency-unit validation, integer-rounding implementation, fee version binding, initial funding fee disclosure and settlement/refund fee implementation and commercial models for other offerings apply? What measured costs and numeric minimum, version binding, profile-specific cost treatment and enforcement contract apply to the minimum paid price?

Affects: Success and eligible-cancellation fee model for paid inference/task services selected; 2% pilot rate selected and cost validation remains open. Provider free/paid choice remains Q13. [Fee model and Telegraph comparison](QUALITY-EVIDENCE.md#exchange-platform-fee).

## Q13: Exchange product owner and community providers

Resolved: each provider chooses whether to share inference for free or for payment.

Affects: Offering model must express both modes; paid metering/settlement remains Q4 and Exchange fees remain Q12.

Resolved context: User selected: Each provider chooses free or paid.

## Q14: Exchange host owner and community providers

Resolved: the provider chooses everyone on Exchange, a selected community, or named users/services for each offering. Free/paid choice is independent.

Remaining: usage limits, availability, request-data retention and the exact enforcement of community/named-actor access.

Affects: community inference access contract. Audience eligibility must be applied before routing.

Selected free-service model: For free inference/task-service requests, providers deliver results directly. Exchange tracks availability, latency and completion, without guaranteeing 24-hour result recovery. Quality evaluation remains separate; the paid stored-result verification and retention package is not required for free requests. Direct-delivery transport, operational metric evidence and optional free-provider retention disclosures remain open. [Free-service decision](QUALITY-EVIDENCE.md#free-service-model).

Selected free-offering limits: Providers may set per-caller usage quotas and concurrency limits for their free offerings to protect local engine capacity. Quota units/windows, concurrency accounting, disclosure, enforcement and rejection response schema remain open.

Selected limit handling: When a free offering’s quota or concurrency limit is reached, Exchange rejects the request immediately with a clear reason and retry timing when known. Rejection response schema, atomic quota/concurrency accounting, metric schema and routing freshness/recovery remain open.

Selected limit attribution: Pre-acceptance free-request quota and concurrency rejections are recorded as quota or capacity limits, not provider execution failures. Routing still recognizes that the provider cannot currently serve the affected caller. Metric evidence, routing freshness, reset/recovery and aggregate availability accounting remain open.

Selected provider pause: Providers may pause new requests while allowing already accepted requests to finish. Pausing does not cancel accepted work or change its terms, deadlines or applicable outcome rules. Independent pause-state implementation and authorization, pause/acceptance ordering, resume readiness probe contract/freshness, durable pause storage/recovery and discovery/routing propagation remain open. [Pause policy](QUALITY-EVIDENCE.md#provider-pause).

Selected pause persistence: A provider pause persists across host restarts until the provider explicitly resumes sharing. Restarting the host does not reopen paused request acceptance.

Selected pause scopes: Providers can pause one offering or pause all offerings on a host. Both controls stop new acceptance within their scope, preserve accepted work and persist across restarts until explicit resume.

Selected pause interaction: Resuming a host preserves individually paused offerings until those offerings are explicitly resumed. Host and offering pause states are independent; new acceptance requires both relevant pause states to be clear.

Selected paused discovery: Paused offerings remain discoverable to their permitted audience, clearly marked paused, and excluded from new-request routing. Discovery visibility does not permit new request acceptance while paused. Discovery/API representation, propagation, cache freshness and stale-routing rejection remain open.

Selected resume readiness: Resuming request acceptance requires a fresh host-and-engine readiness check to pass before new requests are accepted. Explicit resume alone does not establish readiness. Probe contents, freshness, timeout, retries and state representation remain open.

Selected readiness probe: Resume readiness includes a small synthetic test request to confirm that the engine can execute the offering, with bounded cost and timeout. This checks operational readiness separately from quality scoring. Synthetic inputs/pass criteria, resource budget, timeout, probe classification/evidence and exclusion enforcement remain open.

Selected probe accounting: Readiness probes are non-billable; providers cover their own probe compute. Probe traffic is excluded from customer-usage counts used to validate scores and is recorded separately as readiness evidence.

Selected failed-probe behavior: If a readiness probe fails, the offering remains unavailable, the provider sees a clear failure reason, and another probe requires an explicit provider retry. Failure does not start automatic probe retries. Diagnostic schema, retry authorization and concurrent retry handling remain open.

Selected health monitoring: Exchange combines lightweight host heartbeats for reachability with actual request outcomes and latency per offering for service health. Expired heartbeat freshness stops new routing to the host’s offerings; repeated serving failures can make an affected offering unavailable independently of a connected host. Heartbeats do not clear pauses or failed readiness checks, establish provider fault, or automatically refund accepted requests. Heartbeat timestamp/expiry and stale-message handling, serving-failure recovery enforcement and atomic streak-reset implementation, outcome ordering, window boundaries and duplicate-event handling, heartbeat-timeout resume enforcement, trustworthy direct free-delivery telemetry, state propagation and correlated Exchange-side outage handling remain open. Existing pause and readiness rules continue to apply.

Selected heartbeat timing: Hosts send a lightweight heartbeat every 15 seconds. After 60 seconds without a heartbeat, Exchange marks the host unreachable and stops routing new requests to its offerings. Accepted requests retain their existing deadlines and settlement rules.

Selected heartbeat-timeout recovery: After a heartbeat timeout, reconnecting restores host reachability only. Accepting new requests requires explicit provider resume and a fresh passing readiness check. Individually paused offerings remain paused until explicitly resumed; all other eligibility rules still apply. Resume authorization, durable recovery state and atomic readiness/acceptance ordering remain open.

Selected request-failure threshold: Three consecutive provider-caused execution failures within five minutes stop new routing to the affected offering. Successful execution resets the streak; quota rejections, customer cancellations and Exchange failures do not count. Other offerings remain eligible under their existing eligibility rules. Recovery after the request-failure threshold requires explicit provider resume and a fresh passing readiness probe. Waiting five minutes alone does not restore routing. Existing host and offering pauses and all other eligibility rules remain respected. Outcome ordering, window boundaries and duplicate-event handling remain open.

Atomic implementation of the selected failure-streak reset, enforcement of pre-recovery outcome isolation, resume authorization, durable state and atomic readiness/acceptance ordering remain open.

Successful recovery resets the offering’s active failure streak to zero while retaining past failures in its performance history. Resetting the operational counter does not erase the reliability record. This selects neither history retention duration nor score weighting.

Requests accepted before successful recovery keep their original settlement rules and contribute to performance history, but their late outcomes do not change the new active failure streak. Only requests accepted after recovery affect that counter, subject to the existing success-reset and excluded-outcome rules. Atomic request-acceptance/recovery binding remains open.

Offerings unavailable because of heartbeat timeouts or repeated execution failures remain discoverable to their permitted audience, marked unavailable and excluded from new requests. Providers see the specific cause and required recovery action; customers see a simple availability status. Status/diagnostic schemas, provider diagnostic access, safe disclosure, cache freshness and acceptance enforcement remain open. Implementation remains pending.

## Q15: Exchange host owner

Which connection pattern lets an independent caller reach a community member’s local engine in the first pilot?

Affects: Community connectivity acceptance; the current loopback and operator SSH tunnel do not settle a general member setup.

## Q16: Exchange product owner

What does each project package include: exact source/version, dependencies, license terms, update/support entitlement, and any overlap between Lab, ARE and Craft + Alch?

Affects: Publishable project listings; separate sale does not establish exclusive package contents.

## Q17: Exchange host owner

Which Alch profiles and dependencies are supported, and what endpoint, secrets, storage, isolation, limits and lifecycle does the first managed service provide?

Affects: Managed hosting contract; serverless customer experience is selected, infrastructure guarantees remain to be defined.

## Q18: Exchange commercial and service owners

How is managed Alch hosting priced, measured and settled, and what happens on build failure, failed invocation, suspension or cancellation?

Affects: Paid hosting lifecycle; project escrow semantics cannot be copied without a hosting contract.


## Q19: ARE product and release owners

Which exact ARE version and dependency closure ship in each edition after consolidation, and how are differing package/product candidate versions reconciled?

Affects: ARE standalone sale package; include only required supported dependencies, with source/evidence ownership preserved.

## Q20: ARE product and release owners

Which exact modules and dependencies constitute the improvements engine, and what core behavior, updates/support and upgrade entitlements does each edition include?

Resolved context: ARE Static excludes the improvements engine; ARE Full includes it. Dispersed ARE sources will later become one coherent product.

Affects: Static/Full package construction and pricing; edition distinction is selected but no runtime split is implemented.

## Q21: Exchange product/network owner

Resolved: quality-based automatic inference routing is required in the MVP. Audience and caller permissions are applied before selection. Bounded exploration for providers with limited evidence is included for explicitly opted-in callers, respecting budgets and task requirements. Both automatic routing and explicit provider selection are included; explicit choices cannot be silently substituted. Automatic routing supports caller priorities of quality, latency or price, with balanced as default; budget and task requirements remain hard limits. Cross-provider retries require opt-in and share the original total budget; partial output or uncertain execution outcomes stop automatic restarting.

Starting direction: latency, availability and answer quality. The [metric proposal](BASIC-INFERENCE-METRICS.json) separates operational observations from task-quality evaluation.

Remaining: task-specific evaluation, score freshness/confidence, traffic allocation percentages and caps, exploration eligibility and graduation, opt-in scope and handling of degraded performance, normalization and per-intent weights for the selected priorities, their request schema, retry caps, execution-state evidence and explicit recovery. Provider-failed attempts are non-billable; cancellation evidence and rounding, settlement mechanics and failure attribution remain Q4. A distributed validator consensus and Telegraph numerical parameters are not selected by this answer.

Affects: MVP inference routing. [Decision](QUALITY-ROUTING-DECISION.json).

Selected no-provider behavior: When no eligible provider is available, Exchange immediately returns No provider available without accepting, charging or queueing the request. The caller may retry later. Exchange does not relax the caller’s budget, access or task requirements. Response schema, safe eligibility explanation, retry timing, atomic pre-acceptance retry enforcement and selection/acceptance races remain open; provider loss during escrow funding remains linked to Q4.

After No provider available, the caller may retry the unchanged request with the same idempotency key and Exchange rechecks availability. Once accepted, that key returns the existing request rather than creating another execution. Existing authenticated-caller scope and different-input/terms conflict rules remain applicable. Concurrent rechecks and atomic acceptance, retry timing, record retention/expiry and enforcement of the funding-loss refund rule remain open under Q21 and Q4.

## Q22: Exchange product/network owner

Resolved: Exchange offers an evaluator; other parties may offer evaluators, and users may run their own evaluation and publish scores. Scores appear publicly. Other users can validate them; sustained consumption and performance over time also count as validation evidence. Applications can supply explicit success/failure feedback. Feedback is optional in the MVP, with support for automatic reporting where applications have objective checks. Missing feedback remains unknown. Prompts and responses are private by default; aggregate performance can be public, and task-content sharing with independent evaluators requires explicit consent.

How are evaluator versions, consumption-linked feedback, consumer independence, contradictions, consent mechanics, aggregate disclosure and retention handled?

Affects: scoring trust and feedback contracts. [Selected direction and candidate mechanics](QUALITY-EVIDENCE.md). Publication, usage and consumer reports have distinct evidence limits; aggregation policy is still open.

## Q23: Exchange product owner

Resolved: CODE_GENERATION, STRUCTURED_EXTRACTION and TEXT_SUMMARIZATION are selected categories. Research is requested; RESEARCH is its proposed identifier. DOMAIN_MODELING is confirmed as the fifth intent. These intents should be capabilities callable by agents and applications. Providers define input/output and execution limits, acceptance checks and price through Exchange standard contract, with accepted terms fixed per request. Requests exceeding declared limits are rejected before acceptance with zero charge and a clear explanation; no silent truncation or price increases. Provider deadline misses on accepted requests are non-billable provider failures; clock, deadline evidence and terminal-event ordering remain open.

Which initial intent profiles, schemas, measurement units, compatible objective checks, research tools and limit-enforcement behavior implement the standard offering contract?

Affects: Define task contracts before choosing benchmark/scoring implementation. Detailed contracts remain candidate.

Candidate definitions: [first five intents](INFERENCE-INTENTS.md).
