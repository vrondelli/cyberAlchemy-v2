# D0b: supported DSH pre-inbox admission contract

Status: **candidate construction contract with private-patch seam implemented**, 2026-10-04. Authority effect:
none. Original route: `CA2-ROUTE-PLAN`; private patch construction: `CA2-ROUTE-IMPLEMENT`.
This refines the D0b dependency of the
[revised integration DAG](REVISED-CODEX-DSH-INTEGRATION-DAG-2026-10-04.md).
The candidate applicator modifies only the pinned local DSH installation;
it does not activate an ARE-owned Web profile.

## Outcome and decision posture

The intended product remains full DSH Web control for selected conversations:
Web and active Host producers must pass through ARE before any native Agent
inbox insertion, and DSH must retain its own session journal and driver. A
reduced Web feature set is a separately named fallback, not a substitute for
that outcome. The owner selected **option 2, private pinned patch first**, on
2026-10-04. This is prototype sequencing, not a decision against a later
maintainer-supported release. The considered options were:

1. Add a maintainer-supported, versioned pre-inbox admission capability to
   DSH (preferred for full Web parity). Contribute upstream or consume an
   accepted release only after dependency/license/version review.
2. Maintain a private, pinned DSH patch/fork with the same contract and a
   rebase/conformance obligation. This can unblock a prototype but transfers
   dependency maintenance to ARE.
3. Build an explicitly restricted Web profile and prove every remaining writer
   closed. It loses goal, command, plan, subagent, plugin and/or preset
   capabilities; do not label it full DSH Web.

The pinned runtime has no documented pre-inbox hook. The disposable
`agent/created` method-override probe proves timing only. Its monkey patch
must not become a production admission boundary. Upstream documentation
likewise describes `agent/pre-step` after inbox claim, while a public
pre-inbox hook request remains a proposal, not a released contract.
The inspected local graph is `@deepseek-ai/dsh@0.1.5-rc.2` with nested
`dsh-agent-loop@0.1.5-rc.3` and `dsh-agent-presets@0.1.5-rc.3`;
`package-lock.json` SHA-256 is
`5dfa52f27a953ff9d80c96fcea87d204854d984923cbf0934733ab0b58da6896`.
Upstream `master` documentation is directional evidence, not proof that a
newer released dependency has the needed hook.

## Minimum candidate seam

The seam must cover every native insertion route for *all* live Agents,
including resumed and child Agents. A per-controller check is too high, and
an `agent/pre-step` veto is too late. The pinned graph has no universal
Inbox-only insertion point when same-process code can call `Agent.session`.
The upstream-facing contract should provide these properties:

The [private pinned Session append patch evidence](evidence/D0B-PRIVATE-PINNED-SESSION-APPEND-PATCH-2026-10-04.md)
records the first candidate checkpoint: a version/hash-bound applicator adds
a synchronous, one-shot guard to `Session.append` before journal commit and
notification. A disposable authenticated Web fixture proves a normal prompt
and direct Session inbox/user-surface writes are denied before commit.
Detached tests prove an example single-use permit rejects replay. This
**satisfies only D0b.2's insertion-point feasibility**, not ARE permit
ownership, all-producer mediation, profile closure or D0b conformance. The
guard is installed per Session, not per Agent; future binding must map every
live Agent generation to that protected Session and fail readiness on an
unprotected or incorrectly guarded Session.
The [ARE-prepared Web prompt candidate](evidence/D0B-ARE-PREPARED-WEB-PROMPT-PERMIT-2026-10-04.md)
now composes a real direct ARE route/context result with a request-scoped,
single-use permit and the pinned native controller. In a disposable
authenticated Web Host, one text prompt reaches a zero-tool local model and
native turn end. It uses a **synthetic** Host principal and a **restricted**
no-tool preset; this is not a P1g witness or full D0b producer/profile
closure. The Host read-only overlay alone proved insufficient because the
stock standard preset still advertised model-facing tools.

The [pinned writer-graph test](evidence/D0B-DSH-WRITER-GRAPH-CONFORMANCE-2026-10-04.md)
confirms that `Agent.inbox.splice` is public and appends without `Agent.send`.
Consequently a `send` hook alone is insufficient; insertion enforcement must
cover the Inbox structural API, while the qualified plugin graph must forbid
unreviewed direct Session-log writers.
The [final-mutator diagnostic](evidence/D0B-DSH-FINAL-MUTATE-SEAM-PROBE-2026-10-04.md)
further shows that pinned runtime JavaScript exposes `Inbox.mutate` as a
callable implementation method that `splice` uses, while direct `mutate`
does not return through `splice`. In a disposable live Web Agent, a plugin
then bypassed an insertion guard on `mutate` by calling
`agent.session.append("agent/inbox/spliced", ...)`; the valid synthetic message
projected into the inbox and was canceled before a turn. Thus a mutator hook
alone is incomplete whenever direct Session writers remain loaded. The
contract must guard that event at Session append/journal admission, or enforce
an exact trusted-plugin graph in which such writers cannot run. Native
removals and claims must remain possible without becoming fake ARE prompts.

- An installed admission owner is explicit per Agent/profile. With that owner
  active, direct `followup`, `steer`, `inject`, and direct inbox insertion
  without an ARE-bound permit fail **before** `agent/inbox/spliced` is appended
  or a driver wake is requested. Unqualified Agents retain normal DSH behavior.
- A same-process producer cannot evade this guarantee by calling the
  runtime-callable Inbox mutator or Session append directly. A bounded scan of
  the pinned shipped JavaScript found one literal append site for
  `agent/inbox/spliced` in the Inbox mutator, but the live probe proves a
  dynamically loaded plugin can append the same event directly. Static
  absence from shipped code is not profile closure. Arbitrary untrusted
  same-process plugins require a stronger isolation/capability boundary than
  a mutable JavaScript method hook can provide.
- A producer-specific, asynchronous preparation call obtains an ARE decision
  and a single-use in-process permit for one exact Agent/session, source,
  message identity/content digest, delivery mode and request key. The native
  insertion itself remains synchronous and validates/consumes the permit at
  the final insertion boundary. A caller-supplied source label alone cannot
  grant admission.
- The insertion result and DSH journal identity are observed separately from
  the ARE decision. ARE may report prepared/accepted only at the matching
  boundary. A crash between ARE preparation and DSH append is reconciled
  against the native journal/request key; absence is not guessed from a lost
  response. A duplicate key cannot insert a second prompt.
- Rejection/outage before native insertion leaves no claimed prompt, no
  model-visible message and no misleading ARE acceptance. Cancellation,
  disposal, resume, and a changed Agent generation invalidate unused permits.
- A second guard at `agent/pre-step` may block a model request lacking the
  expected ARE binding, but is defense in depth only: it cannot undo or
  losslessly recover an already claimed inbox message.

The design must distinguish ordinary user prompts from Host-generated
continuations, plugin feedback and child delivery. It must not turn every
Host-internal event into a fake human prompt. ARE's context/evolution records
need source attribution without copying private reasoning or creating a
second replay history.

## Producer migration and profile closure

The complete Web profile cannot qualify by replacing `session-controller`
alone. Migrate or explicitly disable each active producer:

| Producer | Required proof for full Web profile |
| --- | --- |
| Web `session/prompt` | Authenticated request, exact native session and request key, ARE preparation, one native insert, distinct ACK/completion. |
| `goal-round-driver` | Autonomous next-round request has its own ARE continuation decision and source attribution. |
| `command-goal` | Human command content is admitted as command-origin input; no direct Agent call bypasses the permit. |
| `plan-mode` | Mode-change steering with content is admitted or rejected before native insert. |
| `subagent` and child backends | Parent/child ownership and delivery are explicit; child messages cannot silently inherit the parent's human-prompt receipt. |
| `cordis-host-runner` | Plugin run/render/handler feedback uses a typed Host-origin permit, or the feature is disabled in a named restricted profile. |
| Dynamic plugins and presets | Loaded graph is exact and versioned; unknown rows, user roots, settings-selected presets and runtime reloads cannot add an unmediated writer to a qualified profile. |

The shipped Web profile reads shipped and user preset roots by default, and
its `standard` preset itself mounts goal, plan, tool and delegation producers.
Disabling the base rows alone is insufficient. A restricted prototype would
need an ARE-owned preset root with shipped/user roots disabled, a closed Host
row set, no dynamic plugin runner or user overlay, and a pre-readiness digest
of the **runtime-evaluated** Host *and* preset compositions. `--dump-config`
prints unevaluated `!!js` expressions and the Host rows, not the mounted
preset graph; its hash is only a source-drift check. Runtime Loader and preset
inventory must agree with the lock before the Web surface is offered, and the
profile must prevent later unqualified reload or preset selection. Its tool/effect limits are a
separate gate; a stock `minimal` preset is not read-only because it exposes a
persistent shell. Profile drift must fail closed, not silently re-enable a row.

The [D0b.4 pinned graph-lock source audit](evidence/D0B4-DSH-EFFECTIVE-GRAPH-LOCK-SOURCE-AUDIT-2026-10-04.md)
identifies an existing Web `plugin-inventory` read model and
`agentPresets.compositionInventory()`. They expose evaluated Loader and
mounted-preset rows, but do not enforce a lock, enumerate every direct
Cordis registration, or attest an older Agent's retained preset generation.
Settings/default changes, preset file remounts, `select` and Loader restart
also require a fail-closed graph epoch. D0b.4 remains open.

## Dependency and test graph

```text
P2c active-writer inventory + D0b timing probe
  ├─> D0b.1 owner choice: private pinned patch first [selected]
  ├─> D0b.2 private typed pre-journal API + insertion-point feasibility [candidate seam proven]
  ├─> D0b.3 producer migration or explicit disablement
  ├─> D0b.4 effective Host/preset graph lock + dynamic-load rejection
  └─> D0b.5 crash, duplicate, resume, child and outage conformance
        └─> D0b closure review
             └─> D1 ARE-owned Web first-turn proof (also needs P1/P2/P3)
```

`D0b.2` and `D0b.3` cannot be called done from a static source scan. Tests
must exercise Web prompt, goal, command, plan, child and plugin paths in a
disposable authenticated Host. For each source: no permit rejects before
`agent/inbox/spliced` and before model dispatch; a valid permit inserts once;
wrong Agent, request key, source, mode, content, generation and replay reject.
Inject a failure at ARE preparation, native append, ACK delivery and restart;
recover from DSH's journal without blind redispatch. An unknown enabled plugin
or newly discovered preset must make qualification fail. Maintain conformance
against the exact pinned dependency graph and repeat it before upgrades.

## Boundaries and open questions

This contract plus the owner-selected candidate patch is not an upstream issue,
read-only release, or Web activation. P1's real
Host identity/writer binding, P3's objective/context receipt, P2's lifecycle
matrix and D1's visible first turn remain separate prerequisites. The candidate
Web prompt broker supplies ARE preparation only in a disposable profile; it
has no production Host-owner binding, durable permit journal, all-producer
migration, or loaded-graph qualification. Until those dependencies and full
conformance pass, D0b stays open and full Web
control must be described as unsupported.

## Source selectors

- [P2c alternate-ingress audit](evidence/P2C-DSH-ALTERNATE-INGRESS-AUDIT-2026-10-04.md)
  and [D0b timing probe](evidence/D0B-DSH-AGENT-SEND-SEAM-PROBE-2026-10-04.md).
- Pinned `@deepseek-ai/dsh-agent-loop/lib/index.js`: `ReactLoopAgent.send`,
  `ReactLoopInbox.splice`, `AgentLoop.setupAndPublish`; pinned
  `@deepseek-ai/dsh-agent/lib/index.js`: `AgentRegistry.setFactory` and
  `announce`; both are nested under the adapter's `node_modules/@deepseek-ai/dsh/node_modules`.
- Pinned `@deepseek-ai/dsh-base/cordis.patch.yml`,
  `@deepseek-ai/dsh-web-app/cordis.patch.yml`, and
  `@deepseek-ai/dsh-agent-presets/lib/index.js` (`resolvedRoots`, `mount`).
- Upstream [AgentLoop reference](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/agent-loop/README.md),
  [Agent lifecycle](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/agent-lifecycle.md),
  and [pre-inbox hook request](https://github.com/deepseek-ai/deepseek-harness/discussions/5488).

## Open Questions

- When should the private pinned patch be replaced by a maintainer-supported
  versioned final-insertion API, and who maintains rebases meanwhile?
- Which Host-origin messages need a new ARE decision versus a permit derived
  from an already admitted parent turn?
- What is the exact profile/runtime enforcement mechanism for arbitrary
  same-process plugins that can write the Session log directly?
