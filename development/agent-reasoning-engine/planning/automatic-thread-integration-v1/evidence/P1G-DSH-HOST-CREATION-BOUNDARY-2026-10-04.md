# P1g — pinned DSH Host-local creation boundary

Status: **candidate source evidence and construction refinement**, 2026-10-04.
Route: `CA2-ROUTE-PLAN`. Authority effect: none. This does not implement a
Host assertion, activate DSH Web, or prove an exclusive writer.

## Result

The pinned DSH graph has the required *ordering surfaces* for a Host-local
creation assertion, but does not currently compose them into that assertion.
The earliest Host-owned boundary is `dsh-app-boot.boot(..., prepare)`: it runs
after the root Context and Loader exist and before any config-tree entry
mounts. `runProfile` uses that callback internally to publish the launch
environment and command-line service, but its public options do not accept an
additional caller-owned prepare hook. A qualified profile therefore needs an
exact pinned private delivery change (or an equivalent first-party API) to
install the assertion owner before Web readiness and before the first Session
is prepared.

The creation transaction can then join surfaces already present in the pin:

1. During Host preparation, mint a non-serializable, process-local Host
   capability and boot nonce, bind it to the root Context lifecycle, the
   qualified graph epoch, and one canonical workspace path. The existing
   Workspace package uses `fs.realpath` as its path canon. Browser cookies,
   RPC IDs, requested Session IDs, PIDs and environment strings are not the
   capability.
2. Install the private `SessionStore.installAppendAdmissionFactoryV1` owner
   before the first `prepare`. The selected Web controller must reject a
   caller-supplied `sessionId`, caller-selected `cwd`, resume and fork in the
   first profile. It generates a fresh native ID and issues one in-process
   creation permit for the exact `(Host capability, boot, graph epoch,
   canonical workspace, Session ID, preset)` tuple.
3. `SessionStore.prepare` consumes that permit synchronously and installs the
   append guard before constructor/setup events. Any direct `agents.create`
   path that lacks the permit fails at the same lower boundary. This is a
   stronger owner join than a browser field or a later creation event.
4. `AgentLoop.setupAndPublish` invokes the caller's setup callback before
   `sessions.enter/announce`, `agents.enter/announce`, and
   `agent/session-start`. At this point the exact Session and Agent objects
   exist but are unpublished. Mint a monotonic boot-local Agent generation,
   verify the Session's Host capability and actual standing mount, and durably
   append the ARE binding before publication. If setup or the binding append
   fails, the prepared Agent is disposed and the persistence handle is
   closed; no success response may be returned.
5. `SessionCommandController.create` returns only after `ensureSession`
   resolves, but its optional `workspace.attachSession` currently happens
   **after** Agent publication. To avoid a published-but-unattached failure in
   the first profile, bind one preconfigured canonical workspace and reject
   request-selected `workspaceId`/`cwd`; dynamic workspace attachment needs a
   later transaction/recovery proof.

The Host capability is a same-process capability under the closed,
source-pinned graph premise. It prevents a browser request from inventing Host
ownership, but is not a sandbox against arbitrary code already executing in
that process. D0b.4 graph closure and early provenance remain prerequisites.

## First-profile SessionController posture

The pinned controller has 16 methods. The first Host-owned text-only profile
must not expose them all under a generic replacement:

| Posture | Methods | Required qualification |
| --- | --- | --- |
| Candidate allow | `create` | Fresh Host-minted ID, fixed canonical workspace and preset, creation permit, unpublished binding commit; no adoption |
| Candidate allow | `prompt` | Bound live Agent generation, text-only `queue` mode, exact ARE/graph permit and native ACK/terminal tracking |
| Candidate allow | `cancel` | Exact bound live Agent; cancellation receipt and recovery classification |
| Candidate allow, scoped reads | `list`, `search`, `page`, `follow`, `control`, `modelCatalog`, `canOpenWorkspacePath` | Dedicated profile plus results filtered to Host/ARE-bound Sessions where applicable; reads grant no writer claim |
| Reject initially | `selectModel` | It mutates both Session selection and attempts to save the Host default; model choice must instead be fixed/bound before prompt |
| Reject initially | `rename` | Session mutation is not required to prove the first controlled turn and needs bound mutation/recovery evidence |
| Reject initially | `fork` | It creates a seeded child and attaches workspace after publication; guarded seeds/resume are unqualified |
| Reject initially | `updateQueue` | It edits/removes/steers an already admitted inbox item directly and can change prompt content without a fresh ARE permit |
| Reject initially | `attachment` | The first profile is text-only; attachment admission/storage/read authorization remains separate |
| Reject initially | `openWorkspacePath` | Native Host effect belongs to E0/E1, not read-only qualification |

This is a staged qualification posture, not the intended final feature
ceiling. Each rejected method needs its own mediated contract before full Web
parity. Unknown or newly added methods fail closed through the existing closed
protocol catalog.

## Source evidence

- `dsh-app-boot/lib/index.js:boot` creates the root Context, mounts Loader,
  awaits `prepare`, then mounts and settles the config tree.
- `dsh/lib/profile-boot-Dk-7KqJc.js:runProfile` supplies the internal prepare
  callback but exposes no caller prepare option.
- `dsh-api-session-controller/lib/index.js:SessionCommandController.create`
  accepts optional caller `sessionId`, `workspaceId` or `cwd`, invokes
  `ensureSession`, and attaches a workspace only after creation returns.
- `dsh-agent-loop/lib/index.js:setupAndPublish` awaits setup, flushes the
  unpublished suffix, then calls `publish`; `publish` orders Session enter and
  announce before Agent enter and announce.
- `dsh-agent/lib/index.js:AgentRegistry.create` delegates to the loop factory;
  `enter`/`announce` expose an exact unpublished-to-published object boundary.
- The current private Session patch installs one synchronous guard factory
  before the first `SessionStore.prepare` and rejects guarded nonempty seeds.

Current source SHA-256 values are: profile boot
`8b79b5c70281f23153ecc1828ba9b6e7b48364cc71409c90f12bde4cc4d7cde0`,
app boot `d8fdfe41996a4fefcff63af4982787924b0ae651f24bb1402f775b70202529bb`,
Agent registry `b05aa36fce8e2f910596a682fb1d2b461eac2549e344360c92711a557d06b0bb`,
Agent loop `257eb83c00a05ee068e9f4ba80ca71ab94e3a1275d24b7a0cf5038ff23dd0fd8`,
and Session controller
`16ecb48f33996efe72868f1603223214430634c5ac4c3e8fe9060bf240e990ff`.
The adapter lockfile remains
`5dfa52f27a953ff9d80c96fcea87d204854d984923cbf0934733ab0b58da6896`.

## Remaining gaps and claim ceiling

The current private factory installs an append guard, not the Host capability
or creation permit described above. Resume cannot qualify yet: the factory
rejects any nonempty seed before validation, while native resume necessarily
loads persisted events. Fork, dynamic workspace selection, failed binding
append recovery, process restart, old Agent generation, second writer and
alternate producer rejection all remain unproved. Multiple authenticated
browser tabs cannot be distinguished at the controller; in the selected
single-Host profile they must be explicitly classified as interfaces acting
for the same Host principal, never as separately owned clients.

P1g therefore remains open. The source proves a feasible bounded construction
path, not a supported shipped Host assertion or ARE-controlled DSH Web session.

## Open Questions

- What exact durable journal record and recovery state represents a native
  persistence handle created before an ARE binding append fails?
- What exact recovery evidence is required before `rename`, `selectModel`,
  bound queue mutation or seeded child creation can move out of reject state?
- Can the pinned private delivery be replaced by a supported upstream
  `runProfile` Host-prepare extension before qualification?
