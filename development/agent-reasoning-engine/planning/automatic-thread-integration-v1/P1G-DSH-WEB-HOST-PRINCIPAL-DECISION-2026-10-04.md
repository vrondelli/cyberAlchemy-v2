# P1g candidate decision: first DSH Web principal

Status: **principal type selected; Host assertion unproved**. Date:
2026-10-04. Route: `CA2-ROUTE-PLAN`. Authority effect: none. This is a
planning decision, not Web activation, product approval, or evidence of an
exclusive writer.

## Decision

For the **first qualified ARE-controlled DSH Web profile**, the product owner
selected **one local DSH Host principal** in response to the explicit
single-Host versus per-browser question. The selection applies to a
deliberately single-owner local profile. It does not assert that every
browser tab or account is a distinct owner, nor that the current DSH Web
cookie identifies a conversation writer.

The other considered option was **an individual authenticated browser
principal**. It offers browser-level ownership and potential multi-client
isolation, but the pinned [identity-source audit](evidence/P1G-DSH-WEB-HOST-IDENTITY-SOURCE-2026-10-04.md)
found no verified browser identity reaching `SessionController`; the
authenticated carrier would need an additional supported propagation
boundary. The selected local-Host option avoids treating that absent claim
as present, but restricts the first profile to one trusted Host owner and
does not provide multi-browser or multi-account isolation.

Decision source: the product owner's reply, “Single local Host
(recommended),” to the P1g choice presented during this planning session.
This is a choice of principal **type**, not an instruction to activate the
profile or to accept a synthetic test principal as a Host witness.

## Consequence for the next candidate step

P1g must still source and verify a Host-owned assertion independent of
browser cookie, RPC ID, and caller-supplied `sessionId`. It must bind the
exact local Host instance and workspace scope to native Session creation,
Agent generation, and the sole final-insertion writer before a selected
Web conversation is served. A second writer, wrong workspace/Host, stale
generation, replay, and unbound resume must fail closed. The private
`SessionStore.prepare` guard and the disposable ARE prompt permit are
candidate insertion mechanisms, not proof of this identity or writer
binding. The current synthetic fixture principal remains test-only.

The [revised DAG](REVISED-CODEX-DSH-INTEGRATION-DAG-2026-10-04.md) therefore
keeps P1g and D1 open. Read-only text-only qualification may proceed only
after the Host assertion, effective loaded-plugin/preset closure, durable
prompt/journal reconciliation, and the remaining P2/P3 checks are proven.
Per-browser ownership is deferred to a separately selected profile and
decision; it must not be silently inferred from the local-Host choice.

## Proposed next P1g construction slice

This is a proposed scope, not implementation authorization. In a disposable
pinned Host profile: (1) mint a Host-owned instance assertion tied to the
configured local workspace and lifecycle, not to the browser cookie or
request body; (2) require a fresh native Session ID for initial creation and
deny caller-supplied adoption unless an exact existing binding proves it;
(3) carry one request-scoped creation permit to the synchronous Session
preparation/publication boundary, then persist the exact Session/Agent
generation and writer binding before acknowledging creation; and (4) make
prompt admission verify that binding, not the fixture's synthetic principal.
Test wrong workspace/Host, forged ID, second writer, stale generation,
replay, and failed creation between native persistence and publication.
The pinned `SessionController.create` can otherwise adopt a caller-supplied
ID, and its browser cookie alone cannot close those cases.

The follow-up [Host creation-boundary source audit](evidence/P1G-DSH-HOST-CREATION-BOUNDARY-2026-10-04.md)
locates the construction join more precisely. The Host capability must be
minted from the root `boot(..., prepare)` lifecycle before the config tree
mounts; current `runProfile` does not expose a caller prepare hook. A fresh
creation permit can be consumed at the already patched
`SessionStore.prepare`, and the exact Agent generation plus durable ARE
binding can be joined in the AgentLoop setup callback before Session/Agent
publication. For the first profile, caller Session identity, resume, fork and
request-selected workspace/cwd remain rejected. Dynamic workspace attachment
currently happens after publication and is not part of the first transaction.

This source result answers the lifecycle-seam question but does not finish
P1g: the Host capability, creation permit, binding persistence and recovery
tests are not implemented. It also makes D0b.4 graph closure a direct P1g
dependency because the capability relies on a trusted same-process graph.
The audit also gives the first profile an explicit method posture: constrained
fresh `create`, text-only queued `prompt`, bound `cancel`, and scoped native
reads are candidates; model selection, rename, fork, queue editing,
attachments and native path opening remain rejected until separately
mediated. This is staging, not a permanent full-Web feature reduction.

The follow-up [binding-journal fit analysis](evidence/P1G-DSH-BINDING-JOURNAL-FIT-2026-10-04.md)
selects the existing ARE gateway journal rather than a second DSH ownership
store. Its v1 contract can safely support a fresh, boot-local Session when a
new Web-specific adapter identity, exact Host assertion, native creation
receipt, and final writer are durably bound before publication and activated
before the controller acknowledges creation. It does **not** support Host
restart or native resume: exact boot witnesses change and the native thread
claim is permanent. The first profile therefore remains fresh-session-only;
restart requires an additive handover/reconciliation state machine in the
same journal, not relaxed equality or silent Session adoption.

## Open Questions

- Will the private pinned delivery extend `runProfile` with the root Host
  prepare hook, or will a supported upstream Host-prepare API arrive first?
- How will the exclusive final writer be witnessed across Agent replacement,
  process restart, and native resume without adopting an unbound Session?
- How will the local-only profile reject or explicitly classify access from
  additional browser clients without claiming per-browser isolation?
- Which additive same-journal transition and native evidence can distinguish
  prepared, published, active and quarantined creation after a crash?
