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

Selected readiness probe: Resume readiness includes a small synthetic test request to confirm that the engine can execute the offering, with bounded cost and timeout. This checks operational readiness separately from quality scoring. Synthetic inputs/pass criteria, resource budget, timeout, probe cost ownership and usage accounting remain open.

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

## Q22: Exchange product/network owner

Resolved: Exchange offers an evaluator; other parties may offer evaluators, and users may run their own evaluation and publish scores. Scores appear publicly. Other users can validate them; sustained consumption and performance over time also count as validation evidence. Applications can supply explicit success/failure feedback. Feedback is optional in the MVP, with support for automatic reporting where applications have objective checks. Missing feedback remains unknown. Prompts and responses are private by default; aggregate performance can be public, and task-content sharing with independent evaluators requires explicit consent.

How are evaluator versions, consumption-linked feedback, consumer independence, contradictions, consent mechanics, aggregate disclosure and retention handled?

Affects: scoring trust and feedback contracts. [Selected direction and candidate mechanics](QUALITY-EVIDENCE.md). Publication, usage and consumer reports have distinct evidence limits; aggregation policy is still open.

## Q23: Exchange product owner

Resolved: CODE_GENERATION, STRUCTURED_EXTRACTION and TEXT_SUMMARIZATION are selected categories. Research is requested; RESEARCH is its proposed identifier. DOMAIN_MODELING is confirmed as the fifth intent. These intents should be capabilities callable by agents and applications. Providers define input/output and execution limits, acceptance checks and price through Exchange standard contract, with accepted terms fixed per request. Requests exceeding declared limits are rejected before acceptance with zero charge and a clear explanation; no silent truncation or price increases. Provider deadline misses on accepted requests are non-billable provider failures; clock, deadline evidence and terminal-event ordering remain open.

Which initial intent profiles, schemas, measurement units, compatible objective checks, research tools and limit-enforcement behavior implement the standard offering contract?

Affects: Define task contracts before choosing benchmark/scoring implementation. Detailed contracts remain candidate.

Candidate definitions: [first five intents](INFERENCE-INTENTS.md).
