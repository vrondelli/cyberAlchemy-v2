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

Providers may pause new requests while allowing already accepted requests to finish. Pausing does not cancel accepted work or change its terms, deadlines or applicable outcome rules. The host must stop new acceptance while existing work finishes. A provider pause persists across host restarts until the provider explicitly resumes sharing. Restarting the host does not reopen paused request acceptance. Providers can pause one offering or pause all offerings on a host. Both controls stop new acceptance within their scope, preserve accepted work and persist across restarts until explicit resume. Resuming a host preserves individually paused offerings until those offerings are explicitly resumed. Host and offering pause states are independent; new acceptance requires both relevant pause states to be clear. Clearing pause states does not override readiness or other eligibility checks. Paused offerings remain discoverable to their permitted audience, clearly marked paused, and excluded from new-request routing. Discovery visibility does not permit new request acceptance while paused. This applies to host and offering pauses; explicit selection cannot bypass the pause. Resuming request acceptance requires a fresh host-and-engine readiness check to pass before new requests are accepted. Explicit resume alone does not establish readiness. Failed or unknown readiness keeps new acceptance closed. Resume readiness includes a small synthetic test request to confirm that the engine can execute the offering, with bounded cost and timeout. This checks operational readiness separately from quality scoring. Independent pause-state implementation and authorization, pause/acceptance ordering, synthetic test inputs/pass criteria, resource limits, timeout, cost/usage accounting, readiness freshness and retry behavior, durable pause storage/recovery and discovery/routing status representation and propagation remain open under [Q14](OPEN-QUESTIONS.md#q14-exchange-host-owner-and-community-providers). Implementation is pending.

## Product contribution

Providers can build a visible performance record from actual service use, while agents and applications contribute task outcomes. This supports the Exchange thesis of matching demand to community supply through evidence. The routing algorithm remains to be defined and tested.

The [machine record](QUALITY-EVIDENCE.json) preserves owner statements and separates selected direction from proposed mechanics. Earlier metric and routing records remain historical context.

## Open Questions

[Q21](OPEN-QUESTIONS.md#q21-exchange-productnetwork-owner) owns weights, freshness, confidence and newcomer routing. [Q22](OPEN-QUESTIONS.md#q22-exchange-productnetwork-owner) owns evidence integrity, evaluator contracts, consent mechanics, aggregate disclosure and retention. Feedback participation is resolved as optional; numerical thresholds remain open.
