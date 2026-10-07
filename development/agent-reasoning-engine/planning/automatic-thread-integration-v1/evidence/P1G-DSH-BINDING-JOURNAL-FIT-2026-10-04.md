# P1g — DSH Web fit against the existing ARE binding journal

Status: **candidate planning evidence; fresh-session fit only**. Date:
2026-10-04. Route: `CA2-ROUTE-PLAN`. Authority effect: none. This document
does not activate DSH Web, authorize a private patch, or prove restart and
resume recovery.

## Decision

Do **not** add a second DSH binding store. The existing file-backed ARE
gateway session store and `are.conversation-binding/v1` contract can be
reused for the first, fresh, boot-local DSH Web creation path. That reuse is
safe only when the Web surface has a distinct adapter identity from the
existing `deepseek-harness-headless/v1` adapter and all native identities are
derived by the local Host rather than accepted from the browser request.

The current contract is not sufficient for Host restart, native Session
resume, or generation rollover. It fixes a new binding at generation `1`,
matches the complete Host assertion on authorization, and permanently claims
the adapter/native-thread pair. A new boot changes the Host instance and
writer witnesses, while replay correctly refuses to rebind the already
claimed native thread. This is fail-closed behavior, not a recovery protocol.
The first profile must therefore remain fresh-session-only and reject resume;
later recovery requires an explicit, additive handover/reattachment state
machine in the same journal rather than a second store or a relaxed verifier.

## Field mapping for the fresh profile

| Binding field | DSH Web source | Qualification boundary |
| --- | --- | --- |
| `backend_adapter_id` | A new Web-specific adapter identity | Must not reuse `deepseek-harness-headless/v1`; the exact new identifier is selected with the implementation contract. |
| `backend_thread_ref` | Digest of the Host-minted native DSH Session identity plus adapter namespace | Caller-supplied Session adoption is rejected. |
| `principal_kind` | `local-host` | The selected first-profile owner; this is not browser/account identity. |
| `principal_ref` | Digest of the stable selected local-Host policy/installation identity | Must not be a PID, browser cookie, RPC ID, or raw filesystem path. |
| `host_instance_ref` | Digest of the boot nonce, pinned profile/source identity, and closed graph epoch | Changes on restart; exact reproduction is required during the boot. |
| `client_instance_ref` | Digest of the Host-owned Web surface instance | Identifies the single local surface, not an individual browser tab. |
| `workspace_ref` | Digest of the canonical preconfigured workspace and profile scope | The first profile rejects request-selected workspace/cwd. |
| `writer_ref` | Digest of the Host capability, creation-permit broker, final-insertion writer, and Agent generation | A replacement Agent or second writer changes the witness and is rejected. |
| `creation_receipt_digest` | Digest of the exact unpublished native Session/Agent creation, mount, graph epoch, workspace, and writer witnesses | The contract stores the digest, not the receipt body; first-profile verification retains the exact in-process receipt until activation. |

Graph epoch and DSH Agent generation are not first-class fields in the v1
binding schema. Binding them into `host_instance_ref`, `writer_ref`, and the
creation receipt is adequate for exact boot-local equality checks, but makes
them opaque to independent journal queries. They must not be confused with
the binding contract's fixed generation `1`. An additive protocol-neutral
event/schema is needed before those values can support durable restart
reconciliation.

## Fresh creation transaction

The candidate transaction uses the already identified Host creation seam:

1. Before the DSH configuration tree mounts, the root Host prepare hook mints
   a non-serializable Host capability and boot nonce bound to the canonical
   workspace, closed graph epoch, and a Web-specific adapter identity.
2. The Host opens one active gateway consumer session whose backend process
   identity and birth reference correspond to this boot.
3. `SessionController.create` rejects caller Session identity, resume, fork,
   and request-selected workspace/cwd, then mints a one-use creation permit.
4. The private `SessionStore.prepare` factory consumes that permit for the
   fresh Session and installs the pre-inbox guard.
5. In `AgentLoop` setup, after the native Session and Agent exist but before
   either is published, the Host appends `thread-bound` and then a `bound`
   conversation-binding event with the exact Host assertion and creation
   receipt digest. Both must durably succeed before setup returns.
6. Native publication proceeds. After `ensureSession` returns, the controller
   verifies that the same Session, Agent generation, graph epoch, workspace,
   and writer are still current; it activates the existing binding before
   acknowledging `session/create` to the Web client.
7. Prompt admission authorizes only an active binding and re-verifies the
   exact Host assertion at the final native insertion boundary.

There are two durable appends before publication (`thread-bound`, then
`bound`), not one atomic multi-event transaction. A crash between them can
strand a claimed native thread. That state is safe because it cannot
authorize a turn, but it requires explicit quarantine/reconciliation and must
never be retried as a fresh adoption.

## Failure and recovery matrix

| Failure point | Required result in the first profile | Current fit |
| --- | --- | --- |
| Before `thread-bound` | No ARE ownership and no published native Session | Fits if native cleanup is verified. |
| After `thread-bound`, before `bound` | Claimed-but-unbound; no turn; quarantine, no blind retry | Fail-closed in the current store; recovery workflow remains to implement. |
| After `bound`, before native publication | Bound-but-inactive; no turn; reconcile or quarantine | Fits fail-closed; exact native residue behavior still needs fault injection. |
| After publication, before `active` | Native Session visible but ARE-inactive; no prompt accepted; reconcile or quarantine | Fits fail-closed; the controller must not acknowledge creation. |
| `active` append/fsync indeterminate | Block all reuse and retry; operator-visible persistence-indeterminate state | Fits the existing contract's safety posture. |
| Host restart or native resume | Do not adopt; require a future authenticated handover/reattachment protocol | Does not fit v1 and is explicitly excluded from the first profile. |

The existing gateway host-observation and request-recovery records remain
Codex-shaped (`thread/start`, `turn/start`, and Codex process observations).
They are not DSH recovery evidence. P1f established reusable binding state,
not reusable DSH protocol recovery.

## Required additive recovery design

Recovery should extend the same append-only gateway journal with a
protocol-neutral native-creation lifecycle; it should not create a parallel
DSH text history. The later design must durably represent at least:

- native creation prepared but unpublished;
- binding committed but native publication unknown;
- native publication witnessed but binding inactive;
- exact Host restart/handover proof and Agent-generation change;
- reconciled activation or terminal quarantine.

The native creation receipt body (or a content-addressed canonical record)
must be recoverable, not only its digest. Any reattachment must be a named
transition that proves the previous owner is terminal and the native Session
journal is contiguous. Relaxing exact assertion equality or clearing the
permanent thread claim is not an acceptable substitute.

## Acceptance consequences

- P1g can use the existing P1b journal for a fresh-only prototype; no second
  binding database is needed.
- P1g is still open: the Host capability, Web-specific adapter identity,
  creation transaction, fault injection, quarantine projection, and negative
  tests are not implemented.
- D0b.4 remains a direct prerequisite because the boot and writer witnesses
  depend on a closed, trusted loaded graph.
- D1 cannot claim restart/resume until the additive recovery state machine is
  implemented and qualified.

## Open Questions

- Which exact Web-specific adapter identifier and schema version will the
  implementation contract select?
- Is the additive native-creation lifecycle encoded as new gateway events or
  a versioned extension of conversation-binding events while preserving old
  replay behavior?
- What native DSH evidence can distinguish unpublished, published, and
  acknowledged creation after a crash without replaying a prompt?
- What owner-authorized transition permits restart handover while preserving
  permanent single-writer ownership?

## Source selectors

- `implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/conversation-binding-contract.mjs`
- `implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway-session-store.mjs`
- `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/index.mjs`
- `evidence/P1F-DSH-GATEWAY-BINDING-REUSE-2026-10-04.md`
- `evidence/P1G-DSH-HOST-CREATION-BOUNDARY-2026-10-04.md`
