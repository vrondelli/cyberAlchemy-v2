# How Exchange capabilities advance the product thesis

Status: proposed MVP capability composition. Owner: Exchange product owner.
Machine source: [plan.json](plan.json). [Thesis](../../PRODUCT-THESIS.md).

A capability is an outcome Exchange enables repeatedly for a participant. A screen,
API route, database or compiler is a realization detail. Lab, ARE and Craft + Alch
are offerings; acquiring a version is the Exchange capability that makes them usable
as offerings. Existing EX-C identifiers retain their implementation-inventory roles.

## Thesis outcomes

- **V1 — Make useful work available:** Providers spend less effort turning a project, local engine or authored service into something others can use.
- **V2 — Obtain and use what was offered:** Buyers and callers understand the deliverable and terms, then successfully obtain access or an execution result.
- **V3 — Run Alch without operating servers:** Authors supply supported behavior and Exchange supplies managed operation.
- **V4 — Participate through software:** Agents and applications complete authorized operations through the same contracts as human clients.
- **V5 — Return with confidence:** Clear commitments, bounded costs and recovery make repeat participation practical.

## Capability-to-value map

| Capability | Customer outcome | Why it advances the thesis | Values | Existing slices |
| --- | --- | --- | --- | --- |
| MVP-C01 — **Participate with explicit authority** | A participant can act in permitted scopes with clear separation between their identity, tenant, wallet and provider role. | An existing member can supply or consume without rebuilding identity and authorization for each offering. | V1, V2, V4 | EX-C07 |
| MVP-C02 — **Publish a usable offering** | A provider can publish a versioned offering with its deliverable, eligibility and free/paid terms. | Reusable listing and terms replace per-provider storefront and delivery setup. | V1, V2 | EX-C01, EX-C06, EX-C16 |
| MVP-C03 — **Discover and choose on clear terms** | A participant can find an eligible offering and understand what they receive, its terms and current service availability before committing. | One catalog removes repeated interpretation across projects and executable services. | V2, V4 | EX-C01, EX-C13 |
| MVP-C04 — **Acquire a project version** | A buyer acquires the selected project edition/version, receives decryptable access, and retains a recoverable purchase record. | Project sale becomes a usable product with exact access and durable recovery. | V1, V2, V5 | EX-C09, EX-C10, EX-C11, EX-C12 |
| MVP-C05 — **Share and use community inference** | A member makes a local engine available and another member invokes it under free or paid terms. | Members can use community models without reproducing each provider’s model installation. | V1, V2, V4 | EX-C05, EX-C06, EX-C07, EX-C08 |
| MVP-C06 — **Buy managed execution of Alch** | A customer submits supported Alch source and obtains an operated callable service under agreed hosting terms. | The author supplies behavior while Exchange takes on server operation. | V1, V3, V4 | EX-C02, EX-C03, EX-C04, EX-C16 |
| MVP-C07 — **Control commercial commitments** | Participants can agree to a price/budget, distinguish observed usage from money due, and inspect settled or unresolved obligations. | Explicit costs and payment evidence make free sharing and paid participation understandable. | V1, V2, V5 | EX-C11, EX-C14, EX-C05, EX-C16 |
| MVP-C08 — **Recover without losing commitment** | A participant can identify what happened and safely resume the relevant operation after interruption. | Failures do not force support staff to guess whether payment, execution or access succeeded. | V2, V5 | EX-C08, EX-C12, EX-C03, EX-C04 |
| MVP-C09 — **Complete the journey through API or UI** | A participant can discover, commit, invoke, inspect and recover using the same authenticated product contracts through either interface. | Software can participate without scripting a human-only checkout or receiving broad operator credentials. | V2, V4 | EX-C13, EX-C07 |
| MVP-C10 — **Keep the Exchange operable** | Operators can observe availability and outstanding obligations, control services and recover the selected deployment. | Participants can rely on repeat use because the product can be maintained and recovered. | V1, V3, V5 | EX-C03, EX-C04, EX-C14 |

## Evidence, gaps and acceptance

No capability below is claimed complete as an integrated Exchange capability.
Recorded source tests support the listed slices and retain their original limits.

### MVP-C01 — Participate with explicit authority

**Remaining:** Unify existing inference, host and purchase identity bindings; choose onboarding and wallet-linking flow.

Acceptance examples:

- Two independent principals use permitted resources and cannot read, invoke or manage each other’s private resources.
- Revocation is checked before an invocation or retained-result replay.
- Tenant membership alone grants no invocation; free inference does not require a payment wallet solely to exist.

**Customer measure:** Time from joining to first authorized provider or caller action.

**Counterevidence:** Each service requires unrelated accounts or role membership silently grants broad access.

Sources: [S030](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/README.md) [S031](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/STRUCTURAL-MODEL-APPROVAL.json) [S032](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/IMPLEMENTATION.md) [S033](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/durable/README.md) [S034](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/renewal/README.md) [S035](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/ingress/README.md)

### MVP-C02 — Publish a usable offering

**Remaining:** Build provider publication/editing, typed offering templates and versioned terms; current catalogs are slice-specific.

Acceptance examples:

- Create project, inference and managed-hosting listings through UI and API.
- ARE Static and Full bind distinct package/edition manifests.
- Changing price or content creates successor terms; existing accepted requests retain their version.
- Selecting free inference produces no payment obligation; paid mode is explicit before invocation.

**Customer measure:** Time and manual work to publish the first usable offering.

**Counterevidence:** A listing is only a description and still needs manual arrangements to become usable.

Sources: [S010](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/discovery/README.md) [S011](../../../../capabilities/project-purchase/v1/README.md) [S016](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/README.md) [S027](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/vllm/README.md) [S028](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/VLLM-RESULT.json) [S029](../../../../../tools/inference-reference) [S068](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/serverless-function-v1/README.md)

### MVP-C03 — Discover and choose on clear terms

**Remaining:** Create common catalog/detail/search and projection contracts, preserving type-specific fields.

Acceptance examples:

- One catalog includes Lab, ARE editions, Craft + Alch, managed hosting and free/paid inference examples.
- Discovery separates declared capability, price and last observed availability; unavailable engines are not represented as ready.
- Provider addresses, credentials and private project data are absent from public responses.

**Customer measure:** Time from discovery to a correctly understood first request.

**Counterevidence:** Buyers need an operator to explain edition contents, price or delivery after selecting an offering.

Sources: [S010](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/discovery/README.md) [S011](../../../../capabilities/project-purchase/v1/README.md) [S012](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-service-client-v1/README.md) [S045](../../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/README.md) [S051](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/OPERATOR.md)

### MVP-C04 — Acquire a project version

**Remaining:** Bind catalog package/edition to the existing purchase flow and shared participant identity; real-money correctness remains unresolved.

Acceptance examples:

- Purchase the exact listed artifact and edition using independent seller/buyer identities.
- Before commitment, expiry refunds; after commitment, payment and membership persist across interrupted delivery.
- Unlock grants, pays and commits atomically; retry cannot pay twice.
- Client verifies/decrypts and records acknowledgement; Static buyer receives only the selected Static package.

**Customer measure:** Successful purchase-to-first-use rate and recovery completion rate.

**Counterevidence:** A successful payment leaves the buyer unable to obtain the promised usable package.

Sources: [S004](../../../../../define/reviews/cyberalchemy-exchange/DECRYPTION-SETTLEMENT-DESIGN.md) [S006](../../../../knowledge-exchange-protocol/authority/definitions/DEFINITIONS.md) [S007](../../../../knowledge-exchange-protocol/business-ontology.json) [S011](../../../../capabilities/project-purchase/v1/README.md) [S041](../../../../knowledge-exchange-protocol/README.md) [S042](../../../../knowledge-exchange-protocol/capabilities/solana-coownership/README.md) [S043](../../../../knowledge-exchange-protocol/capabilities/durable-storage/README.md) [S044](../../../../knowledge-exchange-protocol/capabilities/durable-storage/runtime/README.md) [S045](../../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/README.md) [S046](../../../../capabilities/project-purchase/v1/construction.json) [S047](../../../../capabilities/project-purchase/v1/definition-pack.json) [S048](../../../../capabilities/project-purchase/v1/evidence/deployment-completion.json) [S049](../../../../capabilities/project-purchase/v1/evidence/deployment-sbf-test-report.json) [S050](../../../../capabilities/project-purchase/v1/DEVNET-READINESS.md)

### MVP-C05 — Share and use community inference

**Remaining:** Provide member-to-member connectivity, engine publication, controls and paid settlement; current loopback/SSH paths do not prove general connectivity.

Acceptance examples:

- Two separately operated participant contexts complete JSON and SSE inference.
- Provider chooses free or paid and sets allowed access/limits; caller sees terms before invoking.
- Disconnects, timeouts and partial streams preserve unknown outcomes; no unsafe retry or zero-usage assumption.
- Free requests incur no charge; paid requests follow the chosen metering and settlement contract.

**Customer measure:** Time to first shared invocation; repeat calls across independent providers and callers.

**Counterevidence:** Engine sharing still requires an administrator to hand-configure each caller connection.

Sources: [S021](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/README.md) [S022](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/PROTOCOL.md) [S023](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/RESULT.md) [S024](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/vllm/LIVE-RESULT.json) [S025](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/stream/README.md) [S026](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/invocation/README.md) [S027](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/vllm/README.md) [S028](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/VLLM-RESULT.json) [S029](../../../../../tools/inference-reference) [S030](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/README.md) [S031](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/STRUCTURAL-MODEL-APPROVAL.json) [S032](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/IMPLEMENTATION.md) [S033](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/durable/README.md) [S034](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/renewal/README.md) [S035](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/ingress/README.md) [S036](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/custody/README.md) [S037](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/durable-custody/README.md) [S038](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/reconciliation/README.md) [S039](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/provider-evidence/PLAN.md) [S040](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/protected-rehearsal/README.md)

### MVP-C06 — Buy managed execution of Alch

**Remaining:** Unify upload/build/prepare/activate with hosting agreement, endpoint access, lifecycle and billing; local host primitives do not establish commercial hosting.

Acceptance examples:

- Submit one supported Alch file, receive build diagnostics, explicitly activate, and call the resulting endpoint.
- Observe revision, status, usage and cost; drain/restart with retained state according to the selected contract.
- Stop/terminate has an explicit execution and charging cutoff; unknown termination cannot be reported as final.
- Unsupported profiles, unauthorized source/secret access and over-limit execution fail with defined outcomes.

**Customer measure:** Time from submitted source to first successful external call and customer server-management effort.

**Counterevidence:** Customers must provision or manually repair the hosting environment to use their submitted service.

Sources: [S012](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-service-client-v1/README.md) [S013](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/local-control-plane-v1/README.md) [S014](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/async-control-plane-v1/README.md) [S015](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/semantic-corrections-v1/README.md) [S016](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/README.md) [S017](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/product-test.json) [S018](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/execution.json) [S019](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/compatible-upgrades-v1/README.md) [S020](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/state-migrations-v1/README.md) [S068](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/serverless-function-v1/README.md)

### MVP-C07 — Control commercial commitments

**Remaining:** Project settlement exists locally; paid inference, hosting metering, prices and platform fee policy need contracts and implementation.

Acceptance examples:

- Each paid action pins terms, price unit and spending authorization before chargeable work.
- A free offering creates no billable obligation.
- Duplicate processing cannot create a duplicate obligation or settlement; uncertain chain/provider results remain visible.
- Observed usage, provisional charges, finalized payments/refunds and provider earnings have distinct records.

**Customer measure:** Unexpected-charge and disputed-obligation rate; provider ability to reconcile actual earnings.

**Counterevidence:** Usage counters are shown as finalized bills or payment is retried on an ambiguous response.

Sources: [S011](../../../../capabilities/project-purchase/v1/README.md) [S016](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/README.md) [S021](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/README.md) [S022](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/PROTOCOL.md) [S023](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/RESULT.md) [S024](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/vllm/LIVE-RESULT.json) [S025](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/stream/README.md) [S026](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/invocation/README.md) [S046](../../../../capabilities/project-purchase/v1/construction.json) [S047](../../../../capabilities/project-purchase/v1/definition-pack.json) [S048](../../../../capabilities/project-purchase/v1/evidence/deployment-completion.json) [S049](../../../../capabilities/project-purchase/v1/evidence/deployment-sbf-test-report.json) [S050](../../../../capabilities/project-purchase/v1/DEVNET-READINESS.md) [S052](../../../../capabilities/project-purchase/v1/deployment/PLAN.md) [S053](../../../../capabilities/project-purchase/v1/deployment/public.json) [S054](../../../../capabilities/project-purchase/v1/deployment/envelope.json) [S055](../../../../capabilities/project-purchase/v1/deployment/preflight.json) [S056](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/manifest.json) [S068](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/serverless-function-v1/README.md)

### MVP-C08 — Recover without losing commitment

**Remaining:** Create a common activity/recovery view over typed backend facts, with current authorization and explicit resolution paths.

Acceptance examples:

- Restart during project delivery, inference execution and hosting activation; show typed committed/pending/unknown state.
- Recover a paid artifact without refunding committed ownership; replay only authorized retained JSON inference.
- Do not promise stream replay or remote compute cancellation from local disconnect.
- Present an operator resolution path where automatic recovery cannot establish the outcome.

**Customer measure:** Recovery success without manual data repair and time to a definitive outcome.

**Counterevidence:** The UI guesses success or retries billable work because a network response was lost.

Sources: [S004](../../../../../define/reviews/cyberalchemy-exchange/DECRYPTION-SETTLEMENT-DESIGN.md) [S011](../../../../capabilities/project-purchase/v1/README.md) [S016](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/README.md) [S017](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/product-test.json) [S018](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/execution.json) [S019](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/compatible-upgrades-v1/README.md) [S020](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/state-migrations-v1/README.md) [S036](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/custody/README.md) [S037](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/durable-custody/README.md) [S038](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/reconciliation/README.md) [S039](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/provider-evidence/PLAN.md) [S040](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/protected-rehearsal/README.md)

### MVP-C09 — Complete the journey through API or UI

**Remaining:** Build one coherent application and contract surface; existing CLIs and browser clients are separate.

Acceptance examples:

- An API client and a browser independently complete each selected journey with equivalent outcomes.
- Private signing/decryption remains client-side; application authentication does not transfer wallet or content-key custody.
- Stable request identity and typed errors let clients distinguish retryable, rejected and unresolved actions.

**Customer measure:** API task completion and number of manual interventions per journey.

**Counterevidence:** Key domain operations exist only as buttons or require access to internal administrator endpoints.

Sources: [S011](../../../../capabilities/project-purchase/v1/README.md) [S012](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-service-client-v1/README.md) [S030](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/README.md) [S031](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/STRUCTURAL-MODEL-APPROVAL.json) [S032](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/IMPLEMENTATION.md) [S033](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/durable/README.md) [S034](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/renewal/README.md) [S035](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/security/ingress/README.md) [S045](../../../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/README.md) [S051](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/OPERATOR.md)

### MVP-C10 — Keep the Exchange operable

**Remaining:** Aggregate current service health, queued work, payment/recovery incidents and deployment configuration with scoped operator actions.

Acceptance examples:

- Observe distinct selected revision, desired state and runtime health.
- Exercise bounded overload, restart and backup recovery with exact candidate configuration.
- An operator cannot use lifecycle access to obtain participant private keys or plaintext.

**Customer measure:** Time to detect and resolve failed fulfillment; availability during the pilot.

**Counterevidence:** A passing demo cannot be restarted or an operator must edit databases to recover commitments.

Sources: [S016](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/README.md) [S017](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/product-test.json) [S018](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/host-lifecycle-v1/execution.json) [S019](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/compatible-upgrades-v1/README.md) [S020](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/state-migrations-v1/README.md) [S052](../../../../capabilities/project-purchase/v1/deployment/PLAN.md) [S053](../../../../capabilities/project-purchase/v1/deployment/public.json) [S054](../../../../capabilities/project-purchase/v1/deployment/envelope.json) [S055](../../../../capabilities/project-purchase/v1/deployment/preflight.json) [S056](../../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1/local-pattern/product/manifest.json)

## Measurement boundary

Product tests establish whether a path behaves as specified. Pilot observations
establish whether it reduces customer effort and supports repeat use. Record
baseline setup/workaround effort before the pilot and the same measures afterward,
with participant counts and observed failures. Do not invent thresholds or infer
market demand from test totals. A failed mechanism or absent customer benefit is
a reason to revisit the capability or thesis.

## Open Questions

[The decision register](../../OPEN-QUESTIONS.md) owns unresolved definitions and
commercial/runtime choices. Each capability’s exact question refs are in plan.json.
