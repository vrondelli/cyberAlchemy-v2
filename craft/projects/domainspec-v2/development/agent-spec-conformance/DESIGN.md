---
node_type: design
is_session: false
status: candidate
created: 2026-07-06
authored_by: invoke (mode: design)
define: ./DEFINE.md
work_pack: ./WORK-PACK.md
layering: ./implementation-layering.md
target_artifact: the general agent⊨spec conformance core + plug-in contract (the L3 runtime plane)
source_of_intent: DEFINE.md (AV-D1 resolved → three-witness ramp dosage → data-access → robot)
parent: three-layer-agent-conformance-verifier-decision (inventory synthesis, 2026-07-06)
governing_decision: DEC-DSV2-SPEC-HOMING (consume root; contract-as-schema; one gate). cav2 governs claim≤proof.
boundary: INTERNAL — the general core / certify substrate is the private moat; the interface + criteria are the public funnel. Do NOT copy into public arcanum/.
---

# Agent⊨Spec Conformance — Design (the core/plug-in boundary)

## 0. What this is and why now

DEFINE fixed the intent (a general `(spec, action) → conform | not-conform + witness` core with the domain in a
plug-in) and the three-witness ramp. This design settles the one load-bearing decision — **AV-D2: where the
line between the reusable core and the domain plug-in sits** — and settles it *against all three witnesses*, so
the boundary is not silently over-fit to dosage.

**Not a merge** (same two-plane discipline as `code-tag-conformance`): this validates *agent actions at
runtime* against a spec; the code-tag and meta-type validators check *artifacts at spec-time*. Distinct plane,
shared root authority + schema/gate pattern.

## 1. The boundary (AV-D2 — recommended resolution)

> **The core knows the *shape* of conformance-checking; the plug-in knows the *domain*. Neither crosses.**

| Owned by the CORE (reusable — the moat candidate) | Owned by the PLUG-IN (per-domain) |
| --- | --- |
| the pipeline: `certify → verdict → fallback` | how to parse the domain **spec** (from root authority) |
| the **verdict** schema (`conform \| not-conform(counter-witness) \| indeterminate`) | how to encode a domain **action** |
| **fail-closed discipline**: `indeterminate → fallback`, never a silent pass | the `certify(spec, action) → verdict` **predicate** (domain semantics) |
| the **counter-witness** envelope (shape of "the failing evidence") | the domain **fallback** action (block/escalate/deny/rollback/safe-stop) |
| the **certification-backend interface** (see §2) + the fixture/test harness + the one gate + receipts | which **certification backend** the domain needs (declared, not hard-coded) |

## 2. The one thing that must not be baked in — a *plural* certify substrate

Naïvely, `certify` machinery goes in the core. But dosage and data-access are both **structural, decidable**
checks (SMT-ish over declared fields — Layer 1); a robot force-limit is **continuous + temporal** and may not be
SMT-decidable at all. If the core ships **one** certify backend (the SMT one that fits #1 and #2), it has baked
in the exact assumption witness #3 breaks — the over-fit the three-witness ramp exists to catch.

**So the core exposes certify as a pluggable *backend set*, and each plug-in declares which backend it needs:**

- `structural` — SMT/predicate over declared fields (dosage band-check, data-access policy). *Build for #1/#2.*
- `invariant-proof` — a machine-checked invariant (the Lean permission kernel; AV-D3). *Build-from-owned #1.*
- `runtime-monitor` — a temporal/continuous envelope check with a real-time safe-state (robot). *New at #3.*

This mirrors your `ARTIFACT-METADATA-CONSTITUTION` insight one plane up: a rule declares its `validation_mode`;
here a **plug-in declares its certification backend**, and the core routes to it. The backend set is **open by
construction** — even though #1/#2 only exercise `structural`(+`invariant-proof`), the interface anticipates
≥2 backends, so robot forces the *second real backend* rather than a core rewrite. **That forcing is the
generality proof** (AV-D4): if robot needs only a new *backend behind the existing interface* → SURVIVED-general;
if it needs the *interface/pipeline* changed → FALSIFIED-general (honest scope finding).

## 3. The boundary tested against all three witnesses (design-time falsification)

| | spec | action | backend | fallback | stresses |
| --- | --- | --- | --- | --- |
| **#1 dosage** | numeric permitted-band + patient context | scalar recommendation | `invariant-proof` / `structural` | block + escalate to clinician | memoryless numeric point-decision |
| **#2 data-access** | policy (subject×resource×action, roles, conditions) | request tuple | `structural` | deny | relational/combinatorial (still point-decision) |
| **#3 robot force-limit** | safety envelope over continuous state (+ time) | commanded trajectory/torque over t | `runtime-monitor` | real-time safe-stop | **continuous + temporal + real-time** |

Reading the table: #1 and #2 share `verdict/fallback/pipeline` and differ only in `spec/action/backend` — so
they exercise the plug-in seam cheaply but leave `runtime-monitor` unbuilt. #3 is the first row that needs a new
*backend* and a *temporal* action encoding; **the pipeline/verdict/fallback/counter-witness columns must stay
unchanged for the boundary to hold.** That invariance is exactly what witness #3 tests.

## 4. Build-from-owned + boundaries

- **Consume root authority:** domain specs reference root concepts (same `DEC-DSV2-SPEC-HOMING` pattern as
  code-tag/meta-type); no hand-authored spec projection.
- **Contract-as-schema:** the plug-in contract (`spec-source`, `action-encoding`, `backend`, `fallback`) is a
  machine `agent-conformance.plugin.schema.yml` (SCHEMA-CONSTITUTION format), not prose.
- **One gate:** conformance fixtures run under the v2 `validate` aggregate.
- **Moat boundary:** the `certify` backends + the general core are the **private moat**; the plug-in *interface*
  and the verdict/fallback *criteria* are the public funnel. The engine/backend algorithms are never described.

## 5. Design decisions surfaced (owner to confirm at execution)

- **DES-AV-1 — backend interface signature:** synchronous `certify(spec, action, ctx) → verdict` (fits #1/#2)
  vs a streaming/temporal `monitor(spec, action_stream) → verdict_stream` needed by #3. *Recommend* designing the
  interface as the **streaming form with the point-decision as its degenerate (single-step) case** — so #3 does
  not force a signature change. This is the highest-leverage anti-over-fit choice; confirm at build.
- **DES-AV-2 — counter-witness shape:** a single failing input (point) vs a failing *trace/time-slice*
  (temporal). Design the envelope to carry an optional trace so robot fits without reshaping it.
- **DES-AV-3 — Lean realization (AV-D3):** the `invariant-proof` backend consumes a compiled invariant from
  `lean-engineer` (build-from-owned on `AgentPermissionKernel`); the core does not embed Lean, it calls a
  backend. Confirm the compile/consume contract at build.
- **DES-AV-4 — data-access reuse into robot:** the #2 permission-gate plug-in should be authored as a
  *composable* sub-check so a robot spec can reuse it (permission gate + force envelope), per the DEFINE ramp.

## 6. Design → plan handoff

Next: `invoke plan` → a work-pack + implementation-layering over **L0** (core pipeline + verdict/fallback +
`structural` backend + dosage plug-in = witness #1), **L1** (data-access plug-in + harness/gate hardening =
witness #2), **L2** (`runtime-monitor` backend + robot plug-in = witness #3, the generality gate). Every SWU's
acceptance is a discriminating positive/negative fixture + automated test under `validate`; the "general/moat"
claim gates at L2 behind a `decision-gate` (AV-D4). Distill guard: DES-AV-1 (streaming interface) is the
ballooning risk — scope L0 to the degenerate single-step case, prove the interface *shape* only.
