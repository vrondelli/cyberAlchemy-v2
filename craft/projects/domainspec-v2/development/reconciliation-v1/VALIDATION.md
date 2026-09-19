# DomainSpec reconciliation validation matrix

Status: planned checks, not product test results.
Package: DSV2-RECONCILIATION-001. Authority effect: none.
Work-item ownership and dependencies: [WORK-ITEMS.json](WORK-ITEMS.json).
Evidence starting point: [EVIDENCE.json](EVIDENCE.json).

## Result and evidence rules

Every check produces a result for one exact candidate, profile and toolchain:
`pass`, `fail`, `not_evaluable`, or `not_requested`. Required checks may not
use `not_requested` to escape the denominator. Missing prerequisites are
`not_evaluable` with the exact cause. Unsupported semantics must be a typed
outcome and must not satisfy a required supported cell.

Record candidate/source/definition/profile/provider digests, test IDs, expected
and observed outcomes, total/ran/passed/failed/skipped counts, commands, tool
versions, logs and reviewer provenance. Preserve old receipts unchanged.
A renamed test, stale positive fixture, empty corpus, zero-row detection matrix,
unexplained skip or retained survivor cannot count as closure.

Tests belong to a versioned suite registry. Discover all test files and fail
on unclassified additions. Reconcile the currently omitted outbound-composition,
request-custody, service-security and stream-lifecycle files before trusting
the default aggregate. Run positive, wrong-type, missing-reference, stale-input,
unknown-value and negative-control cases where applicable.

## Denominators

- 13 backend metatypes by three declared realization languages: 39 rows.
  Expand each row into its promised typed/untyped and execution profiles;
  do not treat one test as coverage of all those cells.
- All 31 canonical relationship signatures accounted for; 17 backend signatures
  executed in the selected backend profile. The 14 UI/UI-backend signatures
  retain explicit non-release dispositions.
- All selected BMC facets, ownership dimensions, membership kinds, closure and
  step/role distinctions; derive case counts from the selected contract.
- Every advertised command, source/profile version, certificate path, runtime
  entry point, package export and documented example.
- All required negative/mutation/orthogonality cells and the four-product
  compatibility join. An unavailable provider remains visible in the count.

## Execution guidance

This plan does not run these commands. At execution time, verify the exact
selected runtime with `RUNTIME.json` and its existing launcher. The current
source records Node 26.8.1; do not substitute a host Node merely because it runs.
For Rust/C/C++ use the checkout's existing `tools/toolchain/run` launcher and
preserve nested pins. Resolve the correct owning checkout before running it.
Never install a temporary compiler to get a green result.

The current CLI `npm test` calls proof and parallel suites but is not a complete
test inventory. DSR-029 must establish the full suite registry first. Resolve
current scripts from the captured package manifest; do not invent a universal
command that claims to validate all products. Use isolated output directories,
local fixtures and no live network/provider calls without the exact envelope.

Run focused contract checks on each task, predecessor regression on every merge,
cross-language and frontend conformance at L2, fault/restart tests at L3, and the
full required product matrix against the installed archive at L4. Replay the
deterministic corpus twice from exact inputs; normalize only explicitly excluded
metadata, not semantic differences.

## Planned checks

## V01

**Snapshot integrity**

- Method: Rehash all selected current files, frozen inventories and accepted archive manifests; distinguish changed, absent and matching bytes.
- Required outcome: No current-state claim inherits acceptance merely because a version string or path matches.
- Current result: not run; scheduled by DSR-001.

## V02

**Preservation and active writers**

- Method: Capture tracked/untracked preimages and check exact selected input hashes before and after each mutation; simulate source drift.
- Required outcome: Unrelated bytes remain unchanged; drift stops only dependent work; recovery is additive.
- Current result: not run; scheduled by DSR-001.

## V03

**Whole-portfolio coverage**

- Method: Enumerate all 70 initial development directories and any subsequently discovered capability; classify root families too.
- Required outcome: Every row has owner, evidence, status, consumer, disposition and next task; no unexplained omission.
- Current result: not run; scheduled by DSR-002.

## V04

**Support-state separation**

- Method: For each type/language/profile/command cell compare source, test, acceptance, package and publication evidence.
- Required outcome: Independent states are retained; a generated skeleton or local test is not runtime or publication evidence.
- Current result: not run; scheduled by DSR-003.

## V05

**BMC receipt recovery**

- Method: Check all seven expected hash-bound references; test wrong-hash, renamed, text-only and unavailable cases.
- Required outcome: Only exact recovery may restore an old evidence claim; unavailable receipts trigger fresh evidence, not fabricated PASS.
- Current result: not run; scheduled by DSR-004.

## V06

**SFOL historical reconstruction**

- Method: Replay source patches as data in a durable isolated recovery tree; compare recorded preimages and hashes; detect missing fragments.
- Required outcome: No automatic session-command execution or silent canonical overwrite; reconstruction gets fresh tests and candidate status.
- Current result: not run; scheduled by DSR-005.

## V07

**Definition and ontology closure**

- Method: Review 13 metatypes, 31 signatures, D18-D49 and explicit consumers; mutate a selected meaning or missing definition reference.
- Required outcome: Distinct domain/data/behavior/proof/authority concepts remain distinct; ontology labels cannot redefine source meaning.
- Current result: not run; scheduled by DSR-006.

## V08

**Minimum vertical positive**

- Method: Typed Entity plus Query: direct JSON and supported Alch frontend, compiled graph, generated target and known query result.
- Required outcome: Read-only meaning, field identity, selected source and normalized outcome survive end to end.
- Current result: not run; scheduled by DSR-007.

## V09

**Minimum vertical negative**

- Method: Wrong read endpoint, missing field/type binding, malformed source and unsupported frontend construct.
- Required outcome: Compile fails with a bounded diagnostic before output/effects; no fallback or invented Operation.
- Current result: not run; scheduled by DSR-007.

## V10

**Decision-to-implementation correspondence**

- Method: Enumerate D01-D08/RQ1/N01-N45 facets and map each to contract, representation, validation, projection and tests.
- Required outcome: No late design decision is reported propagated merely because its prose or ledger entry exists.
- Current result: not run; scheduled by DSR-008.

## V11

**Type constructors and cardinality**

- Method: Nested scalar/declared type/optional/list/set/sum; empty and duplicate collections; absent versus null; boundary numeric values.
- Required outcome: Constructor and cardinality agree; list preserves order; set uniqueness and sum discrimination are explicit.
- Current result: not run; scheduled by DSR-009.

## V12

**Identity and references**

- Method: Entity identity, VO structural equality, nested Entity embedding versus references; dangling projected-field references and reference cycles.
- Required outcome: References bind a defined identity/projection; no automatic ownership edge or foreign-key persistence assumption.
- Current result: not run; scheduled by DSR-009.

## V13

**Closed and open shapes**

- Method: Unknown fields/types, duplicate field IDs, invalid enum variants, recursive depth and explicitly open payloads.
- Required outcome: Closed shapes reject extras; open content has an explicit lower assurance ceiling; no accidental all-record schema.
- Current result: not run; scheduled by DSR-009.

## V14

**Orthogonal relationship degree**

- Method: Same profile in Markdown and JSON; per endpoint type rather than union-wide counters; min/max and unbounded cases.
- Required outcome: Identical selected semantics yield identical decisions; compatibility labels alone do not invent numeric authority.
- Current result: not run; scheduled by DSR-010.

## V15

**Ownership and membership axes**

- Method: Two owners in different dimensions, duplicate owner in one dimension; two parents in different kinds and duplicate within one kind.
- Required outcome: Independent facts are preserved; collisions within the selected axis reject; unknown/free-text kinds reject.
- Current result: not run; scheduled by DSR-010.

## V16

**Self, cycles and inverse distinctions**

- Method: Self-edge, per-axis cycle, mixed-axis path and owns/belongs-to inverse pair fixtures under explicit profiles.
- Required outcome: No unsupported transitivity or inverse inference; selected independent axes and direct-only consequences survive.
- Current result: not run; scheduled by DSR-010.

## V17

**Closure and open-world outcomes**

- Method: Complete/incomplete endpoint populations, stale closure digest, cross-feature missing source, positive and negative nine-target cases.
- Required outcome: Required closure absent yields not_evaluable/incomplete-closure, never PASS or an invented closed world.
- Current result: not run; scheduled by DSR-010.

## V18

**Graph-layer separation**

- Method: Canonical maps versus maps-from/maps-to, deferred canonical depends-on versus scoped dependency reference, typed argument/field binding.
- Required outcome: An edge is accepted only in its declared representation/profile; composition cannot widen canonical endpoints implicitly.
- Current result: not run; scheduled by DSR-011.

## V19

**Validated snapshot integrity**

- Method: Forged graph, postvalidation mutation, source TOCTOU, duplicate/missing composition and stale ontology inputs.
- Required outcome: All generation uses a verified snapshot; tampering is rejected before writing usable outputs.
- Current result: not run; scheduled by DSR-012.

## V20

**Frontend and legacy ontology parity**

- Method: Direct DomainSpec JSON, current shared ontology and explicit legacy Alch adapter with normalized semantic comparison.
- Required outcome: Semantic parity is proved for supported cases; distinct source provenance remains distinct; no backend fallback.
- Current result: not run; scheduled by DSR-012.

## V21

**Calculation purity**

- Method: Standalone and mapper-consumed Calculation, and real Operation consuming Calculation; inspect graph and generated calls.
- Required outcome: No fake evaluation Operation; exact arithmetic and explicit arguments remain; canonical calculates targets real Operations.
- Current result: not run; scheduled by DSR-013.

## V22

**Mapping bindings**

- Method: Pass a computed total explicitly; invoke a declared Calculation where allowed; missing input, default/null, source/target and repeated-use cases.
- Required outcome: Every dependency has a binding and trace; defaults do not mask invalid types; evaluation/reuse policy is deterministic.
- Current result: not run; scheduled by DSR-014.

## V23

**Rule versus Policy**

- Method: Policy uses existing Rule selections; mutate Rule, overlap cases, missing/default target and selection-without-execution cases.
- Required outcome: No duplicated hidden rule authority, no Rule/Policy collapse, deterministic strategy choice and explicit execution boundary.
- Current result: not run; scheduled by DSR-015.

## V24

**State-machine trigger/effect separation**

- Method: Trigger A, guard R, transition S1 to S2, emitted effect B; wrong trigger/source, failed guard and missing output binding.
- Required outcome: A and B keep distinct directions; failed transitions do not change state or emit effects.
- Current result: not run; scheduled by DSR-016.

## V25

**Workflow concept versus occurrence**

- Method: Same Operation in two ordered steps; same node_id in different features; duplicate step identity; malformed compensation link.
- Required outcome: Qualified Operation identity and occurrence identity remain separate; explicit order survives compilation and rendering.
- Current result: not run; scheduled by DSR-017.

## V26

**13 by 3 semantic coverage**

- Method: Run positive and negative contracts for all 39 declared realization rows and every claimed typed/untyped profile cell.
- Required outcome: Supported cells execute real semantics; unsupported forms return typed diagnostics, never placeholder success or panic/cast failures.
- Current result: not run; scheduled by DSR-018.

## V27

**Projection and observer consistency**

- Method: Regenerate catalog, relationship obligations, profile code and observers twice; mutate selected target bytes or markers.
- Required outcome: Deterministic outputs and exact inventory/semantic checks; no historical baseline rewritten to conceal drift.
- Current result: not run; scheduled by DSR-019.

## V28

**Composition certificate closure**

- Method: Tamper calculation arguments, mapping roles, dependency identity, ontology meaning, snapshot hashes and result roots.
- Required outcome: The compilation certificate covers exact composition semantics and all required references.
- Current result: not run; scheduled by DSR-020.

## V29

**Composition assurance scope**

- Method: Versioned checked interchange/proof projection with positive, unsupported-provider and forged/mismatched proof cases.
- Required outcome: Assurance states its exact claim; compilation success is never rebranded as a formal proof.
- Current result: not run; scheduled by DSR-020.

## V30

**Composition runtime parity**

- Method: Execute generated and runtime paths for identical inputs including optional values, queries, rules and calculations.
- Required outcome: Same normalized value/error/effect outcome and complete composition-bound runtime receipt.
- Current result: not run; scheduled by DSR-021.

## V31

**Runtime fail-closed behavior**

- Method: Missing typed_contract, arbitrary entry, dependency cycle, undeclared read/write/effect and failed guard.
- Required outcome: Predictable domain diagnostics before effects; no generic TypeError, unsafe cast or unexplained fallthrough.
- Current result: not run; scheduled by DSR-021.

## V32

**FormalClaim version preservation**

- Method: Versioned v2 intake, v3 candidate authoring and v4 definition-bound claim; unsupported quantifier/sort/interpretation conversions.
- Required outcome: Only declared preservation-backed projections succeed; carrier/API/logic version numbers are not conflated.
- Current result: not run; scheduled by DSR-022.

## V33

**TDE semantic evidence**

- Method: Pure/effect SFOL partitions, mutation killing, negative controls, replay and exact source/definition bindings.
- Required outcome: Nonempty denominator, declared semantics and bounded replay; a syntactic/schema pass is not semantic closure.
- Current result: not run; scheduled by DSR-023.

## V34

**EVF exact join**

- Method: Seven profile-bound controls: binding, derivation, lineage, observation, provider, scope and semantics; wrong-profile/stale/fabricated evidence.
- Required outcome: Each required control detects its matching corruption; zero-row and survivor matrices reject; omission is not_requested.
- Current result: not run; scheduled by DSR-023.

## V35

**CLI formalization discoverability**

- Method: Assess/project/derive/verify selected profile through CLI and API; help/capabilities/source/project/package consistency.
- Required outcome: SFOL is either explicitly supported with the bounded bridge or explicitly unsupported; Lean and SFOL claims stay separate.
- Current result: not run; scheduled by DSR-023.

## V36

**Workflow execution and compensation**

- Method: Ordered repeated steps, failure before/after commit, compensation ordering, unresolved result and duplicate attempts.
- Required outcome: Workflow executes rather than merely returns declarations; recovery intent and effect success are not conflated.
- Current result: not run; scheduled by DSR-024.

## V37

**Atomic persistence and outbox**

- Method: Failure between state and outbox, transaction rollback, duplicate delivery and unsupported transaction guarantee.
- Required outcome: No lost committed intent or partially committed local transaction; stated at-least-once semantics retained.
- Current result: not run; scheduled by DSR-025.

## V38

**Claims, leases and fencing**

- Method: Competing workers, expired lease, stale holder, retry scheduling and attempt identity reuse.
- Required outcome: Only valid fenced ownership advances dispatch; stale worker and duplicate invocation behavior is explicit.
- Current result: not run; scheduled by DSR-025.

## V39

**Crash/restart recovery**

- Method: Kill and restart around commit, dispatch, acknowledgment and retry boundaries; unavailable provider and unknown outcome.
- Required outcome: Recovery preserves durable identity and reports uncertainty honestly; no unjustified exactly-once external-effect claim.
- Current result: not run; scheduled by DSR-025.

## V40

**Generic application compiler**

- Method: Direct application ontology and Alch parity; imports, capabilities/help, core-model binding and candidate lifecycle checks.
- Required outcome: No dependency on ARE configuration or Alch implementation; application commands and support limitations are discoverable.
- Current result: not run; scheduled by DSR-026.

## V41

**Request authorization and safety**

- Method: Unauthorized/oversized/malformed requests, duplicate query params, nested invalid fields, outbound allowlist and secret-bearing errors.
- Required outcome: No effects before authorization/validation; logs and generated artifacts are redacted; limits reject deterministically.
- Current result: not run; scheduled by DSR-027.

## V42

**Stream lifecycle**

- Method: SSE versus buffered JSON, disconnect/cancel, partial output, timeout, retries and terminal response handling.
- Required outcome: Streaming promises are tested independently from buffered guards; cancellation cannot produce duplicate terminal effects.
- Current result: not run; scheduled by DSR-027.

## V43

**Durable request custody**

- Method: Restart with pending request, ambiguous provider result, reconciliation without authorization and encrypted-state corruption.
- Required outcome: Custody/reconciliation states are explicit; no provider-specific correlation is claimed without evidence.
- Current result: not run; scheduled by DSR-027.

## V44

**Database/domain separation**

- Method: VO embedding versus Entity references, enum/sum encoding, collection cardinality, identity migration and failure classification.
- Required outcome: Persistence is an explicit binding; no inferred DDL; selected migration and rollback preserve domain meaning.
- Current result: not run; scheduled by DSR-028.

## V45

**Complete test discovery**

- Method: Compare all discovered tests with suite membership, including four new application files; simulate absent required suite and skip.
- Required outcome: No orphaned required test; required skips or missing prerequisites are non-pass with exact denominator.
- Current result: not run; scheduled by DSR-029.

## V46

**Non-collapse witnesses**

- Method: Remove each retained relationship/role/metatype distinction from a paired fixture and observe declared consequence categories.
- Required outcome: At least one intended admission/derivation/projection/composition/owner/artifact consequence changes; no vacuous witness.
- Current result: not run; scheduled by DSR-030.

## V47

**Orthogonality witnesses**

- Method: Vary exactly one property (scope, type, axis, role, order or closure) while holding others fixed.
- Required outcome: Only intended outcomes change; independent facts neither disappear nor gain unsupported implications.
- Current result: not run; scheduled by DSR-030.

## V48

**Calibration usefulness**

- Method: Baseline/residual corpus comparison, symmetric difference and required mutation survivors; retain existing CALIBRATION-DEFER history.
- Required outcome: No zero-difference calibration is promoted as a useful distinction; repair or explicit disposition is required.
- Current result: not run; scheduled by DSR-030.

## V49

**Portable generated semantics**

- Method: Execute selected TS/Python/Rust results for all supported cells, including UInt64 rounding/overflow and Unicode variants.
- Required outcome: Same specified values/errors; unsupported language cells cannot disappear from the matrix.
- Current result: not run; scheduled by DSR-031.

## V50

**Repeatability and provenance**

- Method: Two isolated runs with pinned inputs/toolchain; compare normalized semantics and deterministic artifacts separately from timestamps.
- Required outcome: Stable semantic digests and reproducible payloads; contextual timestamps are outside deterministic equality by explicit rule.
- Current result: not run; scheduled by DSR-031.

## V51

**Toolchain preflight**

- Method: Selected Node/pnpm/npm manifests, native Rust pins and toolchain launchers; wrong runtime and missing provider cases.
- Required outcome: No global install or substituted compiler; exact affected cells report not_evaluable without blocking independent proofs.
- Current result: not run; scheduled by DSR-032.

## V52

**Existing four-product join**

- Method: Compiler, EVF, recovery and legacy migration exact candidate selection; integration failures and P01/P02 correspondence.
- Required outcome: Composed behavior proven; old individual approvals do not automatically approve the join; UI stays outside v1.0.
- Current result: not run; scheduled by DSR-033.

## V53

**Documentation and examples**

- Method: Run published example corpus, compare support counts/versions/commands to selected manifest, inspect public/private boundaries.
- Required outcome: User docs contain working behavior and precise support limits, not internal unresolved questions or stale counts.
- Current result: not run; scheduled by DSR-034.

## V54

**Candidate freeze**

- Method: Rehash source, contracts, outputs, evidence and package provenance; mutate one byte after freeze.
- Required outcome: New immutable candidate identity; affected test/review epoch invalidates; @10 and accepted old archives remain unchanged.
- Current result: not run; scheduled by DSR-035.

## V55

**Installed package**

- Method: Clean install outside checkout; no repository-relative imports; all advertised exports/commands; required tests against installed artifact.
- Required outcome: Exact candidate package is usable without the development tree; no hidden new commands or missing runtime modules.
- Current result: not run; scheduled by DSR-036.

## V56

**Compatibility and migration**

- Method: Old accepted fixtures and archives versus versioned adapters/rejections; migrate and reverse in isolation.
- Required outcome: No silent reinterpretation, deletion or cutover; exact compatibility scope and retirement prerequisites recorded.
- Current result: not run; scheduled by DSR-037.

## V57

**Independent product review**

- Method: Reviewer checks full required denominator, negative evidence, release limits, known gaps and exact package identity.
- Required outcome: Only a passing current exact product is eligible for product approval; changed bytes require renewed review.
- Current result: not run; scheduled by DSR-038.

## V58

**Separate admission**

- Method: Owner decision authentic input, exact digest, scope and correct canonical projection; wrong-owner/stale-decision negatives.
- Required outcome: No admission through a boolean/status edit; approval, admission and operational authority remain independent.
- Current result: not run; scheduled by DSR-039.

## V59

**Separate publication**

- Method: Chosen destination/version/access and exact artifact with explicit later authority; absent authority case.
- Required outcome: No network publish/deploy/credential use during planning or implicit release after local PASS.
- Current result: not run; scheduled by DSR-040.

## V60

**UI and historical dispositions**

- Method: Every excluded/deferred/candidate/superseded/research row; Saga retirement, old Lean snapshot and UI release exclusion.
- Required outcome: Explicit owner and successor/disposition; no research or historical snapshot controls current product semantics.
- Current result: not run; scheduled by DSR-041.

## V61

**Optional live-provider envelope**

- Method: Authorized specific live claim, resource/cost/privacy boundary and provider evidence; absent credentials.
- Required outcome: Optional live work is not_requested; a live claim cannot pass without its required evidence.
- Current result: not run; scheduled by DSR-043.

## V62

**Whole-scope closeout**

- Method: Join every capability, decision, work item, validation cell, selected product and residue to current exact evidence.
- Required outcome: All required cells close; no unowned residue, missing required test, ambiguous support status or unverifiable completion claim.
- Current result: not run; scheduled by DSR-042.

## Planning-package checks versus product checks

For this planning turn, validate only JSON shape, unique IDs, complete references,
acyclic work dependencies, test coverage links, decision links, local document
links, current source hashes and preservation of selected preimages. Those
checks establish an internally consistent plan, not successful product behavior.

## Open Questions

Owned by [DECISIONS.md](DECISIONS.md). Missing proof/provider capability affects
only the exact dependent validation cells; it does not erase their obligations.
