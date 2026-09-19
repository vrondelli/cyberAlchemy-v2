# DomainSpec v2 completion task cards

Planning candidate. All nodes are planned; no execution or approval is recorded. Dependency readiness means the preceding evidence can support starting the task, subject to exact source scope and owner availability.

Source of truth: [plan.json](plan.json). Overview: [PLAN.md](PLAN.md).

<a id="p00"></a>

## P00 — Define the finite completion contract

**Lane:** `product_construction` · **Stage:** `prototype-definition` · **Owner role:** DomainSpec product owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

None in this DAG; baseline and scope reconciliation are the work.

**Work**

- Confirm the five selected product milestones and exact supported scope
- Separate Stable 1.0 compiler completion from runtime/UI expansion and release
- Record unselected research as explicit deferred scope

**Deliverables**

- Completion contract with included/excluded outcomes
- Per-track claim and evidence denominator

**Completion criteria**

- Every promised outcome maps to a named milestone
- No universal code generation, universal proof, all-provider or production claim is implied

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/completion-dag`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-ROOT, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/P00/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="c00"></a>

## C00 — Reconcile current compiler candidate and evidence

**Lane:** `product_construction` · **Stage:** `source-baseline` · **Owner role:** DomainSpec compiler owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

None in this DAG; baseline and scope reconciliation are the work.

**Work**

- Read current package, source, lockfiles and release contract
- Resolve stale CRAFT/architecture status against newer same-lane receipts
- Identify exact existing commit for the first compiler verification epoch

**Deliverables**

- Compiler source/dependency inventory
- Reuse-versus-rerun evidence matrix
- Exact test-phase dependency graph

**Completion criteria**

- Package/product identity is 1.0.0 with explicit supported runtime
- Historical CI is labeled historical unless exact commit and inputs match
- No existing working-tree work is overwritten

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/development/stable-1-release-candidate`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-CLI, S-RC, S-COMPAT; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/C00/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="o00"></a>

## O00 — Provide isolated compiler verification workspace

**Lane:** `operational_support` · **Stage:** `compiler-product-test` · **Owner role:** Repository/release owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [C00](#c00): The workspace must contain the selected exact compiler commit and pinned dependencies.

**Work**

- Use an isolated checkout/export of the selected existing commit
- Verify Node 26.8.1, npm 11.19.0, Lean, Rust, Python and required container tools
- Preserve the shared dirty worktree; no commit or push under this node

**Deliverables**

- Environment receipt
- Clean source identity and toolchain inventory

**Completion criteria**

- The selected test/build commands can run against the exact source
- Missing tools are causal not_evaluable results
- No unrelated dirty files are cleaned or staged

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-CLI, S-RC; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/O00/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

Affected stage: `compiler-product-test`. Exact toolchain and isolated source are prerequisites for C01/C02 product tests; unrelated environment work is excluded.

<a id="c01"></a>

## C01 — Run complete compiler verification

**Lane:** `product_construction` · **Stage:** `product-test` · **Owner role:** DomainSpec compiler owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [O00](#o00): Verification needs the exact isolated source and toolchain.

**Work**

- Execute each required verify:product phase with its real dependency edges
- Keep proof tests serial as the package requires
- Collect independent failures; do not call shell short-circuit omissions PASS

**Deliverables**

- Per-phase results and raw logs
- Source/tool/output bindings
- Compiler failure inventory

**Completion criteria**

- All required typecheck, system-integration, tests, contract tests, build, generated Rust and clean-package checks accounted for
- Required phases pass with no hidden skipped/todo or unevaluable checks
- Current evidence includes installed consumers

**Verification**

- From projects/domainspec-v2/impl/cli: npm run verify:product is the existing aggregate contract.
- For collect-all accounting, use its package.json phase list and actual dependencies; independently runnable checks continue after a failure.
- Any failed input/build prerequisite makes only its dependent checks not_evaluable.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/development/stable-1-release-candidate`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-CLI, S-RC, S-COMPAT; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/C01/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="c02"></a>

## C02 — Qualify the current deployment recipe without deploying

**Lane:** `product_construction` · **Stage:** `product-test` · **Owner role:** DomainSpec compiler owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [O00](#o00): Qualification needs pinned OCI tools and the exact compiler source.

**Work**

- Run the two-run L1 recipe qualification
- Verify Terraform/backendless validation and Docker bake checks
- Compare normalized certificates and retain raw run differences

**Deliverables**

- Exact L1 qualification profile
- Two run evidence sets
- Certificate equivalence result

**Completion criteria**

- Both runs pass the fixed required adapter denominator
- Certificate equivalence matches allowed normalization only
- No Terraform apply, cloud calls, image push or runtime deployment

**Verification**

- From the CLI package: npm run recipe-qualification:l1
- Missing namespaces/container access/provider tooling yields not_evaluable, not an isolation bypass.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/development/stable-1-release-candidate`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-CLI, S-RC, S-COMPAT; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/C02/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="c03"></a>

## C03 — Prepare and independently verify immutable compiler bundle

**Lane:** `product_construction` · **Stage:** `testable-product-candidate` · **Owner role:** DomainSpec compiler owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [C01](#c01): Only a passing exact compiler can form the selected bundle.
- [C02](#c02): Bundle must include current two-run L1 qualification.

**Work**

- Run the clean-source release-candidate builder twice
- Verify inventories, SBOM, unsigned provenance and checksums offline
- Exercise tampering, source sensitivity and two isolated installed consumers

**Deliverables**

- Candidate bundle and manifest
- Two-build equality result
- Offline verification and negative-test evidence

**Completion criteria**

- All packed and qualification bytes are accounted for
- Same inputs yield identical candidate bytes
- Mutation and wrong-source cases fail
- Unsigned provenance is not called publisher authentication

**Verification**

- npm run release-candidate:prepare -- --qualification-evidence-root <absolute-evidence> --output-root <new-root> --source-commit <selected-commit>
- npm run release-candidate:verify -- --bundle-root <absolute-bundle> --expected-source-commit <selected-commit>

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/development/stable-1-release-candidate`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-CLI, S-RC, S-COMPAT; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/C03/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="c04"></a>

## C04 — Independent review of the exact compiler candidate

**Lane:** `product_construction` · **Stage:** `product-review` · **Owner role:** DomainSpec compiler owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [C03](#c03): Review must bind the finished bundle and all test results.

**Work**

- Review source/package boundary, correctness, security findings and receipt consistency
- Separate inherited historical PASS from the current candidate
- Require an independent reviewer and join every finding

**Deliverables**

- Digest-bound review report
- Finding disposition table

**Completion criteria**

- No unresolved candidate-blocking finding
- Reviewer identity and evidence scope explicit
- Changed bytes return through affected verification as a new epoch

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/development/stable-1-release-candidate`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-CLI, S-RC, S-COMPAT; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/C04/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="c05"></a>

## C05 — Compiler product approval

**Lane:** `product_construction` · **Stage:** `product-approval` · **Owner role:** DomainSpec compiler owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [C04](#c04): Owner reviews one independently reviewed tested candidate.

**Work**

- Present the exact candidate and evidence to the product owner
- Record approve/reject/defer against one immutable digest

**Deliverables**

- Owner decision for compiler product candidate

**Completion criteria**

- An explicit owner approval names the current candidate digest
- No release/publication/runtime authority is inferred

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/development/stable-1-release-candidate`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-CLI, S-RC, S-COMPAT; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/C05/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: product_approval. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="e00"></a>

## E00 — Reconcile EVF and conformance evidence

**Lane:** `product_construction` · **Stage:** `source-baseline` · **Owner role:** DomainSpec conformance owner plus EVF owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

None in this DAG; baseline and scope reconciliation are the work.

**Work**

- Verify the exact EVF v3 candidate and selected approval/rehearsal records
- Identify existing conformance factory providers and Auth downstream records
- Locate the actual missing compiler-to-EVF contract

**Deliverables**

- Current EVF evidence inventory
- Gap map distinguishing proven reference behavior from proposed integration

**Completion criteria**

- Do not rebuild or overwrite frozen EVF v3
- Each reused claim binds selected current bytes
- Broader integration is not assumed from a reference rehearsal

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/implementation-conformance`, `projects/domainspec-v2/impl/architecture-conformance`, `projects/domainspec-v2/development/evolvable-validation-framework`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-EVF, S-EVF-APPROVAL, S-FACTORY, S-CONFORMANCE; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/E00/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="e01"></a>

## E01 — Define one bounded compiler-to-EVF capability

**Lane:** `product_construction` · **Stage:** `prototype-definition` · **Owner role:** DomainSpec conformance owner plus EVF owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [E00](#e00): Integration meaning depends on the real reusable EVF boundary.

**Work**

- Select one compiler graph/obligation profile and independent consumer
- Define owned claims, obligation denominator, verdict semantics and excluded claims

**Deliverables**

- Definition/product scope
- Business ontology scaffold
- Positive/negative fixture intent

**Completion criteria**

- The consumer and obligations are finite and nonempty
- PASS/BLOCK/not_evaluable cannot be collapsed into unlimited PASS
- No new authority is granted

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/implementation-conformance`, `projects/domainspec-v2/impl/architecture-conformance`, `projects/domainspec-v2/development/evolvable-validation-framework`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-EVF, S-EVF-APPROVAL, S-FACTORY, S-CONFORMANCE; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/E01/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="e02"></a>

## E02 — Design and compile the integration model

**Lane:** `product_construction` · **Stage:** `system-prototype` · **Owner role:** DomainSpec conformance owner plus EVF owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [E01](#e01): System design preserves the selected business meanings.

**Work**

- Author the profile, evidence-handle joins and source/consumer bindings
- Compile the DomainSpec model and trace it to business concepts
- Design providers as adapters around a pure verdict evaluator

**Deliverables**

- DomainSpec source candidate
- Compiled graph/system scaffold
- Exact adapter/evaluator contracts

**Completion criteria**

- All source/obligation/provider/consumer references close
- Reused evidence is exact-profile and exact-epoch
- No filesystem/network side effect inside the pure evaluator

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/implementation-conformance`, `projects/domainspec-v2/impl/architecture-conformance`, `projects/domainspec-v2/development/evolvable-validation-framework`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-EVF, S-EVF-APPROVAL, S-FACTORY, S-CONFORMANCE; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/E02/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="e03"></a>

## E03 — Implement a bounded compiler/EVF adapter

**Lane:** `product_construction` · **Stage:** `implementation-prototype` · **Owner role:** DomainSpec conformance owner plus EVF owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [E02](#e02): Implementation must follow the compiled contract.

**Work**

- Add source/obligation translation and independently bound provider handles
- Reuse the EVF protocol via a successor adapter without changing frozen reference bytes
- Preserve non-pass and missing-evidence outcomes

**Deliverables**

- Adapter candidate
- Source/implementation mapping
- Unit-level evidence

**Completion criteria**

- No provider defines its own independent oracle silently
- Stale handles and mixed-run joins are rejected
- Exact write scope is confined to the selected adapter candidate

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/implementation-conformance`, `projects/domainspec-v2/impl/architecture-conformance`, `projects/domainspec-v2/development/evolvable-validation-framework`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-EVF, S-EVF-APPROVAL, S-FACTORY, S-CONFORMANCE; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/E03/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="e04"></a>

## E04 — Test integration end to end

**Lane:** `product_construction` · **Stage:** `product-test` · **Owner role:** DomainSpec conformance owner plus EVF owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [E03](#e03): Exercise the actual adapter.
- [C01](#c01): Bind tested compiler behavior for the selected source profile.

**Work**

- Run positive, deliberately broken, absent-provider and stale-evidence cases
- Replay with independent stores/processes
- Have an independent consumer recompute the bounded verdict

**Deliverables**

- Integration test receipt
- Consumer verification receipt
- Mutation coverage and semantic replay evidence

**Completion criteria**

- Every declared obligation has independent evidence
- Missing and unsupported providers remain visible
- Consumer rejects substituted or incomplete receipts
- Tests do not imply production/cross-host claims

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/implementation-conformance`, `projects/domainspec-v2/impl/architecture-conformance`, `projects/domainspec-v2/development/evolvable-validation-framework`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-EVF, S-EVF-APPROVAL, S-FACTORY, S-CONFORMANCE; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/E04/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="e05"></a>

## E05 — Review and approve integration candidate

**Lane:** `product_construction` · **Stage:** `product-approval` · **Owner role:** DomainSpec conformance owner plus EVF owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [E04](#e04): Approval binds exact integration test evidence.

**Work**

- Obtain independent review
- Present exact adapter/profile/test manifest for owner product decision

**Deliverables**

- Review and owner decision

**Completion criteria**

- No unresolved blocking finding
- Explicit approval binds exact bytes; reference adoption is not inherited

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/implementation-conformance`, `projects/domainspec-v2/impl/architecture-conformance`, `projects/domainspec-v2/development/evolvable-validation-framework`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-EVF, S-EVF-APPROVAL, S-FACTORY, S-CONFORMANCE; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/E05/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: product_approval. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="r00"></a>

## R00 — Reconcile durable recovery architecture and existing code

**Lane:** `product_construction` · **Stage:** `source-baseline` · **Owner role:** DomainSpec Workflow/runtime owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

None in this DAG; baseline and scope reconciliation are the work.

**Work**

- Inspect architecture @2, current in-process implementations and implementation findings
- Identify each already-implemented element versus designed component
- Select exact architecture/property/constraint dependencies

**Deliverables**

- Component implementation inventory
- Selected invariant source manifest

**Completion criteria**

- Do not recreate proven in-process planning
- Every durable component gap is tied to a source finding or inspected absence
- No provider selection is inferred from the logical architecture

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/architecture/durable-recovery`, `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/impl/system-integration`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-RECOVERY, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/R00/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="r01"></a>

## R01 — Define bounded recovery product and failure semantics

**Lane:** `product_construction` · **Stage:** `prototype-definition` · **Owner role:** DomainSpec Workflow/runtime owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [R00](#r00): Scope must build from current architecture and code.

**Work**

- Choose one local durable provider candidate and one language for the first product
- Define crash, retry, fencing, invocation identity and terminal behavior
- Model boundaries between coordination and Operation-owned business state

**Deliverables**

- Definition/product profile
- Business scaffold
- Failure matrix

**Completion criteria**

- Finite recovery scenarios and exact guarantees stated
- At-least-once invocation is separate from idempotent semantic application
- No universal exactly-once promise

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/architecture/durable-recovery`, `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/impl/system-integration`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-RECOVERY, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/R01/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="r02"></a>

## R02 — Author recovery system prototype and binding contracts

**Lane:** `product_construction` · **Stage:** `system-prototype` · **Owner role:** DomainSpec Workflow/runtime owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [R01](#r01): System model derives from scoped product semantics.

**Work**

- Model store, Claim/Lease, Attempt, Retry, terminal state and operation ledger
- Compile the selected DomainSpec source
- Define transaction boundaries, generated contracts and schema evolution

**Deliverables**

- System graph/scaffold
- Provider contract
- Candidate storage/worker design

**Completion criteria**

- All architecture invariants have an implementation owner and test obligation
- Coordination and Operation transactions remain distinct
- Technology choice is explicit and prototype-only

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/architecture/durable-recovery`, `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/impl/system-integration`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-RECOVERY, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/R02/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="r03"></a>

## R03 — Implement atomic coordination store

**Lane:** `product_construction` · **Stage:** `implementation-prototype` · **Owner role:** DomainSpec Workflow/runtime owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [R02](#r02): Store implements the exact transaction and state model.

**Work**

- Persist immutable intent/plan, progress and dispatch state
- Add compare-and-set, transactional outbox and ownership checks
- Test rollback and concurrent writers

**Deliverables**

- Coordination provider candidate
- Store tests

**Completion criteria**

- No partial dispatch/progress/outbox commit
- Version conflicts and duplicate identities reject
- Failed transaction preserves prior committed state

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/architecture/durable-recovery`, `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/impl/system-integration`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-RECOVERY, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/R03/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="r04"></a>

## R04 — Implement Operation replay ledger

**Lane:** `product_construction` · **Stage:** `implementation-prototype` · **Owner role:** DomainSpec Workflow/runtime owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [R02](#r02): Replay identity derives from the system model.

**Work**

- Bind invocation identity to Operation-owned execution records
- Reconcile duplicate and unknown outcomes
- Keep business mutation atomic with the declared Operation receipt

**Deliverables**

- Operation ledger adapter
- Duplicate/replay tests

**Completion criteria**

- Replay does not repeat a committed business effect
- Unknown outcomes remain explicit until reconciled
- The coordination store does not impersonate Operation transaction authority

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/architecture/durable-recovery`, `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/impl/system-integration`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-RECOVERY, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/R04/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="r05"></a>

## R05 — Implement fenced durable worker

**Lane:** `product_construction` · **Stage:** `implementation-prototype` · **Owner role:** DomainSpec Workflow/runtime owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [R03](#r03): Worker must use atomic coordination truth.
- [R04](#r04): Invocation must use stable replay protection.

**Work**

- Acquire/renew leases and generation fencing
- Record unique attempts
- Resolve exact Operation bindings and advance monotonic progress

**Deliverables**

- Worker candidate
- Lease/fencing concurrency tests

**Completion criteria**

- Expired or superseded claims cannot commit
- Two workers cannot own the same active generation
- Missing binding stops before invocation

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/architecture/durable-recovery`, `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/impl/system-integration`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-RECOVERY, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/R05/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="r06"></a>

## R06 — Implement persisted retries, terminal recording and restart

**Lane:** `product_construction` · **Stage:** `implementation-prototype` · **Owner role:** DomainSpec Workflow/runtime owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [R05](#r05): Recovery scheduling operates on the fenced worker state.

**Work**

- Persist bounded retry schedule
- Record evidence-bound terminal dispositions
- Reconcile restart from first incomplete occurrence and dispatch outbox

**Deliverables**

- Retry/restart candidate
- Recovery state-transition tests

**Completion criteria**

- Restart loses no committed progress
- Retry ceiling and terminal state cannot be bypassed
- Replayed dispatch retains stable invocation identity

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/architecture/durable-recovery`, `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/impl/system-integration`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-RECOVERY, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/R06/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="r07"></a>

## R07 — Run recovery failure campaign

**Lane:** `product_construction` · **Stage:** `product-test` · **Owner role:** DomainSpec Workflow/runtime owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [R06](#r06): Test the complete durable prototype.

**Work**

- Inject crashes before/after each transaction boundary
- Exercise expired leases, duplicate delivery, partial failures, restart and replay
- Verify rollback/degraded behavior and evidence retention

**Deliverables**

- Crash/concurrency matrix
- Product-test manifest
- Independent replay report

**Completion criteria**

- All declared failure cases are exercised
- No skipped required scenario
- Local provider limits are explicit; no production claim

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/architecture/durable-recovery`, `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/impl/system-integration`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-RECOVERY, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/R07/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="r08"></a>

## R08 — Review and approve recovery product candidate

**Lane:** `product_construction` · **Stage:** `product-approval` · **Owner role:** DomainSpec Workflow/runtime owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [R07](#r07): Only tested exact recovery bytes are reviewable for approval.

**Work**

- Independently review transaction boundaries and failure evidence
- Obtain product owner decision for the selected provider/profile

**Deliverables**

- Recovery product decision

**Completion criteria**

- Approval binds candidate and test manifest
- No deployment/provider activation is inferred

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/architecture/durable-recovery`, `projects/domainspec-v2/impl/cli`, `projects/domainspec-v2/impl/system-integration`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-RECOVERY, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/R08/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: product_approval. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="u00"></a>

## U00 — Reconcile UI types and existing implementation evidence

**Lane:** `product_construction` · **Stage:** `source-baseline` · **Owner role:** DomainSpec UI language/profile owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

None in this DAG; baseline and scope reconciliation are the work.

**Work**

- Inspect the current UI work pack and newer same-lane receipts
- Separate candidate/deferred meanings from actual missing code
- Identify Adapter and State Indicator decision residue

**Deliverables**

- UI type/status inventory
- Evidence reuse map

**Completion criteria**

- All 11 retained UI rows have explicit dispositions
- Historical status does not override current owner-bound evidence
- Backend compiler scope is unchanged

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/ui-profile-implementation`, `projects/domainspec-v2/impl/spec/ui-profile`, `projects/domainspec-v2/impl/spec/meta-types/ui`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-CRAFT, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/U00/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="u01"></a>

## U01 — Define the bounded UI profile

**Lane:** `product_construction` · **Stage:** `prototype-definition` · **Owner role:** DomainSpec UI language/profile owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [U00](#u00): UI scope must resolve current meanings and evidence.

**Work**

- Propose precise scope for Page/Layout/Component/ViewModel/Hook/Form/Action/Guard/Binding
- Explicitly resolve or defer Adapter/State Indicator with excluded claims
- Select one framework/target and one user journey as a prototype

**Deliverables**

- Definition dispositions
- UI product/business scaffold
- Type/relationship and accessibility obligations

**Completion criteria**

- Included and excluded types enumerated
- No alias/merge is inferred
- First product scope is finite; excluded types remain visible deferred work

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/ui-profile-implementation`, `projects/domainspec-v2/impl/spec/ui-profile`, `projects/domainspec-v2/impl/spec/meta-types/ui`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-CRAFT, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/U01/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="u02"></a>

## U02 — Compile UI source and generation design

**Lane:** `product_construction` · **Stage:** `system-prototype` · **Owner role:** DomainSpec UI language/profile owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [U01](#u01): UI source encodes the selected language/profile.

**Work**

- Author the user journey and relationship closure
- Define bindings between ViewModel, state, events and rendering
- Compile a system scaffold and specify generator traceability

**Deliverables**

- UI source/schema candidate
- System graph
- Generator and test contracts

**Completion criteria**

- Every UI behavior traces to explicit semantics
- No dormant UI type enters the backend profile
- Missing target support is causal residue

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/ui-profile-implementation`, `projects/domainspec-v2/impl/spec/ui-profile`, `projects/domainspec-v2/impl/spec/meta-types/ui`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-CRAFT, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/U02/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="u03"></a>

## U03 — Implement the selected UI generator/profile

**Lane:** `product_construction` · **Stage:** `implementation-prototype` · **Owner role:** DomainSpec UI language/profile owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [U02](#u02): Implementation follows the compiled UI contracts.

**Work**

- Build the bounded generator and target integration
- Handle validation, guarded actions, loading/error states and source diagnostics
- Preserve existing backend generation

**Deliverables**

- UI implementation candidate
- Generated example

**Completion criteria**

- The declared journey is generated without hidden domain rules
- Unsupported constructs fail explicitly
- Backend compatibility remains intact

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/ui-profile-implementation`, `projects/domainspec-v2/impl/spec/ui-profile`, `projects/domainspec-v2/impl/spec/meta-types/ui`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-CRAFT, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/U03/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="u04"></a>

## U04 — Verify selected UI product

**Lane:** `product_construction` · **Stage:** `product-test` · **Owner role:** DomainSpec UI language/profile owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [U03](#u03): Tests require the generated target.

**Work**

- Run positive/negative interaction and accessibility checks
- Check graph/source/generated artifact parity and regression tests

**Deliverables**

- Browser/semantic test receipts

**Completion criteria**

- All selected UI obligations pass
- Adverse states and guard rejection exercised

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/ui-profile-implementation`, `projects/domainspec-v2/impl/spec/ui-profile`, `projects/domainspec-v2/impl/spec/meta-types/ui`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-CRAFT, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/U04/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="u05"></a>

## U05 — Independently review and approve UI candidate

**Lane:** `product_construction` · **Stage:** `product-approval` · **Owner role:** DomainSpec UI language/profile owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [U04](#u04): Approval requires current tests on the immutable selected candidate.

**Work**

- Independently review the exact candidate and all selected test results
- Record the owner product decision bound to the candidate digest

**Deliverables**

- Independent review receipt
- Digest-bound product decision

**Completion criteria**

- Selected obligations have current passing evidence
- Independent review findings are resolved
- Owner decision names the exact approved candidate

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/ui-profile-implementation`, `projects/domainspec-v2/impl/spec/ui-profile`, `projects/domainspec-v2/impl/spec/meta-types/ui`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-CRAFT, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/U05/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: product_approval. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="l00"></a>

## L00 — Reconcile legacy import and dual-input inventory

**Lane:** `product_construction` · **Stage:** `source-baseline` · **Owner role:** DomainSpec migration owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

None in this DAG; baseline and scope reconciliation are the work.

**Work**

- Compare IMPORT-MANIFEST with current implementation and receipts
- Locate remaining Markdown/TDE consumers and v1 assumptions
- Do not treat every old pending row as unfinished code

**Deliverables**

- Import/consumer dependency inventory
- Per-row currentness findings

**Completion criteria**

- Every selected migration item has source, consumer and current disposition
- Frozen v1 is read-only
- No broad cleanup or removal is inferred

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/IMPORT-MANIFEST.md`, `projects/domainspec-v2/impl/spec`, `projects/domainspec-v2/impl/tools`, `projects/domainspec-v2/impl/test-derivation-engine`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-IMPORT, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/L00/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="l01"></a>

## L01 — Define retain, adapt or retire scope

**Lane:** `product_construction` · **Stage:** `prototype-definition` · **Owner role:** DomainSpec migration owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [L00](#l00): Migration meaning depends on actual consumers.

**Work**

- Propose dispositions for every selected legacy item
- Define JSON-to-obligation semantics for retained integration
- Define compatibility and rollback for any future retirement

**Deliverables**

- Migration product contract
- Business/source correspondence scaffold

**Completion criteria**

- No competing obligation denominator is invented
- All selected consumers have explicit compatibility requirements
- Retirement is proposed; no deletion happens here

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/IMPORT-MANIFEST.md`, `projects/domainspec-v2/impl/spec`, `projects/domainspec-v2/impl/tools`, `projects/domainspec-v2/impl/test-derivation-engine`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-IMPORT, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/L01/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="l02"></a>

## L02 — Implement and test migration candidates

**Lane:** `product_construction` · **Stage:** `implementation-prototype` · **Owner role:** DomainSpec migration owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [L01](#l01): Implementation follows explicit dispositions.

**Work**

- Create retained bridges or replacement validators in successor scope
- Preserve legacy sources while testing parity
- Remove v1 path assumptions only in selected candidate files

**Deliverables**

- Migration adapters and candidate configuration
- Parity/negative tests

**Completion criteria**

- Retained semantics match expected obligation and diagnostic outputs
- Unmapped material remains explicit
- No frozen source or historical approval is edited

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/IMPORT-MANIFEST.md`, `projects/domainspec-v2/impl/spec`, `projects/domainspec-v2/impl/tools`, `projects/domainspec-v2/impl/test-derivation-engine`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-IMPORT, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/L02/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="l03"></a>

## L03 — Verify selected migration closure

**Lane:** `product_construction` · **Stage:** `product-test` · **Owner role:** DomainSpec migration owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [L02](#l02): Closure needs real candidate and parity results.

**Work**

- Check every selected import row and consumer
- Verify retraction/traceability claims only within declared bounds

**Deliverables**

- Migration closure receipt
- Deferred removal list

**Completion criteria**

- Every selected row is implemented/tested or explicitly out of selected scope
- No silent abandoned requirement
- No destructive retirement or old-file deletion is performed

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/IMPORT-MANIFEST.md`, `projects/domainspec-v2/impl/spec`, `projects/domainspec-v2/impl/tools`, `projects/domainspec-v2/impl/test-derivation-engine`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-IMPORT, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/L03/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="l04"></a>

## L04 — Independently review and approve migration candidate

**Lane:** `product_construction` · **Stage:** `product-approval` · **Owner role:** DomainSpec migration owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [L03](#l03): Approval requires current tests on the immutable selected candidate.

**Work**

- Independently review the exact candidate and all selected test results
- Record the owner product decision bound to the candidate digest

**Deliverables**

- Independent review receipt
- Digest-bound product decision

**Completion criteria**

- Selected obligations have current passing evidence
- Independent review findings are resolved
- Owner decision names the exact approved candidate

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/IMPORT-MANIFEST.md`, `projects/domainspec-v2/impl/spec`, `projects/domainspec-v2/impl/tools`, `projects/domainspec-v2/impl/test-derivation-engine`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-IMPORT, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/L04/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: product_approval. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="p01"></a>

## P01 — Join the selected products and revalidate shared contracts

**Lane:** `product_construction` · **Stage:** `product-test` · **Owner role:** DomainSpec product owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [P00](#p00): The join denominator comes from the completion contract.
- [C05](#c05): Compiler milestone must be approved.
- [E05](#e05): Integration milestone must be approved.
- [R08](#r08): Recovery milestone must be approved.
- [U05](#u05): Selected UI milestone must be approved.
- [L04](#l04): Migration milestone must be approved.

**Work**

- Build an exact compatibility matrix across the five selected candidates
- Rerun tests affected by shared contract/compiler changes
- Record cross-product failures without broadening the selected scope

**Deliverables**

- Integrated candidate manifest
- Compatibility/regression receipt
- Residual scope report

**Completion criteria**

- All five candidate digests and dependencies agree
- No component uses stale shared contracts
- Deferred work and limits remain explicit

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/completion-dag`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-ROOT, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/P01/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="p02"></a>

## P02 — Independent final review and product decision

**Lane:** `product_construction` · **Stage:** `product-approval` · **Owner role:** DomainSpec product owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [P01](#p01): Final decision must bind the tested joined candidate.

**Work**

- Have an independent reviewer assess exact milestone closure
- Present the joined candidate and bounded claims
- Record the final product owner decision

**Deliverables**

- Program product decision
- Exact completion/evidence matrix

**Completion criteria**

- Every included outcome has passing current evidence and explicit approval
- Production/release/operational readiness are not inferred

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2/development/completion-dag`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-ROOT, S-ARCH; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/P02/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: product_approval. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

<a id="o01"></a>

## O01 — Inspect hosted compiler evidence for selected commit

**Lane:** `operational_support` · **Stage:** `compiler-release-preparation` · **Owner role:** Repository/release owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [C03](#c03): Hosted evidence must identify the same candidate source and qualification contract.

**Work**

- Read existing hosted run metadata and artifact provenance
- Compare exact source commit and input identities
- Report absence/failure; do not trigger a workflow

**Deliverables**

- Hosted evidence lookup report

**Completion criteria**

- Either matching passing run/artifact is bound or missing evidence remains not_evaluable
- Earlier successful CI is not reused for newer bytes

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-RC; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/O01/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

Affected stage: `compiler-release-preparation`. Required for the hosted release-evidence branch only; local product review continues independently.

<a id="o02"></a>

## O02 — Decide exact hosted-run or source-publication envelope

**Lane:** `operational_support` · **Stage:** `compiler-release-preparation` · **Owner role:** Repository/release owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [C05](#c05): Operational authority follows tested compiler product approval.
- [O01](#o01): The decision must address concrete missing hosted evidence.

**Work**

- If exact hosted evidence already exists, record that no new effect is needed
- Otherwise present exact workflow/ref/artifact scope and any separately needed source publication
- Obtain explicit owner decision

**Deliverables**

- Bounded CI/source-publication decision or documented no-new-effect disposition

**Completion criteria**

- No implicit push, commit or workflow trigger
- Public/private boundary and exact source envelope are explicit

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-RC; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/O02/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: operational_authorization. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

Affected stage: `compiler-release-preparation`. No product-construction dependency; operational residue only.

<a id="o03"></a>

## O03 — Complete hosted compiler evidence

**Lane:** `operational_support` · **Stage:** `compiler-release-preparation` · **Owner role:** Repository/release owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [O02](#o02): Any new hosted effect requires the exact decision.
- [C03](#c03): The run must reproduce the same candidate contract.

**Work**

- Reuse matching O01 evidence or execute only the authorized hosted job
- Verify full product and L1 gates, artifact inventory and commit
- Stop on effectful failure

**Deliverables**

- Current hosted result and candidate artifact receipt

**Completion criteria**

- Exact source and artifacts agree with selected compiler candidate
- No incomplete/failed hosted run called release-ready

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-RC; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/O03/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

Affected stage: `compiler-release-preparation`. No product-construction dependency; operational residue only.

<a id="o04"></a>

## O04 — Decide exact compiler publication/release envelope

**Lane:** `operational_support` · **Stage:** `compiler-release` · **Owner role:** Repository/release owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [C05](#c05): Product approval is necessary but not sufficient.
- [O03](#o03): Release contract requires current hosted evidence.

**Work**

- Specify package registry, visibility, signer, immutable artifact and rollback/support claims
- Obtain separate publication/release decision

**Deliverables**

- Exact release authorization or explicit defer decision

**Completion criteria**

- Credential, private/public and artifact scopes are explicit
- Approval of product is not reused as release authority

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-RC; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/O04/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: operational_authorization. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

Affected stage: `compiler-release`. No product-construction dependency; operational residue only.

<a id="o05"></a>

## O05 — Execute and independently verify compiler release

**Lane:** `operational_support` · **Stage:** `compiler-release` · **Owner role:** Repository/release owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [O04](#o04): Only the exact authorized release may execute.

**Work**

- Publish/sign/tag only within the selected envelope
- Independently install the released artifact and verify identities
- Record immutable release receipt

**Deliverables**

- Published artifact receipt
- Independent installed-consumer check

**Completion criteria**

- Released digest equals authorized artifact
- No history rewrite or scope expansion
- Stop at first release effect failure

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-RC; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/O05/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

Affected stage: `compiler-release`. No product-construction dependency; operational residue only.

<a id="o06"></a>

## O06 — Verify and reuse portable EVF kit owner handoff

**Lane:** `operational_support` · **Stage:** `EVF-distribution` · **Owner role:** Existing portable EVF audit-kit owner; coordinate without reassignment

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [E00](#e00): Packaging must preserve exact frozen EVF source.

**Work**

- Coordinate with the existing packaging owner; BUILD-PLAN now records a completed local candidate
- Verify the exact archive and owner validation receipt before reusing reported tests; do not rebuild by default
- Keep remaining platform, licensing, distribution and delivery work with its owner and separate from product construction

**Deliverables**

- Verified handoff locator and candidate digest
- Explicit remaining distribution/platform residue

**Completion criteria**

- Owner handoff and candidate identity reconciled
- Recorded local test claims checked against owner receipts before reuse
- No duplicate packaging, active-owner takeover or implicit distribution

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-KIT, S-EVF; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/O06/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

Affected stage: `EVF-distribution`. No product-construction dependency; operational residue only.

<a id="o07"></a>

## O07 — Reconcile project status and continuation views

**Lane:** `operational_support` · **Stage:** `no-product-stage` · **Owner role:** Repository/release owner

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [C00](#c00): Compiler stale facts must be reconciled.
- [E00](#e00): EVF stale facts must be reconciled.
- [R00](#r00): Recovery facts need current sources.
- [U00](#u00): UI facts need current sources.
- [L00](#l00): Import facts need current sources.

**Work**

- Prepare exact edits to stale CRAFT/architecture/import navigation views
- Preserve historical decisions and distinguish facts from pending execution
- Route mutation with exact allowlist

**Deliverables**

- Current status view candidate and change rationale

**Completion criteria**

- No new completion state without owner evidence
- No digest refresh manufactures currentness
- This bookkeeping is not a prerequisite for prototypes

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-ROOT, S-CRAFT, S-ARCH, S-IMPORT; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/O07/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

Affected stage: `no-product-stage`. No product-construction dependency; operational residue only.

<a id="o08"></a>

## O08 — Define operational deployment candidate and runbooks

**Lane:** `operational_support` · **Stage:** `deployment-preparation` · **Owner role:** Deployment/operator owner with ORODI definition owners

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [R08](#r08): Runtime operations must use an approved runtime product.
- [E05](#e05): Monitoring/evidence integration must be bounded and reviewed.

**Work**

- Define one environment, provider, observability, credentials boundary and recovery criteria
- Reconcile ORODI successor requirements
- Prepare offline deployment/rollback/support rehearsal

**Deliverables**

- Deployment candidate and runbooks
- Offline rehearsal evidence

**Completion criteria**

- Provider assumptions and operational claims are explicit
- No live account or infrastructure mutation
- Unresolved ORODI dependencies remain causal gaps

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-ORODI, S-RECOVERY; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/O08/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

Affected stage: `deployment-preparation`. No product-construction dependency; operational residue only.

<a id="o09"></a>

## O09 — Decide exact live pilot/deployment envelope

**Lane:** `operational_support` · **Stage:** `deployment` · **Owner role:** Deployment/operator owner with ORODI definition owners

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [P02](#p02): The joined selected product must be approved before operational authority.
- [O08](#o08): The exact operational candidate must be reviewable.

**Work**

- Obtain explicit environment, effects, credential and rollback authorization
- Choose a bounded pilot; do not inherit historical Body War authorization

**Deliverables**

- Live pilot/deployment owner decision

**Completion criteria**

- Exact artifact, environment, participant and effect scope fixed
- No production status implied by approval alone

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-ORODI; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/O09/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: operational_authorization. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

Affected stage: `deployment`. No product-construction dependency; operational residue only.

<a id="o10"></a>

## O10 — Run authorized live pilot and operational closeout

**Lane:** `operational_support` · **Stage:** `production-operations` · **Owner role:** Deployment/operator owner with ORODI definition owners

Named actor: unassigned; existing ownership must be resolved before dispatch.

**Prerequisites**

- [O09](#o09): Live work needs its own exact authorization.

**Work**

- Execute the authorized deployment/pilot
- Exercise monitoring, recovery and support requirements
- Independently record outcomes and remaining limits

**Deliverables**

- Live operational receipt
- Pilot acceptance/support decision

**Completion criteria**

- All selected operational checks pass for exact environment
- Failures stop successor effects
- Offline tests are not substituted for live evidence

**Verification**

- Inspect the exact deliverables against every done criterion; retain causal failures and missing evidence.

**Scope and evidence**

Candidate work roots: `projects/domainspec-v2`.

Planning pointers only. Resolve exact file allowlist, selected source bytes and active ownership before any mutation; directories are not blanket authorization.

Selected source references: S-ORODI; see [sources.json](sources.json).

Proposed receipt: `evidence/<candidate-epoch>/O10/receipt.json`. Required fields: `node_id`, `candidate_id`, `source_manifest_sha256`, `input_receipt_refs`, `output_manifest_sha256`, `checks_with_observed_results`, `unresolved_findings`, `claim_ceiling`.

Decision: none at this node. BLOCK the dependent result; record dependent checks as not_evaluable; continue independent ready work. Source changes create a successor evidence epoch, never refresh an old approval.

Affected stage: `production-operations`. No product-construction dependency; operational residue only.
