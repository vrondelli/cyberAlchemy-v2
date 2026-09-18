# Exchange quality evidence

Status: owner-selected direction; detailed contracts remain candidate. Authority effect: none.
Owner: Exchange product/network owner. Runtime implementation: pending.

Exchange offers an evaluator; others may offer evaluators, and users may run evaluations themselves. Published scores appear publicly. Other users can validate them, and sustained consumption with observed performance over time also counts as validation evidence. Consuming applications can report explicit success/failure outcomes.

## Evidence and meaning

| Source | What it supports |
| --- | --- |
| Published evaluation | An attributed performance claim for a specific task and configuration. |
| Independent evaluation | Reproduction or challenge of that claim. |
| Usage over time | Availability, latency and completion reliability under observed demand. |
| Application feedback | Task outcomes, with check evidence or attributed subjective feedback. |

Sustained use contributes evidence. Volume alone does not establish answer correctness. Missing feedback remains unknown. A completed HTTP request and a correct task result are separate observations.

The proposed record preserves original claims and attaches supporting or contradictory observations. Evidence stays scoped to the provider configuration, intent, workload and evaluation version. A model change does not silently inherit proof from its predecessor.

Application feedback is optional in the MVP. Applications with objective checks can report results automatically; this does not require every application to implement a checker. Missing feedback remains unknown.

## Candidate feedback contract

Applications report a request reference, consumer identity, provider configuration, intent/version, observation and report timestamps, outcome (success, failure or unknown), reason category and optional check/evidence reference. Examples include a generated-code test result, extraction field check or explicit acceptance of a summary. Acceptance remains attributed feedback rather than proof of every claim.

Reports should be bound to actual consumption and deduplicated, with corrections retained. Identity and a completed request alone do not establish consumer independence. Manipulation detection, time windows, weighting and confidence thresholds remain open.

Prompts and responses are private by default. Aggregate performance can be public; sharing task content with independent evaluators requires explicit consent. Exploration opt-in and optional outcome reporting do not themselves grant consent to share task content. Consent scope, recipients, revocation, retention and aggregation disclosure rules remain open. This disclosure default does not promise zero retention or cryptographic privacy. Feedback alone does not trigger settlement changes or refunds.

## New-provider exploration

The MVP includes a bounded share of eligible traffic for providers with limited evidence, using only callers who explicitly opt in. Routing still respects caller budgets, task requirements, offering audience, authorization, readiness, limits and accepted commercial terms. This gives new providers a path to establish evidence from actual service use.

The traffic percentage, per-provider caps, eligibility thresholds, opt-in scope, graduation rules and degradation handling remain open. This decision does not activate a routing policy.

## Provider selection

Both automatic routing and explicit provider selection are included in the MVP. Automatic routing chooses among eligible providers using the evidence policy and caller constraints. With explicit selection, Exchange honors the chosen provider without silent substitution. Both modes retain audience, authorization, task support, readiness, limits, budget and commercial-term checks.

Exploration opt-in does not override an explicit provider choice. The exact unavailable/ineligible-provider response, detailed recovery behavior and routing-priority contract remain open.

## Routing priorities

For automatic routing, callers can prioritize quality, latency or price, with balanced as the default. These preferences rank eligible providers; budget, task requirements and other eligibility checks remain hard constraints. A priority does not replace an explicitly selected provider.

Balanced does not specify equal weights. Metric normalization, per-intent weights, minimum evidence, tie-breaking, missing-evidence handling and the request schema remain open. A priority expresses a preference rather than a performance guarantee.

## Retry policy

Cross-provider retries require explicit caller opt-in. All attempts share the original total request budget and retain the existing eligibility and commercial-term checks. Explicit provider selection is preserved unless the caller separately authorizes fallback; substitution is never silent.

Automatic restarting stops after partial output or an uncertain execution outcome. Attempt limits, retryable error classes, evidence of execution state, partial/unknown result representation and explicit recovery remain to be defined.

Provider-caused failures of requests and retry attempts are non-billable. Consumed resources or partial output do not create an exception, and provider-failed attempts cannot be added as billable line items to a successful retry.

An eligible caller cancellation before completion costs 50% of the agreed usage price, independent of consumed resources or progress. Cancellation is unavailable after Exchange has stored the full result and verified the agreed requirements. Completed requests remain fully payable even if not downloaded; the half-price cancellation rule applies before completion. Release the uncharged balance. This replaces the earlier consumed-usage cancellation rule. Provider-caused failures remain non-billable; a cancellation signal alone does not relabel an earlier provider failure. When cancellation and completion race, the first valid state change accepted by Exchange wins. The later competing transition cannot replace it or create a second settlement. Atomic acceptance and settlement implementation, ordering evidence, currency rounding and failure/deadline attribution remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner).

The evidence of billable success and failure attribution, Exchange failure attribution before compliant provider delivery and network failure handling, uncertain-outcome reconciliation, successful-request pricing, cancellation rounding and price/version binding, and reservation/refund mechanics remain with [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner). Optional answer-quality feedback alone does not define a billable success or failure. This policy is a product requirement, not an implemented runtime guarantee.

## Billable success

Provider delivery counts as complete only once Exchange has stored the full result and verified the agreed requirements. This earns the full agreed usage price and starts the 24-hour retention period; customer receipt or retrieval is not required. Verification includes passing all objective acceptance checks declared in the accepted contract. The exact handoff protocol, storage confirmation and verification evidence remain open; merely claiming completion does not establish delivery. Subjective quality feedback affects reputation separately. Optional user ratings do not decide whether these acceptance conditions passed.

The proposed contract binds check versions before execution and keeps absent required evidence unknown rather than counting it as a pass. Benchmark tests or checks introduced after the request do not silently become billing conditions. Passing the declared checks establishes only their bounded acceptance conditions.

Each intent still needs its exact checks, delivery evidence, Exchange verification procedure and evaluation deadline. Check failures and unavailable verification require attribution and reconciliation rules. Eligible cancellation before completion retains its separate half-price billing rule; completed requests cannot be cancelled. These details remain with [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner) and the intent profiles in [Q23](OPEN-QUESTIONS.md#q23-exchange-product-owner).

## Billing verification

Exchange owns verification of billable outcomes for the MVP, using usage records, delivery evidence and the declared objective check results. It applies the selected success, provider-failure and cancellation rules within the accepted terms and budget.

Community evaluations continue to inform reputation and routing. They do not replace this billing responsibility. Verification ownership does not override evaluation privacy or turn an unsupported provider claim into verified evidence.

The receipt format, evidence authenticity checks, verification procedures, deadlines, disputed/unknown outcome handling and settlement integration remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner). This is a selected product responsibility; no verifier is activated by this record.

## Pricing ownership

Providers set a single agreed price per usage. Each provider retains the choice to offer inference for free or for payment. Exchange standardizes what constitutes one usage: one bounded invocation of an offering for a declared intent/profile, with specified limits and acceptance checks. Providers define those offering terms using the standard contract; exact schemas and enforcement remain to be defined.

Common units make pricing and usage easier to compare, but do not by themselves establish equal quality or equal total task cost. The existing verification, budget, provider-failure and cancellation rules still apply. Exact usage limits, verification evidence, price/version binding, quote validity, currency, fees and settlement remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner).

A successfully completed usage is charged its agreed single price after the declared objective checks pass. Provider-caused failures remain non-billable. Separate input/output token charges are not selected for this model. Different providers and offerings can set different prices; no universal price or demand multiplier is selected.

The fixed-price cancellation mapping is resolved: charge half the agreed usage price and release the uncharged balance. Currency rounding, cancellation evidence, event ordering and settlement mechanics remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner).

## Offering usage contract

Providers define each offering using Exchange's standard contract. It declares the intent/profile, input limits, output limits, execution deadline and applicable sources/tools, objective acceptance checks, and single price per usage.

Accepted terms remain fixed for that request. Providers can revise offerings for future requests; a later revision does not change an already accepted request's price, limits or checks. Declared tools still require applicable authorization and content-sharing consent.

The concrete schemas, supported measurement units, compatible check profiles, immutable request binding and detailed limit enforcement remain open under [Q23](OPEN-QUESTIONS.md#q23-exchange-product-owner). No numeric limit or runtime implementation is selected by this decision.

## Requests exceeding limits

Requests exceeding the offering's declared limits are rejected before acceptance, with no charge and a clear explanation of the exceeded limit. Exchange does not silently truncate the request or increase its price. This rejection is distinct from caller cancellation and does not incur the half-price cancellation fee.

Exact error schemas, per-profile limit measurement, validation of requested output/execution bounds and runtime enforcement remain to be defined. Pre-acceptance checks cannot establish the future duration or actual output of arbitrary execution; breaches detected after acceptance need explicit outcome and attribution rules under [Q23](OPEN-QUESTIONS.md#q23-exchange-product-owner) and [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner).

## Provider execution deadline

If a provider accepts a request and misses its agreed execution deadline, the outcome is a provider failure with zero charge. It is distinct from customer cancellation and never attracts the half-price cancellation fee merely because the execution timed out.

Deadline start events, the authoritative clock, completion evidence, concurrent terminal-event ordering, execution stopping, late-result handling and reservation release remain to be defined. This selected outcome does not resolve unrelated Exchange/network failure attribution. Details remain with [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner) and [Q23](OPEN-QUESTIONS.md#q23-exchange-product-owner).

## Payment reservation

Paid execution requires the full agreed usage price to be reserved after the customer accepts the terms and before the provider starts. The reservation must be confirmed; reserving funds is distinct from earning or charging them.

An Exchange-caused failure preventing compliant provider delivery receives a full customer refund, with no provider reputation penalty. After verified compliant provider delivery, the full agreed price remains payable despite customer nonreceipt. Exchange failures are tracked separately from provider failures. Full-result storage and verification evidence, retention obligations, and refund mechanics remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner).

When provider work is complete, Exchange automatically retrieves and redelivers the existing result within the disclosed bounded recovery window. Recovery does not rerun inference or add a charge. Exhausted retries do not refund verified compliant provider delivery; the result remains recoverable for 24 hours after verified provider delivery under the disclosed retention policy. The delivery recovery window is two minutes from the first failed delivery attempt, disclosed upfront. Retries do not restart or extend that clock. Authoritative recovery timestamps, deadline event ordering, result retention, retry schedule and delivery evidence remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner). Recovery does not extend the provider execution deadline.

Exchange verifies the outcome and settles the reservation:

| Outcome | Charge | Release |
| --- | --- | --- |
| Exchange has stored the full result and verified agreed requirements, regardless of customer receipt | 100% | 0% |
| Eligible customer cancellation before completion | 50% | 50% |
| Provider failure, including missed execution deadline | 0% | 100% |
| Exchange-caused failure preventing compliant provider delivery | 0% | 100% |

Each paid request separately funds and reserves its agreed amount using Exchange escrow. No reusable customer balance or deposit-once-spend-many wallet behavior; released funds are returned for that request.

Unfunded quotes expire after a disclosed funding deadline; funding afterward requires a fresh quote. Exchange sets one standard quote funding timeout across providers for the MVP. The duration is five minutes from quote issuance to confirmed escrow funding. Funding arriving after quote expiry is rejected where possible; if received, the full escrow amount is returned without execution or a cancellation charge. A fresh quote is required. Authoritative confirmation evidence and deadline ordering remain open. Quote expiry does not cancel a funded request or change its accepted terms.

Existing retry and total-budget constraints still apply. Existing escrow contract compatibility with inference, request-specific funding/refund interfaces, confirmation and identity, expiry, capture/release implementation, idempotency, unknown outcomes, rounding and settlement fees remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner). Reuse is the selected direction; inference settlement support is pending implementation. This does not change KEP project-purchase settlement or select a new chain or asset.

## Result retention and customer recovery

This 24-hour stored-result package applies to paid requests. Free requests follow the separate free-service model below.

Verified provider delivery meeting the agreed requirements earns the full agreed usage price even if the customer does not receive or retrieve the result. Retain the result for customer recovery under a disclosed retention policy. Nonreceipt or exhausted automatic delivery retries alone does not refund compliant provider delivery. The two-minute automatic delivery recovery window is separate from the retention period. Results are retained for customer recovery for 24 hours after verified provider delivery, disclosed upfront. That period starts once Exchange has stored the full result and verified the agreed requirements. Exchange stores and serves the result recovery copy during the 24-hour retention period, so customer retrieval does not depend on the provider remaining online. At the end of the 24-hour retention period, Exchange automatically deletes the result content while retaining a minimal transaction receipt containing no prompts or results. Provider-to-Exchange handoff protocol and evidence, storage implementation, authoritative retention timestamps, access controls, deletion enforcement across replicas/backups, minimal receipt fields and retention, and remedies for lost retained results remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner). This corrects the earlier refund-on-nonreceipt policy; provider payment for compliant delivery comes from the agreed customer charge.

## Idempotent requests

Requests are idempotent: retrying the same request with the same identifier returns its existing status or retained result without creating another execution, escrow reservation or charge. Existing access controls and the offering’s recovery policy still apply. Paid results have 24-hour retention; free requests have no guaranteed 24-hour recovery. Retries do not restore deleted content or authorize a new inference run. Reusing a request identifier with different input or terms is rejected as a conflict. The original request and its accepted terms remain unchanged; a different request requires a new identifier. Request identifiers are scoped to the authenticated caller. Different callers may use the same identifier without colliding or obtaining access to each other’s requests. Identifiers alone grant no access. Authenticated caller identity binding and delegation, canonical input/terms comparison and conflict response, record retention, concurrency and crash recovery remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner). Implementation is pending.

## Exchange platform fee

For successful paid inference and task-service requests, Exchange takes a disclosed percentage fee deducted from provider payment within the single agreed customer price. The selected MVP pilot fee is 2% of the agreed price, leaving 98% for the provider without deductions for settlement or refund network fees. The customer success charge is the gross agreed price; the provider receives that amount less the disclosed Exchange fee. On an eligible customer cancellation, Exchange takes 2% of the 50% cancellation payment. Of the original agreed price, the customer receives a 50% refund, the provider receives 49%, and Exchange receives 1%; rounding and network-fee implementation remain open. Pilot cost validation, other non-success treatment, rounding, version binding and initial funding fee disclosure and settlement/refund fee implementation remain open under [Q12](OPEN-QUESTIONS.md#q12-exchange-commercial-owner).

For the MVP, Exchange pays settlement and refund network fees from its own funds without reducing promised provider payouts or customer refunds. Operating-cost validation remains open; the customer pays the initial escrow-funding network fee, disclosed separately from the service price.

The customer pays the network fee for initially funding each request escrow, disclosed separately from the service price. Exchange pays settlement and refund network fees without deducting them from promised payouts or refunds.

Round the 2% Exchange fee upward to the smallest currency unit on the collected payment, for success and eligible cancellation. The provider receives the collected payment minus that rounded fee; customer charge and refund amounts are not increased by fee rounding. For an integer collected amount C in the currency’s smallest units, the 2% fee is (C + 49) // 50 and provider payment is C minus that fee. Thus nominal 98/2 and 49/1/50 splits may differ by rounding. Half-price cancellation charge rounds upward first; implementation details remain under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner).

Round the 50% cancellation charge upward to the smallest currency unit and refund the remainder of the agreed price. Then calculate the 2% Exchange fee on that rounded charge, rounding the fee upward; the provider receives the charge minus that fee. These rounding rules define the actual amounts when the nominal percentages cannot be represented exactly.

Exchange enforces a minimum paid inference/task-service request price while keeping free offerings available. The minimum amount will be determined using settlement, verification and storage costs; no numeric floor is selected yet. Providers retain price-setting responsibility within that constraint. The cost model must account for the 2% pilot fee; enforcement details and the numeric minimum remain open under [Q12](OPEN-QUESTIONS.md#q12-exchange-commercial-owner).

Telegraph comparison: its [tokenomics documentation](https://raw.githubusercontent.com/telegraphprotocol/telegraph-docs/main/protocol/tokenomics.md) specifies a 2% fee, with 98% entering a TWAP conversion into MACHINA for miners. Its [parameter table](https://raw.githubusercontent.com/telegraphprotocol/telegraph-docs/main/protocol/addresses-and-params.md) also lists 2%. Its [x402 guide](https://raw.githubusercontent.com/telegraphprotocol/telegraph-docs/main/using/x402-inference.md) describes per-call USDC pricing using a miner floor and demand multiplier, and settlement only when the miner answers. These are published design statements, not a live settlement audit. Exchange has selected 2% as its MVP pilot success fee. Demand pricing and token conversion are not adopted. Cost validation must include settlement, verification and 24-hour result storage.

## Free-service model

For free inference/task-service requests, providers deliver results directly. Exchange tracks availability, latency and completion, without guaranteeing 24-hour result recovery. Quality evaluation remains separate; the paid stored-result verification and retention package is not required for free requests. Operational completion tracking is distinct from answer-quality validation. Providers may set per-caller usage quotas and concurrency limits for their free offerings to protect local engine capacity. When a free offering’s quota or concurrency limit is reached, Exchange rejects the request immediately with a clear reason and retry timing when known. Pre-acceptance free-request quota and concurrency rejections are recorded as quota or capacity limits, not provider execution failures. Routing still recognizes that the provider cannot currently serve the affected caller. Caller-specific quota exhaustion does not imply a global provider outage. Direct-delivery transport, telemetry provenance, quota units/windows, concurrency accounting, limit disclosure and enforcement, rejection response schema, routing freshness/recovery and aggregate availability accounting, and optional retention disclosures remain open under [Q14](OPEN-QUESTIONS.md#q14-exchange-host-owner-and-community-providers).

## Provider pause

Providers may pause new requests while allowing already accepted requests to finish. Pausing does not cancel accepted work or change its terms, deadlines or applicable outcome rules. The host must stop new acceptance while existing work finishes. A provider pause persists across host restarts until the provider explicitly resumes sharing. Restarting the host does not reopen paused request acceptance. Providers can pause one offering or pause all offerings on a host. Both controls stop new acceptance within their scope, preserve accepted work and persist across restarts until explicit resume. Resuming a host preserves individually paused offerings until those offerings are explicitly resumed. Host and offering pause states are independent; new acceptance requires both relevant pause states to be clear. Clearing pause states does not override readiness or other eligibility checks. Paused offerings remain discoverable to their permitted audience, clearly marked paused, and excluded from new-request routing. Discovery visibility does not permit new request acceptance while paused. This applies to host and offering pauses; explicit selection cannot bypass the pause. Resuming request acceptance requires a fresh host-and-engine readiness check to pass before new requests are accepted. Explicit resume alone does not establish readiness. Failed or unknown readiness keeps new acceptance closed. Resume readiness includes a small synthetic test request to confirm that the engine can execute the offering, with bounded cost and timeout. This checks operational readiness separately from quality scoring. Readiness probes are non-billable; providers cover their own probe compute. Probe traffic is excluded from customer-usage counts used to validate scores and is recorded separately as readiness evidence. If a readiness probe fails, the offering remains unavailable, the provider sees a clear failure reason, and another probe requires an explicit provider retry. Failure does not start automatic probe retries. Independent pause-state implementation and authorization, pause/acceptance ordering, synthetic test inputs/pass criteria, resource limits, timeout, probe classification/evidence and exclusion enforcement, readiness freshness, explicit-retry enforcement and failure diagnostics, durable pause storage/recovery and discovery/routing status representation and propagation remain open under [Q14](OPEN-QUESTIONS.md#q14-exchange-host-owner-and-community-providers). Implementation is pending.

## Health monitoring

Exchange combines lightweight host heartbeats for reachability with actual request outcomes and latency per offering for service health. Expired heartbeat freshness stops new routing to the host’s offerings; repeated serving failures can make an affected offering unavailable independently of a connected host. Heartbeats do not clear pauses or failed readiness checks, establish provider fault, or automatically refund accepted requests.

The existing bounded resume probe and explicit provider retry after probe failure remain required. Quota rejections, customer cancellations and Exchange failures stay distinct from provider execution failures. Heartbeat timestamp/expiry and stale-message handling, request-failure recovery enforcement and atomic streak-reset implementation, outcome ordering, window boundaries and duplicate-event handling, heartbeat-timeout resume enforcement, trustworthy direct free-delivery telemetry and status propagation remain open under [Q14](OPEN-QUESTIONS.md#q14-exchange-host-owner-and-community-providers). The selected heartbeat interval is 15 seconds and freshness timeout is 60 seconds. Accepted requests retain their existing deadlines and settlement rules. Implementation is pending.

After a heartbeat timeout, reconnecting restores host reachability only. Accepting new requests requires explicit provider resume and a fresh passing readiness check. Individually paused offerings remain paused until explicitly resumed; all other eligibility rules still apply. Implementation remains pending; resume authorization, durable recovery state and atomic readiness/acceptance ordering remain open under [Q14](OPEN-QUESTIONS.md#q14-exchange-host-owner-and-community-providers).

Three consecutive provider-caused execution failures within five minutes stop new routing to the affected offering. Successful execution resets the streak; quota rejections, customer cancellations and Exchange failures do not count. Other offerings remain eligible under their existing eligibility rules. Recovery after the request-failure threshold requires explicit provider resume and a fresh passing readiness probe. Waiting five minutes alone does not restore routing. Existing host and offering pauses and all other eligibility rules remain respected. Outcome ordering, window boundaries and duplicate-event handling remain open under [Q14](OPEN-QUESTIONS.md#q14-exchange-host-owner-and-community-providers). This is an accepted MVP definition; implementation and operational validation remain pending.

Atomic implementation of the selected failure-streak reset, enforcement of pre-recovery outcome isolation, resume authorization, durable state and atomic readiness/acceptance ordering remain open under [Q14](OPEN-QUESTIONS.md#q14-exchange-host-owner-and-community-providers).

Successful recovery resets the offering’s active failure streak to zero while retaining past failures in its performance history. Resetting the operational counter does not erase the reliability record. This selects neither history retention duration nor score weighting.

Requests accepted before successful recovery keep their original settlement rules and contribute to performance history, but their late outcomes do not change the new active failure streak. Only requests accepted after recovery affect that counter, subject to the existing success-reset and excluded-outcome rules. Atomic request-acceptance/recovery binding remains open under [Q14](OPEN-QUESTIONS.md#q14-exchange-host-owner-and-community-providers).

Offerings unavailable because of heartbeat timeouts or repeated execution failures remain discoverable to their permitted audience, marked unavailable and excluded from new requests. Providers see the specific cause and required recovery action; customers see a simple availability status. Status/diagnostic schemas, provider diagnostic access, safe disclosure, cache freshness and acceptance enforcement remain open under [Q14](OPEN-QUESTIONS.md#q14-exchange-host-owner-and-community-providers). Implementation remains pending.

## Provider unavailability during funding

If the provider becomes unavailable during escrow funding and funding completes but execution cannot start, Exchange returns the full escrow amount with no cancellation charge and no automatic provider substitution. The customer may request a fresh quote. Exchange pays the refund network fee; the separately paid initial funding network fee remains the customer’s cost. No-start evidence, funding/start/refund ordering, refund confirmation/timing and new quote/key enforcement remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner). Unknown execution-start outcomes still require reconciliation. Implementation remains pending.

For the refund after provider unavailability during funding, show Refund pending until the return transaction is confirmed, then Refund completed. Failed refund attempts remain pending for retry and reconciliation. Confirmation criteria, retry timing, reconciliation/escalation mechanics and status projection remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner).

Another attempt after a funded request fails because provider unavailability prevents execution start requires a new quote and a new idempotency key. The original key continues returning the original request and its refund status; it does not restart execution or reuse its escrow funding. New quote/key and separate-funding enforcement, pending-refund disclosure and independent reconciliation remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner).

A new attempt after funded provider-unavailability failure may proceed with separate funding while the original refund remains pending. Exchange clearly shows the pending refund. The new attempt requires a new quote and idempotency key; the original escrow cannot fund it. The original refund remains independently due and tracked. Implementation remains pending.

## Operational monitoring and recovery

Escalate a refund to the Exchange operator after 15 minutes pending, preserving Refund pending and continuing reconciliation and the refund obligation. This is an alert threshold, not a completion guarantee. Exchange must have a proactive monitoring and recovery process to mitigate avoidable escalations.

Proposed process owner: Exchange operations. Start with pending refunds; extend the same pattern to settlement, delivery recovery and host incidents under their existing rules. Persist obligations, react to events and run periodic reconciliation sweeps. Verify transaction and escrow state before bounded retries; an unknown outcome must not produce a duplicate refund. Track shared dependency problems, group related incidents, and preserve every overdue obligation. Escalation includes evidence and attempted recovery; verified completion closes the case. Monitor backlog age, automatic recovery rate, escalation rate and the monitoring worker itself.

Process mechanics remain proposed. They must preserve refund amounts and request-specific escrow, and must not bypass explicit provider resume or probe-retry requirements. Proposed retry accounting keeps the original pending timestamp across attempts. Operator permissions, evidence-resolution and refund-change approval rules, retry budgets/cadence, confirmation evidence, durable ownership, watchdog and operator acknowledgement remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner); host extensions also link to [Q14](OPEN-QUESTIONS.md#q14-exchange-host-owner-and-community-providers). Implementation is pending.

The recovery process may automatically reconcile state and retry transient failures. Conflicting evidence or changes to refund amounts or destinations require operator intervention. This does not grant unrestricted authority to alter refund entitlements or bypass existing request and escrow rules. Detailed failure classification, retry budgets and operator-action evidence remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner). Implementation remains pending.

Conflicting evidence or cases requiring operator intervention escalate immediately, without waiting 15 minutes. Affected payment actions pause while status checks continue. The 15-minute pending-refund threshold remains the fallback for unresolved routine delays; the refund obligation persists. Durable action-pause enforcement, reconciliation of already submitted transactions, operator acknowledgement and authorized resume/closure remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner). Implementation remains pending.

Before paused payment actions resume, the operator must record a resolution containing their identity, supporting evidence and the permitted recovery action. Acknowledging the alert alone does not resume payment actions. Resolution does not establish refund completion, which still requires confirmed return. Operator permission binding, resolution schema/evidence validation and atomic action-resume enforcement remain open under [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner). Implementation remains pending.

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

## No eligible provider

When no eligible provider is available, Exchange immediately returns No provider available without accepting, charging or queueing the request. The caller may retry later. Exchange does not relax the caller’s budget, access or task requirements. Response schema, safe explanation, retry timing, atomic pre-acceptance retry enforcement and selection/acceptance races remain open under [Q21](OPEN-QUESTIONS.md#q21-exchange-productnetwork-owner); provider loss during funding remains linked to [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner). Existing accepted-request outcome rules continue to apply. Implementation remains pending.

After No provider available, the caller may retry the unchanged request with the same idempotency key and Exchange rechecks availability. Once accepted, that key returns the existing request rather than creating another execution. Existing authenticated-caller scope and different-input/terms conflict rules remain applicable. Concurrent rechecks and atomic acceptance, retry timing, record retention/expiry and enforcement of the funding-loss refund rule remain open under [Q21](OPEN-QUESTIONS.md#q21-exchange-productnetwork-owner) and [Q4](OPEN-QUESTIONS.md#q4-exchange-commerce-owner).

## Product contribution

Providers can build a visible performance record from actual service use, while agents and applications contribute task outcomes. This supports the Exchange thesis of matching demand to community supply through evidence. The routing algorithm remains to be defined and tested.

The [machine record](QUALITY-EVIDENCE.json) preserves owner statements and separates selected direction from proposed mechanics. Earlier metric and routing records remain historical context.

## Open Questions

[Q21](OPEN-QUESTIONS.md#q21-exchange-productnetwork-owner) owns weights, freshness, confidence and newcomer routing. [Q22](OPEN-QUESTIONS.md#q22-exchange-productnetwork-owner) owns evidence integrity, evaluator contracts, consent mechanics, aggregate disclosure and retention. Feedback participation is resolved as optional; numerical thresholds remain open.
