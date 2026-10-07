# P1g — pinned DSH Web Host identity-source audit

Status: **candidate source audit**, 2026-10-04. Authority effect: none.
Route: `CA2-ROUTE-RESEARCH`. This does not activate Web mediation or prove that
the installed profile has an exclusive Agent writer.

## Question and bounded context

Can the existing DSH Web SessionController replacement supply the verified
principal, client instance, native session, workspace, creation, and writer
assertion required by ARE's P1 binding journal? The bounded context was the
[D0 controller probe](D0-DSH-WEB-SESSION-CONTROLLER-SEAM-2026-10-04.md),
[P2b Web protocol contract](P2B-DSH-WEB-PROTOCOL-CONFORMANCE-2026-10-04.md),
[P1f journal reuse](P1F-DSH-GATEWAY-BINDING-REUSE-2026-10-04.md), and the
installed DSH Web Connection, Gateway, and SessionController source. No
dependency, profile, credential, or live session was modified.

The inspected lockfile SHA-256 is
`5dfa52f27a953ff9d80c96fcea87d204854d984923cbf0934733ab0b58da6896`.
The top-level DSH pin is `0.1.5-rc.2`; nested `dsh-client-connection` and
`dsh-api-session-controller` are `0.1.5-rc.3`.

## Source findings

1. The Web Connection verifies Host/Origin and an authority-bound signed
   browser cookie before forwarding an HTTP RPC or WebSocket upgrade. Its
   cookie payload contains `version`, `authority`, `issuedAt`, and `expiresAt`.
   It carries no account, browser-instance, workspace, native-session, or
   exclusive-writer claim. The process launch token can mint that cookie; it
   is not a per-conversation creation receipt.
2. The ordinary `/api` handler calls its registered handler with only
   `(endpoint, payload, request.signal)`. The Typert Gateway forwards only
   those values to `dispatchRpc`. The WebSocket upgrade authenticates the
   request, then passes it to the stream mux; its invocation path also opens
   with endpoint, payload, and signal. The SessionController method receives
   decoded `request` data, not a verified browser principal or cookie claim.
3. `SessionController.create` generates a native `session-*` ID only when
   `request.sessionId` is absent. Otherwise it calls `ensureSession` with the
   caller-supplied ID and may adopt a persisted Session after cwd/preset
   checks. `prompt` resolves `request.sessionId`, uses `request.requestId` for
   native idempotency, and then calls `agent.followup` or `agent.steer`.
   Neither string by itself proves who created or owns the session.
4. The D0 replacement probe confirms that a controller method can deny an
   authenticated browser request before normal Agent dispatch. It does not
   add a request-origin identity or close alternate Agent writers.

The source-level inference is that a controller-only replacement cannot
construct a **browser-specific** P1 Host assertion from its arguments. A
trusted in-process DSH Host capability could still issue a **Host-local**
creation/writer assertion for a deliberately single-owner profile, but that
requires a defined Host identity and final-insertion exclusivity contract;
it is not present in this controller interface. If browser-level client
ownership is required, the authenticated carrier must propagate a verified
client identity to the controller or ARE must own an equivalent supported
carrier boundary. Merely hashing the cookie, RPC ID, or requested session ID
would not prove exclusive conversation control.

## Consequence for the integration DAG

P1f storage reuse is viable, but P1 for DSH Web has an earlier dependency:
define whether the client principal is the single DSH Host instance or an
individual authenticated browser, then obtain a trusted creation assertion
at that boundary. Bind it to the native Session and Agent generation and to
the final pre-inbox writer. D0b still needs its supported structural-insertion
seam; P3 then joins ARE objective/context and the exact admitted message.
No `D1` first-turn claim follows from a controller denial probe, a valid
browser cookie, or a durable gateway binding record alone.

## Verification and claim ceiling

- `node --test test/web-session-controller-probe.test.mjs`: 1/1 passed on the
  pinned installed graph. The probe checks reachability and authentication
  rejection, not per-browser identity or exclusive writer ownership.
- Lockfile hash and package versions above were read from the current tree.
- No browser identity, Host assertion, pre-inbox permit, or ARE-owned Web turn
  was produced. This is a source audit, not a negative proof that DSH cannot
  be extended.

## Source selectors

- `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/index.js`:
  `encodeCookie`, `decodeCookie`, `BrowserAuth.isAuthenticated`,
  `HostConnectionService.requestRejection`, `rpcFetchHandler`.
- `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-api-gateway/lib/index.js`:
  `TypertGatewayService` Connection registration and WebSocket upgrade.
- `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-api-session-controller/lib/index.js`:
  `SessionController.create`, `SessionController.prompt`,
  `ApiSessionAgents.createOrAdopt`.

## Open Questions

- The owner subsequently selected one local Host principal for the first
  profile in the [candidate decision record](../P1G-DSH-WEB-HOST-PRINCIPAL-DECISION-2026-10-04.md).
  Per-browser ownership remains a separate future profile decision.
- Which supported DSH Host boundary can attest native Session creation,
  Agent generation, and sole final-insertion writer to ARE?
- Can the carrier convey a verified client assertion without a private DSH
  patch, and if not, which D0b seam delivery path will the owner choose?
