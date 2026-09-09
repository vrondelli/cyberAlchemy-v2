---
node_type: handoff
is_session: false
status: candidate
boundary: INTERNAL — invoke handoff (workflow-reflection) into the Mint development cycle
created: 2026-06-29
authored_by: invoke (mode: handoff)
handoff_type: workflow-reflection
observed_capability: invoke
target_artifact: Mint sigil (SKILL.md, templates/, EMIT-PROCEDURE.md, experiment-foundry-boundary/criterion.md)
target_owner: sigil-development
source_session: 2026-06-29 — first real mint (domainspec-v2 authority spine)
---

# Handoff — Learnings from the FIRST REAL Mint (domainspec-v2)

## Identity & source session

The first **real** application of the Mint capability (the prior `examples/release-approval` is a
hand-built golden fixture). This session cast the L1 authority spine for the **domainspec-v2** domain
into `projects/domainspec-v2/` (7 files), §7-clean. This packet reflects what that run taught about
the Mint sigil, for `sigil-development` to act on. It does **not** mutate Mint.

## New-session prompt

> Improve the Mint sigil from its first real run (domainspec-v2). Address the existing-target gap, the
> governance-as-kind framing win, the self-adjacent-domain guidance, and the moat-boundary slot — then
> decide what is a SKILL change, a template change, an EMIT-PROCEDURE change, or a criterion note.

## Handoff type & route rationale

`workflow-reflection` — these are felt gaps/wins discovered while *using* Mint on a real domain, not a
new lifecycle. Route: `workflow-reflect` (analyze the signals) → `sigil-development` (revise Mint).

## Context Builder selection summary

Selected only the obligation-linked learnings from the mint run; excluded the conversation's
import-triage detail and the kind-naming back-and-forth except where it produced a reusable lesson.

## Obligation coverage matrix

| # | Obligation (from the new prompt) | Coverage | Evidence |
| - | --- | --- | --- |
| O1 | What worked (positive controls to keep) | covered | §7 passed clean **by construction** (0 leak, 3 default-deny, 3 domain-originated, 4 domain rules) — the template leak-strip + EMIT-PROCEDURE §7 are effective. |
| O2 | SKILL/template gaps the run exposed | covered | L1–L4 below. |
| O3 | The mint output itself (provenance) | covered | `projects/domainspec-v2/authority/` (AUTHORITY-MODEL, source-spine, promotion-policy, constitutions/domainspec-v2-CONSTITUTION, decisions/2026-06-29-mint), `definitions/DEFINITIONS.md`, `RELATED-FRAMEWORK-CROSSWALK.md`. |
| O4 | Next route | covered | `sigil-development` (revise Mint) + the deferred N=3 `experiment` run. |

## Selected session context — the learnings

**L1 — Existing-target mints need their own L0 (the biggest gap).** Mint's L0 composes
`domainspec-new-repo` to scaffold a *fresh* repo. domainspec-v2 **already existed**, so L0 was N/A — we
went straight to L1 onto the existing tree. The SKILL/`L0-compose-contract.md` assume greenfield.
*Proposed fix:* add an **`--attach existing`/`mode: existing-target`** path where L0 = "verify the
target tree + empty authority slots" instead of scaffolding. (SKILL + L0-compose-contract change.)

**L2 — "Governance-as-kind, tools-as-methods" is the strong framing for Step 1 (a win to encode).**
The operator's reframe beat the first attempt: the domain-originated **kind = the governance function**
(drift / validation / layering governance), and each already-built capability is a **method** that
exercises it — not the mechanism-as-kind framing first tried. *Proposed fix:* EMIT-PROCEDURE Step 1
should prompt for the domain's **governance functions** as the kind candidates, and the authority-model
template should grow a **"Methods catalogue"** section (governance → instrument capabilities, cited to
provenance). (EMIT-PROCEDURE + authority-model template change.)

**L3 — Self-adjacent / methodological domains pass Obs-A by localizing the OBJECT-governance layer.**
domainspec-v2 is a *pillar cav2 governs* — high re-skin/circularity risk. It passed Obs-A because the
kinds were **object-level** governances (over specs) with **new owner routes**, while the meta layer
(definition/constitution/gate) was inherited. This **confirms** the foundry-content-autonomy finding
(methodological domains inherit-kinds + localize-content). *Proposed fix:* add a SKILL/criterion note
for self-adjacent domains, and a specific F3(c) check that **`validation`/`gate`-family kinds** must be
scoped to OBJECT validation (vs cav2's meta-validation/`gate`) or they re-skin. (SKILL + criterion note.)

**L4 — Domains with a moat need an open-core boundary rule slot.** domainspec-v2 carries a withheld
mechanism (the engine `src/rules`); the constitution gained `domainspec-v2-C8` (results free / algorithm
withheld). *Proposed fix:* the constitution template could offer an **optional open-core / moat-boundary
object-rule slot** for domains with a withheld mechanism. (constitution template change, optional.)

**Positive controls (keep):** the per-template `leak_strip`, the §7 self-checks, the L0-attributional
decision placeholder (L2 still blocked on attestation), the D49 owner-gate posture (propose, owner
ratifies). All worked as designed.

## Excluded context

The import-triage internals (`research/2026-06-29-v1-import-triage/`), the v1→v2 migration batches, and
the iterative kind-naming dialogue — except L2/L3 which distilled reusable lessons.

## Target lifecycle / project boundary

Owner = `sigil-development` (Mint sigil lifecycle). This packet is **proposal-only**; it mutates no
Mint surface. The domainspec-v2 spine it reflects on is owned by the domainspec-v2 authority owner
(separate). L2 attestation + the N=3 falsification run remain blocked/deferred per the SKILL.

## Gaps & blockers

- **No N=3 run yet** — this is N=1 (domainspec-v2), §7-clean by construction but SURVIVED/FALSIFIED is the separate downstream `experiment` run (criterion §4).
- **L2 signing blocked** (attestation capability) — the decision record is an L0-attributional placeholder.
- **domainspec-v2 owner-ratify pending** — the 3 proposed kinds await ratification.

## Next-session start prompt

> Open `sigil-development` on the Mint sigil. Apply the four learnings (L1 existing-target L0 path; L2
> governance-as-kind Step-1 prompt + Methods-catalogue template section; L3 self-adjacent F3(c)
> validation/gate scoping note; L4 optional moat-boundary constitution slot). Decide each as SKILL /
> template / EMIT-PROCEDURE / criterion change, then queue the N=3 `experiment` run.

## Next route

`workflow-reflect` → `sigil-development` (Mint revision) → deferred `experiment` (N=3 foundry-boundary run).

## Dispatch technique trace

`frame_handoff` (this packet) · `handle_handoff` (route to sigil-development) · `owner_boundary_check`
(invoke authors, sigil-development owns the Mint lifecycle; domainspec-v2 owner owns the spine) ·
`residue_ledger` (gaps/blockers above) · `concrete_path_evidence` (all learnings cite emitted paths).
No full dispatch JSON needed (single handoff packet, no fan-out).

## Provenance & output paths

- Observed capability: `invoke` · Mode: `handoff` · Type: `workflow-reflection`
- Output: `cyberAlchemy-v2/development/mint/development/handoffs/2026-06-29-first-real-mint-domainspec-v2.md`
- Source artifacts reflected on: `projects/domainspec-v2/authority/`, `…/definitions/DEFINITIONS.md`, `…/RELATED-FRAMEWORK-CROSSWALK.md`
