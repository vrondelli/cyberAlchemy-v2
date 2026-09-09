# TASK-ARE-INPUTS-001 — governed input boundaries

Layer: L1. Depends on G-ARE-L0. Status: **planned; local-only preparation until
ACI conformance, all SWUs unselected**.

These units own semantic input preparation only. Under the interim lane they
depend on `SWU-ARE-019` and carry `local_only_non_integrated`; they cannot
allocate or claim ACI, Bus, or APT identity.

## SWU-ARE-010 — IntentRecord to ProblemFrame projection

- Execution owner recommendation: `subagent`.
- Inputs: `intent-record.selected-local@1`, requested conclusion/effect handles,
  projection policy version.
- Outputs: bounded `ProblemFrame`, field/posture map, unresolved-owner residue,
  raw-intent and projection digests.
- Future write scope: `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-projector/**` and its fixtures.
- Dependencies: L0 record schemas and SWU-ARE-019 for any local-only
  implementation; no actor protocol.

Ordered rules: validate version/digests; preserve raw expression; copy all seven
D39 postures; reject file provenance as semantic source; require explicit
revision owner or retain unresolved; map question/candidate/evidence handles and
protected effect without accepting facts; emit deterministic digest.

Failures: unknown version/digest mismatch -> invalid; unresolved source/revision
remains visible; output hypothesis cannot widen scope/effect.

Done when declared/inferred/unresolved, replacement-pressure, cross-run handle,
and deterministic projection fixtures pass.

Verification: `node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-projector/test/*.test.mjs`.

Split analysis: projection can pass independently from authority/catalog
verification and therefore remains separate from SWU-ARE-011.

## SWU-ARE-011 — AuthoritySnapshot and RuleCatalogManifest verification

- Execution owner recommendation: `subagent`.
- Inputs: owner-selected source handles, as-of time, manifest bytes, issuer and
  validator bindings.
- Outputs: verified snapshot/manifest or typed invalid/escalation record; exact
  digests. It does not emit final applicability.
- Future write scope: `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/authority-catalog-loader/**` and fixtures.
- Dependencies: G-ARE-POLICY, SWU-ARE-010 frame handle, and SWU-ARE-019 while
  operating locally.

Ordered rules: load allowlisted version; verify content digest; verify owner,
scope, status, issue/expiry/revocation time; detect authority/self-judgment cycles;
verify evaluator/conclusion-domain binding; expose manifest-required candidate
obligations; never infer missing authority.

Failures: missing owner/version, digest mismatch, expired/revoked state, cycle,
self-authorization, unknown evaluator -> reject or explicit owner escalation
under the pinned policy.

Done when version/digest/time/revocation/cycle/self-authorization and candidate-
obligation fixtures pass without calling evaluator/actors.

Verification: `node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/authority-catalog-loader/test/*.test.mjs`.

Handoff: select one SWU only; provide this task, binding architecture, local-only
guard receipt when applicable, design component contracts, L0 receipt, and
owner records. No handoff is ready until exact closeout synchronization is
bound. Return the result shape in
[`../../EXECUTION-PACK.md`](../../EXECUTION-PACK.md).
