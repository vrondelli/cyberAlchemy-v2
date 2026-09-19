# permguard in Arcanum — verified tool-governance for the foundry

> **Read first.** A design note inside the cyber-alchemy-lean-fusion project: how the
> verified-core reference monitor `permguard` (theorem repo `lean-formalization/`) could
> become the **runtime enforcement** behind Arcanum's tool-governance. It is the
> concrete, security-side instance of this project's thesis (`DESIGN.md`): Arcanum is the
> lifecycle machine; the verified core is the gate it lacks. Nothing is built; the honest
> scope (§4) is CERTIFIED decision-core, NOT "security". Sibling map of who-owns-what:
> `../../../domainspec-lean-formalization/research-security/permguard-product-feature-map/research/findings.md`.

## 1. The gap in Arcanum today

Arcanum has a tool-governance *vocabulary* but declaration and enforcement are disconnected:

- **Sigils declare `allowed-tools`** in `SKILL.md` frontmatter (e.g. experiment-harness:
  `allowed-tools: Read, Write, Glob, Grep, Bash`) — a **static declaration**.
- **dispatch-spec gates human permission before spawning** (Rule 22) + subagent-lifecycle
  closeout (Rules 23–25).
- **Verdict vocabulary is `pass | flag | block`** (`Arcanum/TO-VLAD/DISPATCH-COMPOSITION-MODEL.md` §6).

Missing: **nothing checks, at the moment a subagent actually calls a tool, that the call
is within policy.** `allowed-tools` is a label the runtime does not enforce; an agent that
declared only `Read` but calls `Bash rm -rf` / `WebFetch attacker.com` is ungated. The gate
is at *spawn time*, not at *each tool call*.

## 2. Where this sits in the fusion

This is the enforcement substrate for the gates `DESIGN.md §3` names. The fusion's four
moves (typed residue record, subset-rule gate, collapse-test+precedent, Brier forecast) are
*epistemic* gates on artifacts; **permguard is the operational gate on tool-calls** — the
same `pass|flag|block` discipline, but for "may this agent touch this file / run this
command / reach this host," decided by a machine-checked core instead of prose.

## 3. How permguard could be used

As the **PEP/PDP behind the dispatch** — turning static `allowed-tools` + dispatch scope
into an *enforced* per-tool-call decision via the proved `decidePolicy`
(`lean-formalization/PermGuard.lean`, `AgentPermissionKernel.lean`).

| Arcanum object | Compiles to | permguard mechanism |
|---|---|---|
| Sigil `allowed-tools` frontmatter | one policy tier | per-tool permit rule (`mkCanonRule`/`mkBashRule`) |
| Dispatch scope / lane | a second tier (org→project→user) | `decidePolicy` intersection — every tier must permit (`decidePolicy_append_allow`) |
| A subagent tool call (Read/Write/Bash/WebFetch) | a `request.json` | `decidePolicy` → allow/deny, fail-closed (`PermGuard.lean:main`) |
| `pass \| flag \| block` | the decision | `allow`=pass; `deny`=block; `flag` stays an Arcanum-side soft signal |
| The dispatch **session** (multi-step run) | a history of events | taint/egress trace monitor — secret read step 1 denies egress step 5 (`egressGuard`, rungs 5/9) |
| `.arcanum/observability/` ledger | the decision log | each allow/deny appended as evidence |
| experiment-harness | the validator | fixtures = policies+requests; expected = allow/deny |

The **session/stateful** row is what generic stateless engines (Cedar, OPA, the Permguard
product) do not do, and it maps cleanly because an Arcanum dispatch **is** a multi-step
session — the exact object the trace monitor was built for (the dispatch found this is the
one genuine here-not-there capability; see findings.md).

## 4. The honest scope — CERTIFIED vs ASSUMED (do not skip)

**The verified scope is the policy-decision CORE, not the security.** Carried from
`research-security/SECURITY-TOWER.md` and the permguard dispatch:

- **CERTIFIED (proved):** decision algebra (deny-precedence, intersection, no false allow),
  path normalization + `..`-defence, confinement, egress allowlist match.
- **ASSUMED (trusted, NOT proved — the border):** the JSON parser; `realpath`/symlink/TOCTOU;
  Unicode/NFC/case-fold; URL-parse fidelity (IDNA, `@`-authority, DNS-rebinding); and
  load-bearing — **the secret label is a path-prefix policy input, not a content classifier.**
- **A machine-checked NEGATIVE bounds it:** `curl` via `Bash` **provably evades** the
  egress/taint guard (`AgentPermissionKernelEgressBypass.lean`; `isEgress` covers only
  `WebFetch`). permguard-in-Arcanum does NOT stop a bash-routed exfil — disclose it, don't hide it.

So permguard makes Arcanum's `pass|flag|block` **real and fail-closed at the decision core**
and lets Arcanum ship a CERTIFIED-vs-ASSUMED border ledger as an *assurance artifact* — which
is honesty infrastructure, not a security guarantee. The real attack surface (parser, FS, URL,
bash) stays on the unverified border.

## 5. Owned, cited — no novelty

Verified per-request authz is **commodity**: Cedar is formally verified (Lean), shipped in AWS
Verified Permissions; the decision core is owned by Cedar/XACML/seL4. Session taint→egress is
owned as *research* by FIDES (arXiv:2505.23643) and CaMeL (arXiv:2503.18813) — not shipped
products. permguard = mechanization + a runnable binary + a named trust border, not new theory.
The dispatch's verdict: the only here-not-there capability is the stateful session taint→egress,
and it is vacuous against a sophisticated attacker until the content-classifier and
history-integrity move *inside* the verified core.

## 6. Scope / non-goals

- **Not built.** The `permguard` binary exists (sorry-free, 2026-06-13) but was never wired
  into an Arcanum dispatch.
- **Not a security claim.** See §4.
- **Venue:** this note lives in the fusion project (domainspec-core, private), so it anchors
  the theorem-repo Lean directly. The verified kernel is headed for its own public repo
  (`research-security/agentic-permission-kernel/new-repo-structure-plan.md`); a public
  Arcanum-facing version would be concept-level only.

## 7. Next route

Smallest honest first step: take **one** sigil's `allowed-tools` + one dispatch scope, compile
to a two-tier `policy.json`, run the existing `permguard` binary as a **dry-run gate** over a
recorded subagent tool-call trace, and report allow/deny against the declaration. If coherent,
layer the session taint monitor onto a multi-step dispatch. No live enforcement before the §4
border-hardening is owned.
