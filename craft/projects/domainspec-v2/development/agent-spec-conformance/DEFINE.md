---
node_type: define
is_session: false
status: candidate
created: 2026-07-06
authored_by: invoke (mode: define)
target_artifact: a general agent⊨spec conformance verifier — the runtime ACTION↔spec plane (Layer 3), distinct from code↔spec binding and spec-content
scope: projects/domainspec-v2 (a general runtime-conformance core + per-domain plug-ins + witness specimens)
owner_route: validation-governance (the verifier) + cav2 definitions/claim-governance (the claim discipline) + lean-engineer (the formal invariant realization)
source_contracts:
  - .arcanum/inventory/entries/three-layer-agent-conformance-verifier-decision.md (the session decision + three-layer model)
  - projects/domainspec-v2/development/code-tag-conformance/DESIGN.md (sibling plane: code↔spec binding, L1)
  - projects/domainspec-v2/development/meta-type-formalization/DEFINE.md (its non-goal "building the runtime/agent layer" = THIS scope)
  - domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean (the formal invariant specimen)
  - .arcanum/inventory/queries/2026-07-06-ai-assurance-certification-vocabulary-research/findings.md (Forbidden/Future-Only claim boundary)
governing_decision: DEC-DSV2-SPEC-HOMING (consume root authority; contract-as-schema; one gate). cav2 governs claim≤proof.
promotion_boundary: PUBLIC = the conformance interface + criteria (the funnel). PRIVATE moat = the general core / agent⊨spec check + engine. The "general / moat" label is NOT claimable until the distant/generality witness (robot, witness #3 — see AV-D4). Intended-not-shipped.
---

# Define — Agent⊨Spec Conformance Verifier (the runtime action plane)

## Intent

Build the **general agent⊨spec conformance verifier** — a reusable core that, given a **spec** and an
**agent action**, deterministically returns **`conform | not-conform + counter-witness`** plus a
**safe-fallback**, with thin **per-domain plug-ins** feeding it domain specs. This is the **Layer-3 runtime
plane** of the three-layer model: it checks whether an agent's *action* conformed to spec, not whether a
produced artifact is well-formed.

This is the "Option 2" of the 2026-07-06 session: not a one-off checker, but a domain-agnostic core with the
domain isolated to a plug-in. Option 2 **subsumes** a one-off's deliverable (it produces the first witness
for free), so "do both" = build the general core.

## The gap (why this is not redundant with the existing conformance work)

domainspec-v2 already builds two conformance planes; this is a **third, distinct** one:

| Plane | Validates | Layer | Status |
| --- | --- | --- | --- |
| `code-tag-conformance` | CODE ↔ spec *binding* (`@biz`/`@sys` anchors) | L1 structural | in progress |
| meta-type / content validator | SPEC *content* well-formedness | L1 structural | in progress |
| **agent⊨spec (this)** | **agent ACTION ↔ spec at runtime** | **L3 action** | new |

`meta-type-formalization` names its non-goal precisely: *"Building the runtime/agent layer (this is spec-time
content validation)."* This package is that deferred layer. **Not a merge** — same two-plane discipline as
code-tag-conformance: we share root authority + the schema/one-gate pattern (**build-from-owned**), we do not
collapse into the L1 validators.

## The falsifiable claim (pre-registered — freeze before build)

> A **single general core** accepts *(spec, agent action)* and deterministically returns
> `conform | not-conform + counter-witness` + a safe-fallback, with the **domain isolated to a plug-in**.

**SURVIVED-mechanism** (witness #1) iff: (a) the core runs on the **dosage-permission** spec via a plug-in;
(b) a **positive** fixture (a conformant action) returns `conform`; (c) a **negative** fixture (a violating
action) returns `not-conform` with a discriminating **counter-witness**; (d) a non-certifiable input triggers
the **safe-fallback** (block/escalate), not a silent pass; (e) an **automated test** asserts this over
fixtures.

**SURVIVED-general** (*the moat claim* — gated on the **distant/generality witness**, robot force-limit) iff: a
spec that breaks dosage's *memoryless point-decision* shape — continuous quantities + temporal trajectory +
real-time fallback — plugs into the **same core unchanged** and passes (a)–(e). Only then is "general verifier /
moat" claimable. **Same-kind witnesses do not discharge it:** dosage + data-access are both memoryless permission
point-decisions, so passing both proves breadth-across-permissions, not generality (asserting the moat there is
the B1 trap).

**FALSIFIED-general** if the distant witness requires editing the core — then it is a one-off wearing a general
costume, recorded as such (the B1 failure one level up: a component mislabeled as the moat). A discovered
edit-need is an honest scope finding, not a silent pass.

Passing witness #1 = **the mechanism works**, NOT that the verifier is general and NOT any runtime-conformance
guarantee for a real deployment.

## Scope & sequence — the three-witness ramp (AV-D1 resolved 2026-07-06)

1. **Witness #1 — dosage-permission (mechanism; bounded, internal).** A formal dose-permission spec + a Lean
   invariant (build-from-owned on `AgentPermissionKernel`) + the core + plug-in + a "what this does not prove"
   page. **Not a deployed medical device** — proof-of-mechanism only.
2. **Witness #2 — data-access permission (plumbing + reusable component; does NOT earn generality).** Cheap and
   build-from-owned (the permission kernel); shakes out the harness on a second domain and builds the discrete
   permission-gate that a robot spec reuses. Structurally *close* to dosage (both memoryless permission
   point-decisions), so it proves breadth, not generality.
3. **Witness #3 — robot force-limit (the generality witness; the moat claim gates here).** Breaks dosage's
   memoryless point-decision shape (continuous + temporal + real-time fallback) — the axis where the core's
   generality is actually tested. Only the plumbing + permission-gate sub-component transfers from #2; the
   continuous-temporal envelope (the hard, generality-proving part) is new and inherits **no** de-risking from
   #1/#2.

- **Build-from-owned:** consume root authority; express the spec/action/verdict contracts as machine schemas;
  one validation gate — same v2 pattern as code-tag-conformance and the meta-type validator.

## Glossary

- **agent⊨spec** — the relation "this agent action satisfies this spec"; the L3 conformance question.
- **general core** — the domain-agnostic verifier: `(spec, action) → verdict + fallback`; the moat candidate.
- **plug-in** — the thin per-domain adapter that supplies a domain spec + action encoding to the core.
- **counter-witness** — the concrete evidence of non-conformance (the failing input), returned on `not-conform`.
- **safe-fallback** — the block/escalate behavior when the core cannot certify conform (fail-closed).
- **witness #1 / #2** — the two structurally-different specimens; #1 proves the mechanism, #2 earns "general".
- **two-witness gate** — the pre-registered rule that "general/moat" is claimable only after witness #2.

## Non-goals

- A deployed/clinical dosage product (dosage is a bounded specimen; deployment triggers real
  high-risk/conformity obligations — out of scope).
- Any **runtime-conformance-guaranteed**, **provably-correct-agent**, certification, or external-conformity
  claim (Forbidden list, ai-assurance findings §2/§8).
- Exposing or re-deriving the engine / general-core algorithm (the private moat).
- The external **conformity assessment** rung (a regulatory/process deliverable, not this verifier).

## Open decisions (surfaced — owner to confirm; not settled here)

- **AV-D1 — witness sequence: RESOLVED 2026-07-06 → three-witness ramp** dosage → data-access → robot.
  Data-access is a cheap, build-from-owned *plumbing/breadth* step (and a reusable permission-gate component of
  the robot spec); robot force-limit is the *generality* witness. Rationale: cheap de-risk of the harness first,
  but the generality proof deliberately waits for the distant (continuous-temporal) witness. Caveat recorded:
  data-access de-risks robot's *plumbing*, not its hard continuous-temporal axis. See AV-D4.
- **AV-D2 — core/plug-in boundary:** what lives in the general core vs the domain plug-in. Drawing this from a
  single witness risks baking dosage in; treat the #1 boundary as provisional, re-cut at #2. Design decision.
- **AV-D3 — Lean realization:** whether/how the per-spec invariant lives in `lean-engineer` and how the
  runtime monitor consumes it (invariant proof feeds the core's certify step).
- **AV-D4 — claim gate (pinned to the distant witness):** "general/moat" requires a `decision-gate` after
  **witness #3 (robot)** — the distant, generality-proving witness — before any such claim leaves this package.
  **Two same-kind witnesses do not discharge it:** dosage + data-access both passing promotes only "mechanism +
  breadth-across-permissions," never "general." Witness #1 alone promotes only "mechanism works, bounded." This
  is the load-bearing anti-B1 guard.

## Define → design handoff

AV-D1 resolved (three-witness ramp). Next: `invoke design` for the core/plug-in architecture (AV-D2), then a
work-pack over witness #1 (dosage) → witness #2 (data-access) → witness #3 (robot). Every step's acceptance is
fixture-discriminating + automated, matching the v2 gate pattern; the "general/moat" claim gates at witness #3
(AV-D4).
