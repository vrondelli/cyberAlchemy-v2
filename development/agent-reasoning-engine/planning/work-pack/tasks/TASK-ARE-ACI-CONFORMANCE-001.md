# TASK-ARE-ACI-CONFORMANCE-001 — ACI-subordinate containment and conformance

Layer: L1 containment/conformance. Status: **planned; all SWUs unselected and
implementation blocked**.

## Objective

Make option A executable without creating a second runtime authority. The task
first separates explicitly local-only evidence from integrated identities, then
admits current external fixture vectors before authoring pure ACI mapping code.

The task does not implement the ACI journal, canonicalize commands on ACI's
behalf, accept Work Bus publications, create effect intents, or mutate the
external orchestrator.

## Source contracts

- [`../../../design/aci-reasoning-binding/ARCHITECTURE.md`](../../../design/aci-reasoning-binding/ARCHITECTURE.md)
- [`../../../decisions/aci-reasoning-binding/BINDING-RECEIPT.json`](../../../decisions/aci-reasoning-binding/BINDING-RECEIPT.json)
- [`../../aci-subordinate-conformance/CONTEXT-PACK.md`](../../aci-subordinate-conformance/CONTEXT-PACK.md)
- [`../../aci-subordinate-conformance/DISPATCH-TECHNIQUE-TRACE.md`](../../aci-subordinate-conformance/DISPATCH-TECHNIQUE-TRACE.md)
- external ACI ADR-001, ACI work-pack, Bus assessment, ACP discovery, and APT
  work-pack at the exact digests in the context pack

## Gate state

- `G-ARE-ACI-BINDING`: pass for owner disposition.
- `G-ARE-ACI-CONFORMANCE`: block; current owner receipts and cross-repository
  fixtures do not exist.
- `G-ARE-LOCAL-CONTAINMENT`: plan-ready only; no SWU is selected.
- Task Session closeout synchronization: block until an exact per-SWU target
  inventory and owner receipt is added to the work-pack.

## SWU-ARE-019 — local-only non-integration guard

- Primary behavior: reject any local-only run or artifact that claims, imports,
  or fabricates integrated ACI identity.
- Independent acceptance boundary: a finite posture/namespace fixture matrix
  either emits `local_only_non_integrated` or blocks before any ACI/Bus/APT
  port can be called.
- Execution owner recommendation: `subagent`.
- Inputs: binding receipt, local run namespace, requested compatibility posture,
  candidate external IDs/refs, and port call counters.
- Outputs: admitted local-only handle or typed boundary violation; zero external
  calls in every case.
- Dependencies: accepted binding receipt only; no external runtime maturity.
- Future write scope:
  `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/local-only-boundary/**`
  and its fixtures.
- Source anchors: binding receipt `binding.localInterimPosture` and
  `claimCeiling`; binding architecture risks `R-BIND-01`, `R-BIND-02`, and
  `R-BIND-05`.

Ordered rules:

1. Validate binding version and exact option-A receipt digest.
2. Require the namespace and posture to be explicitly local-only.
3. Reject ACI command IDs, journal spans, canonical acceptance receipt IDs,
   effect-intent IDs, Work Bus acceptance IDs, or APT lifecycle writes unless
   they are marked immutable external references supplied by a later conforming
   read boundary.
4. Reject `aci-compatible`, `integrated`, `canonical`, or equivalent claims.
5. Close with zero external port calls on every rejection.
6. Emit only a digest-bound local handle with the non-integration posture.

Failure modes: missing posture, alias/case variants of integrated claims,
fabricated external ID, copied schema with no owner receipt, namespace
collision, stale binding digest, or any external call.

Done when the positive local-only fixture and every claim/identity/namespace
negative fixture pass with zero ACI, Bus, APT, effect, and provider calls.

Verification:

```bash
node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/local-only-boundary/test/*.test.mjs
```

Split analysis: namespace/posture rejection closes independently from external
fixture admission and mapping, so it remains its own SWU. It cannot be split
into claim and identity guards because either half alone would permit the same
integration impersonation.

## SWU-ARE-016 — external conformance fixture admission

- Primary behavior: admit exactly one complete, owner-receipted external
  conformance vector set or return a typed block.
- Independent acceptance boundary: the admitted manifest is deterministic,
  digest-bound, complete for the declared profile, and contains no invented
  external contract.
- Execution owner recommendation: `subagent`.
- Inputs: current ACI owner receipts, exact contract/fixture bytes and digests,
  runtime/dependency pins, Bus/ACP/APT receipts only when those optional seams
  are included.
- Outputs: `aci-conformance-input@1` manifest with admitted vectors, exclusions,
  owner receipts, source commits/digests, required/optional seam posture, and
  residue.
- Dependencies:
  - ACI `workPackGateStatus=pass` for the exact conformance surface;
  - completed/accepted W0 contracts and TASK-010 canonical/crash fixtures;
  - explicit Bus `PASS` if publication vectors are included;
  - confirmed ACP/`DispatchSpec` receipt if protocol vectors are included;
  - APT mutation/contract receipt only if provenance vectors are included.
- Future write scope:
  `cyberAlchemy-v2/implementation/agent-reasoning-engine/fixtures/aci-conformance/**`
  and
  `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/aci-conformance-harness/**`.
- Source anchors: ACI ADR-001 status, atomic transaction, canonical bytes, and
  crash-boundary sections; Bus assessment falsifiers 1–8; context-pack source
  digest table.

Algorithm:

1. Load the selected external profile and require a current owner receipt for
   every mandatory seam.
2. Verify source commit, artifact bytes, content digest, schema/contract version,
   dependency pins, and receipt scope.
3. Require complete positive, rejection, idempotency, CAS, lost-response, crash,
   and replay vectors for the admitted ACI profile.
4. Mark Bus, ACP, and APT seams `excluded` unless their own current receipts
   pass; exclusion may not be represented as success.
5. Reject placeholders, globs, prose-only examples, shape similarity, unknown
   versions, or self-authored owner receipts.
6. Canonicalize only the local manifest; never recompute or redefine ACI
   accepted bytes.

Failure modes: stale/mismatched owner receipt, partial vector set, unpinned
dependency, missing rejection vector, source digest drift, optional seam
smuggled into mandatory scope, or local redefinition of external bytes.

Done when the manifest accepts one complete positive fixture family and rejects
each missing/stale/partial/drifted family independently.

Verification:

```bash
node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/aci-conformance-harness/test/fixture-admission.test.mjs
```

Split analysis: receipt/digest/completeness admission is one gate over one
fixture set. Mapping logic can pass only after this output exists and is
therefore separate.

## SWU-ARE-017 — semantic artifact reference mapping

- Primary behavior: map one finalized semantic reasoning artifact reference into
  a candidate ACI command payload projection without claiming canonical
  acceptance.
- Independent acceptance boundary: fixture comparisons prove total field
  ownership and reject receipt-identity collapse.
- Execution owner recommendation: `subagent`.
- Inputs: admitted conformance manifest, confirmed `DispatchSpec` ref when
  available, frozen semantic run/receipt artifact ref and digest, candidate ACI
  command envelope inputs.
- Outputs: candidate command projection plus ownership trace; never an accepted
  command, ACI receipt, journal span, or effect intent.
- Dependencies: SWU-ARE-016, artifact-admission owner receipt, and confirmed
  dispatch contract for any integrated profile.
- Future write scope:
  `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/aci-binding-contract/**`
  and mapping fixtures.
- Source anchors: binding architecture `ReasoningRunCommandMapper`,
  `ReasoningReceiptReferenceMapper`, minimum envelope, and interface table.

Algorithm:

1. Validate the admitted external profile and semantic artifact finalization
   receipt.
2. Require exact dispatch, semantic run, artifact, and candidate command
   reference fields owned by the source contracts.
3. Project only fields permitted by the admitted mapping table.
4. Preserve semantic content as an immutable ref/digest.
5. Leave command ID, canonical bytes/digest, receipt identity, journal span, and
   effect intent absent until returned by ACI.
6. Reject unmapped, duplicated-owner, unknown-version, or receipt-collapsing
   fields.

Failure modes: artifact not finalized, digest mismatch, unknown dispatch
revision, missing owner, local command ID invention, semantic receipt used as
ACI receipt, or extra field.

Done when golden positive/negative mappings pass against the admitted external
vectors and the output has no ACI acceptance fields.

Verification:

```bash
node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/aci-binding-contract/test/semantic-reference-mapping.test.mjs
```

Split analysis: semantic-reference projection owns one outbound mapping.
Inbound actor-event projection has the opposite data direction and can fail
independently, so it is SWU-ARE-018.

## SWU-ARE-018 — ACI actor-event read projection

- Primary behavior: derive one immutable evaluator-facing actor cut from a
  verified ACI journal cut without writing lifecycle state.
- Independent acceptance boundary: ordered accepted facts project
  deterministically; unverified, gapped, stale, late, or unknown facts block or
  remain explicit residue.
- Execution owner recommendation: `subagent`.
- Inputs: admitted conformance manifest, verified ACI command receipt and event
  span, journal offsets/aggregate versions, artifact refs, frozen evaluator
  manifest.
- Outputs: evaluator-facing immutable actor cut with source refs/digests and
  typed late/unresolved residue.
- Dependencies: SWU-ARE-016 and SWU-ARE-017; ACI TASK-010 runtime receipts.
- Future write scope:
  `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/aci-actor-event-reader/**`
  and read-projection fixtures.
- Source anchors: binding architecture `ActorEventMapper`, workflow steps 3–6,
  and replay boundary; ACI ADR-001 journal cursor and transaction contracts.

Algorithm:

1. Verify the ACI receipt, event span, offsets, aggregate versions, source
   digests, and admitted contract version.
2. Read committed facts only; never open a write connection or invent missing
   events.
3. Preserve ACI order and identity while projecting evaluator-owned proposal,
   failure, timeout, join, close, and challenge inputs.
4. Mark late/stale/unknown facts explicitly; never reopen an ACI terminal state.
5. Return immutable source handles to the evaluator admission boundary.

Failure modes: invalid receipt, non-committed event, offset/span gap, aggregate
version mismatch, unknown event version, artifact digest mismatch, attempted
write, or hidden late fact.

Done when positive, gap, stale, late, unknown-version, digest, and zero-write
fixtures pass against the admitted vectors.

Verification:

```bash
node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/aci-actor-event-reader/test/*.test.mjs
```

Split analysis: one inbound read projection is coherent and independently
reviewable. Work Bus publication mapping and evaluator observation admission
remain separate SWUs/owners.

## Handoff

No SWU in this task is selected. A future handoff must name exactly one SWU,
generate an execution-time Context Builder pack, bind a complete Task Session
closeout synchronization contract, and return the exact result shape in
[`../../EXECUTION-PACK.md`](../../EXECUTION-PACK.md).

## Completion evidence

None. Plan authoring is not implementation evidence.
