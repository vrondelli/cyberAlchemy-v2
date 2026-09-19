# v1.0.0 tasks — revision 2

Current frontier: P01 scope/evidence reconciliation, then P02 independent review and exact product decision. Historical decomposition states are not refreshed execution claims.

## P00 — Define the finite completion contract

Lane: product_construction. Owner: DomainSpec product owner. Stage: prototype-definition.

Dependencies: none.

Work:

- Record v1.0.0 completion scope: compiler, EVF integration, recovery/ORODI and migration
- Exclude UI U00-U05 from this release denominator; retain history and defer future UI scope
- Preserve separate release and operational decisions

Done criteria:

- Every promised outcome maps to a named milestone
- No universal code generation, universal proof, all-provider or production claim is implied

## C00 — Reconcile current compiler candidate and evidence

Lane: product_construction. Owner: DomainSpec compiler owner. Stage: source-baseline.

Dependencies: none.

Work:

- Read current package, source, lockfiles and release contract
- Resolve stale CRAFT/architecture status against newer same-lane receipts
- Identify exact existing commit for the first compiler verification epoch

Done criteria:

- Package/product identity is 1.0.0 with explicit supported runtime
- Historical CI is labeled historical unless exact commit and inputs match
- No existing working-tree work is overwritten

## O00 — Provide isolated compiler verification workspace

Lane: operational_support. Owner: Repository/release owner. Stage: compiler-product-test.

Dependencies: C00.

Work:

- Use an isolated checkout/export of the selected existing commit
- Verify Node 26.8.1, npm 11.19.0, Lean, Rust, Python and required container tools
- Preserve the shared dirty worktree; no commit or push under this node

Done criteria:

- The selected test/build commands can run against the exact source
- Missing tools are causal not_evaluable results
- No unrelated dirty files are cleaned or staged

Blocking basis: Exact toolchain and isolated source are prerequisites for C01/C02 product tests; unrelated environment work is excluded..

## C01 — Run complete compiler verification

Lane: product_construction. Owner: DomainSpec compiler owner. Stage: product-test.

Dependencies: O00.

Work:

- Execute each required verify:product phase with its real dependency edges
- Keep proof tests serial as the package requires
- Collect independent failures; do not call shell short-circuit omissions PASS

Done criteria:

- All required typecheck, system-integration, tests, contract tests, build, generated Rust and clean-package checks accounted for
- Required phases pass with no hidden skipped/todo or unevaluable checks
- Current evidence includes installed consumers

## C02 — Qualify the current deployment recipe without deploying

Lane: product_construction. Owner: DomainSpec compiler owner. Stage: product-test.

Dependencies: O00.

Work:

- Run the two-run L1 recipe qualification
- Verify Terraform/backendless validation and Docker bake checks
- Compare normalized certificates and retain raw run differences

Done criteria:

- Both runs pass the fixed required adapter denominator
- Certificate equivalence matches allowed normalization only
- No Terraform apply, cloud calls, image push or runtime deployment

## C03 — Prepare and independently verify immutable compiler bundle

Lane: product_construction. Owner: DomainSpec compiler owner. Stage: testable-product-candidate.

Dependencies: C01, C02.

Work:

- Run the clean-source release-candidate builder twice
- Verify inventories, SBOM, unsigned provenance and checksums offline
- Exercise tampering, source sensitivity and two isolated installed consumers

Done criteria:

- All packed and qualification bytes are accounted for
- Same inputs yield identical candidate bytes
- Mutation and wrong-source cases fail
- Unsigned provenance is not called publisher authentication

## C04 — Independent review of the exact compiler candidate

Lane: product_construction. Owner: DomainSpec compiler owner. Stage: product-review.

Dependencies: C03.

Work:

- Review source/package boundary, correctness, security findings and receipt consistency
- Separate inherited historical PASS from the current candidate
- Require an independent reviewer and join every finding

Done criteria:

- No unresolved candidate-blocking finding
- Reviewer identity and evidence scope explicit
- Changed bytes return through affected verification as a new epoch

## C05 — Compiler product approval

Lane: product_construction. Owner: DomainSpec compiler owner. Stage: product-approval.

Dependencies: C04.

Work:

- Present the exact candidate and evidence to the product owner
- Record approve/reject/defer against one immutable digest

Done criteria:

- An explicit owner approval names the current candidate digest
- No release/publication/runtime authority is inferred

## E00 — Reconcile EVF and conformance evidence

Lane: product_construction. Owner: DomainSpec conformance owner plus EVF owner. Stage: source-baseline.

Dependencies: none.

Work:

- Verify the exact EVF v3 candidate and selected approval/rehearsal records
- Identify existing conformance factory providers and Auth downstream records
- Locate the actual missing compiler-to-EVF contract

Done criteria:

- Do not rebuild or overwrite frozen EVF v3
- Each reused claim binds selected current bytes
- Broader integration is not assumed from a reference rehearsal

## E01 — Define one bounded compiler-to-EVF capability

Lane: product_construction. Owner: DomainSpec conformance owner plus EVF owner. Stage: prototype-definition.

Dependencies: E00.

Work:

- Select one compiler graph/obligation profile and independent consumer
- Define owned claims, obligation denominator, verdict semantics and excluded claims

Done criteria:

- The consumer and obligations are finite and nonempty
- PASS/BLOCK/not_evaluable cannot be collapsed into unlimited PASS
- No new authority is granted

## E02 — Design and compile the integration model

Lane: product_construction. Owner: DomainSpec conformance owner plus EVF owner. Stage: system-prototype.

Dependencies: E01.

Work:

- Author the profile, evidence-handle joins and source/consumer bindings
- Compile the DomainSpec model and trace it to business concepts
- Design providers as adapters around a pure verdict evaluator

Done criteria:

- All source/obligation/provider/consumer references close
- Reused evidence is exact-profile and exact-epoch
- No filesystem/network side effect inside the pure evaluator

## E03 — Implement a bounded compiler/EVF adapter

Lane: product_construction. Owner: DomainSpec conformance owner plus EVF owner. Stage: implementation-prototype.

Dependencies: E02.

Work:

- Add source/obligation translation and independently bound provider handles
- Reuse the EVF protocol via a successor adapter without changing frozen reference bytes
- Preserve non-pass and missing-evidence outcomes

Done criteria:

- No provider defines its own independent oracle silently
- Stale handles and mixed-run joins are rejected
- Exact write scope is confined to the selected adapter candidate

## E04 — Test integration end to end

Lane: product_construction. Owner: DomainSpec conformance owner plus EVF owner. Stage: product-test.

Dependencies: E03, C01.

Work:

- Run positive, deliberately broken, absent-provider and stale-evidence cases
- Replay with independent stores/processes
- Have an independent consumer recompute the bounded verdict

Done criteria:

- Every declared obligation has independent evidence
- Missing and unsupported providers remain visible
- Consumer rejects substituted or incomplete receipts
- Tests do not imply production/cross-host claims

## E05 — Review and approve integration candidate

Lane: product_construction. Owner: DomainSpec conformance owner plus EVF owner. Stage: product-approval.

Dependencies: E04.

Work:

- Obtain independent review
- Present exact adapter/profile/test manifest for owner product decision

Done criteria:

- No unresolved blocking finding
- Explicit approval binds exact bytes; reference adoption is not inherited

## R00 — Reconcile durable recovery architecture and existing code

Lane: product_construction. Owner: DomainSpec Workflow/runtime owner. Stage: source-baseline.

Dependencies: none.

Work:

- Inspect architecture @2, current in-process implementations and implementation findings
- Identify each already-implemented element versus designed component
- Select exact architecture/property/constraint dependencies

Done criteria:

- Do not recreate proven in-process planning
- Every durable component gap is tied to a source finding or inspected absence
- No provider selection is inferred from the logical architecture

## R01 — Define bounded recovery product and failure semantics

Lane: product_construction. Owner: DomainSpec Workflow/runtime owner. Stage: prototype-definition.

Dependencies: R00.

Work:

- Choose one local durable provider candidate and one language for the first product
- Define crash, retry, fencing, invocation identity and terminal behavior
- Model boundaries between coordination and Operation-owned business state

Done criteria:

- Finite recovery scenarios and exact guarantees stated
- At-least-once invocation is separate from idempotent semantic application
- No universal exactly-once promise

## R02 — Author recovery system prototype and binding contracts

Lane: product_construction. Owner: DomainSpec Workflow/runtime owner. Stage: system-prototype.

Dependencies: R01.

Work:

- Model store, Claim/Lease, Attempt, Retry, terminal state and operation ledger
- Compile the selected DomainSpec source
- Define transaction boundaries, generated contracts and schema evolution

Done criteria:

- All architecture invariants have an implementation owner and test obligation
- Coordination and Operation transactions remain distinct
- Technology choice is explicit and prototype-only

## R03 — Implement atomic coordination store

Lane: product_construction. Owner: DomainSpec Workflow/runtime owner. Stage: implementation-prototype.

Dependencies: R02.

Work:

- Persist immutable intent/plan, progress and dispatch state
- Add compare-and-set, transactional outbox and ownership checks
- Test rollback and concurrent writers

Done criteria:

- No partial dispatch/progress/outbox commit
- Version conflicts and duplicate identities reject
- Failed transaction preserves prior committed state

## R04 — Implement Operation replay ledger

Lane: product_construction. Owner: DomainSpec Workflow/runtime owner. Stage: implementation-prototype.

Dependencies: R02.

Work:

- Bind invocation identity to Operation-owned execution records
- Reconcile duplicate and unknown outcomes
- Keep business mutation atomic with the declared Operation receipt

Done criteria:

- Replay does not repeat a committed business effect
- Unknown outcomes remain explicit until reconciled
- The coordination store does not impersonate Operation transaction authority

## R05 — Implement fenced durable worker

Lane: product_construction. Owner: DomainSpec Workflow/runtime owner. Stage: implementation-prototype.

Dependencies: R03, R04.

Work:

- Acquire/renew leases and generation fencing
- Record unique attempts
- Resolve exact Operation bindings and advance monotonic progress

Done criteria:

- Expired or superseded claims cannot commit
- Two workers cannot own the same active generation
- Missing binding stops before invocation

## R06 — Implement persisted retries, terminal recording and restart

Lane: product_construction. Owner: DomainSpec Workflow/runtime owner. Stage: implementation-prototype.

Dependencies: R05.

Work:

- Persist bounded retry schedule
- Record evidence-bound terminal dispositions
- Reconcile restart from first incomplete occurrence and dispatch outbox

Done criteria:

- Restart loses no committed progress
- Retry ceiling and terminal state cannot be bypassed
- Replayed dispatch retains stable invocation identity

## R07 — Run recovery failure campaign

Lane: product_construction. Owner: DomainSpec Workflow/runtime owner. Stage: product-test.

Dependencies: R06.

Work:

- Inject crashes before/after each transaction boundary
- Exercise expired leases, duplicate delivery, partial failures, restart and replay
- Verify rollback/degraded behavior and evidence retention

Done criteria:

- All declared failure cases are exercised
- No skipped required scenario
- Local provider limits are explicit; no production claim

## R08 — Review and approve recovery product candidate

Lane: product_construction. Owner: DomainSpec Workflow/runtime owner. Stage: product-approval.

Dependencies: R07.

Work:

- Independently review transaction boundaries and failure evidence
- Obtain product owner decision for the selected provider/profile

Done criteria:

- Approval binds candidate and test manifest
- No deployment/provider activation is inferred

## L00 — Reconcile legacy import and dual-input inventory

Lane: product_construction. Owner: DomainSpec migration owner. Stage: source-baseline.

Dependencies: none.

Work:

- Compare IMPORT-MANIFEST with current implementation and receipts
- Locate remaining Markdown/TDE consumers and v1 assumptions
- Do not treat every old pending row as unfinished code

Done criteria:

- Every selected migration item has source, consumer and current disposition
- Frozen v1 is read-only
- No broad cleanup or removal is inferred

## L01 — Define retain, adapt or retire scope

Lane: product_construction. Owner: DomainSpec migration owner. Stage: prototype-definition.

Dependencies: L00.

Work:

- Propose dispositions for every selected legacy item
- Define JSON-to-obligation semantics for retained integration
- Define compatibility and rollback for any future retirement

Done criteria:

- No competing obligation denominator is invented
- All selected consumers have explicit compatibility requirements
- Retirement is proposed; no deletion happens here

## L02 — Implement and test migration candidates

Lane: product_construction. Owner: DomainSpec migration owner. Stage: implementation-prototype.

Dependencies: L01.

Work:

- Create retained bridges or replacement validators in successor scope
- Preserve legacy sources while testing parity
- Remove v1 path assumptions only in selected candidate files

Done criteria:

- Retained semantics match expected obligation and diagnostic outputs
- Unmapped material remains explicit
- No frozen source or historical approval is edited

## L03 — Verify selected migration closure

Lane: product_construction. Owner: DomainSpec migration owner. Stage: product-test.

Dependencies: L02.

Work:

- Check every selected import row and consumer
- Verify retraction/traceability claims only within declared bounds

Done criteria:

- Every selected row is implemented/tested or explicitly out of selected scope
- No silent abandoned requirement
- No destructive retirement or old-file deletion is performed

## L04 — Independently review and approve migration candidate

Lane: product_construction. Owner: DomainSpec migration owner. Stage: product-approval.

Dependencies: L03.

Work:

- Independently review the exact candidate and all selected test results
- Record the owner product decision bound to the candidate digest

Done criteria:

- Selected obligations have current passing evidence
- Independent review findings are resolved
- Owner decision names the exact approved candidate

## P01 — Join the selected products and revalidate shared contracts

Lane: product_construction. Owner: DomainSpec product owner. Stage: product-test.

Dependencies: P00, C05, E05, R08, L04.

Work:

- Build an exact compatibility matrix across the four selected candidates
- Rerun tests affected by shared contract/compiler changes
- Record cross-product failures without broadening the selected scope

Done criteria:

- All four candidate digests and dependencies agree
- No component uses stale shared contracts
- Deferred work and limits remain explicit

Remaining work:

- Reconcile the prepared four-product evidence against this revised P00/P01 contract
- Review exact candidate pins, dependency agreement and bounded compatibility claims; record gaps or a successor closure receipt
- Do not treat removal of UI as proof that P01 passed

## P02 — Independent final review and product decision

Lane: product_construction. Owner: DomainSpec product owner. Stage: product-approval.

Dependencies: P01.

Work:

- Have an independent reviewer assess exact milestone closure
- Present the joined candidate and bounded claims
- Record the final product owner decision

Done criteria:

- Every included outcome has passing current evidence and explicit approval
- Production/release/operational readiness are not inferred

## O01 — Inspect hosted compiler evidence for selected commit

Lane: operational_support. Owner: Repository/release owner. Stage: compiler-release-preparation.

Dependencies: C03.

Work:

- Read existing hosted run metadata and artifact provenance
- Compare exact source commit and input identities
- Report absence/failure; do not trigger a workflow

Done criteria:

- Either matching passing run/artifact is bound or missing evidence remains not_evaluable
- Earlier successful CI is not reused for newer bytes

Blocking basis: Required for the hosted release-evidence branch only; local product review continues independently..

## O02 — Decide exact hosted-run or source-publication envelope

Lane: operational_support. Owner: Repository/release owner. Stage: compiler-release-preparation.

Dependencies: C05, O01.

Work:

- If exact hosted evidence already exists, record that no new effect is needed
- Otherwise present exact workflow/ref/artifact scope and any separately needed source publication
- Obtain explicit owner decision

Done criteria:

- No implicit push, commit or workflow trigger
- Public/private boundary and exact source envelope are explicit

Blocking basis: No product-construction dependency; operational residue only..

## O03 — Complete hosted compiler evidence

Lane: operational_support. Owner: Repository/release owner. Stage: compiler-release-preparation.

Dependencies: O02, C03.

Work:

- Reuse matching O01 evidence or execute only the authorized hosted job
- Verify full product and L1 gates, artifact inventory and commit
- Stop on effectful failure

Done criteria:

- Exact source and artifacts agree with selected compiler candidate
- No incomplete/failed hosted run called release-ready

Blocking basis: No product-construction dependency; operational residue only..

## O04 — Decide exact compiler publication/release envelope

Lane: operational_support. Owner: Repository/release owner. Stage: compiler-release.

Dependencies: C05, O03.

Work:

- Specify package registry, visibility, signer, immutable artifact and rollback/support claims
- Obtain separate publication/release decision

Done criteria:

- Credential, private/public and artifact scopes are explicit
- Approval of product is not reused as release authority

Blocking basis: No product-construction dependency; operational residue only..

## O05 — Execute and independently verify compiler release

Lane: operational_support. Owner: Repository/release owner. Stage: compiler-release.

Dependencies: O04.

Work:

- Publish/sign/tag only within the selected envelope
- Independently install the released artifact and verify identities
- Record immutable release receipt

Done criteria:

- Released digest equals authorized artifact
- No history rewrite or scope expansion
- Stop at first release effect failure

Blocking basis: No product-construction dependency; operational residue only..

## O06 — Verify and reuse portable EVF kit owner handoff

Lane: operational_support. Owner: Existing portable EVF audit-kit owner; coordinate without reassignment. Stage: EVF-distribution.

Dependencies: E00.

Work:

- Coordinate with the existing packaging owner; BUILD-PLAN now records a completed local candidate
- Verify the exact archive and owner validation receipt before reusing reported tests; do not rebuild by default
- Keep remaining platform, licensing, distribution and delivery work with its owner and separate from product construction

Done criteria:

- Owner handoff and candidate identity reconciled
- Recorded local test claims checked against owner receipts before reuse
- No duplicate packaging, active-owner takeover or implicit distribution

Blocking basis: No product-construction dependency; operational residue only..

## O07 — Reconcile project status and continuation views

Lane: operational_support. Owner: Repository/release owner. Stage: no-product-stage.

Dependencies: C00, E00, R00, L00.

Work:

- Prepare exact edits to stale CRAFT/architecture/import navigation views
- Preserve historical decisions and distinguish facts from pending execution
- Route mutation with exact allowlist

Done criteria:

- No new completion state without owner evidence
- No digest refresh manufactures currentness
- This bookkeeping is not a prerequisite for prototypes

Blocking basis: No product-construction dependency; operational residue only..

## O08 — Define operational deployment candidate and runbooks

Lane: operational_support. Owner: Deployment/operator owner with ORODI definition owners. Stage: deployment-preparation.

Dependencies: R08, E05.

Work:

- Define one environment, provider, observability, credentials boundary and recovery criteria
- Reconcile ORODI successor requirements
- Prepare offline deployment/rollback/support rehearsal

Done criteria:

- Provider assumptions and operational claims are explicit
- No live account or infrastructure mutation
- Unresolved ORODI dependencies remain causal gaps

Blocking basis: No product-construction dependency; operational residue only..

## O09 — Decide exact live pilot/deployment envelope

Lane: operational_support. Owner: Deployment/operator owner with ORODI definition owners. Stage: deployment.

Dependencies: P02, O08.

Work:

- Obtain explicit environment, effects, credential and rollback authorization
- Choose a bounded pilot; do not inherit historical Body War authorization

Done criteria:

- Exact artifact, environment, participant and effect scope fixed
- No production status implied by approval alone

Blocking basis: No product-construction dependency; operational residue only..

## O10 — Run authorized live pilot and operational closeout

Lane: operational_support. Owner: Deployment/operator owner with ORODI definition owners. Stage: production-operations.

Dependencies: O09.

Work:

- Execute the authorized deployment/pilot
- Exercise monitoring, recovery and support requirements
- Independently record outcomes and remaining limits

Done criteria:

- All selected operational checks pass for exact environment
- Failures stop successor effects
- Offline tests are not substituted for live evidence

Blocking basis: No product-construction dependency; operational residue only..
