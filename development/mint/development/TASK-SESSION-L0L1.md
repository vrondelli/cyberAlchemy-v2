---
node_type: task-session-record
is_session: true
status: candidate
boundary: INTERNAL — Mint is intended-not-shipped; this records a bounded build of L0+L1 templates
created: 2026-06-29
authored_by: task-session
capability: task-session
work_pack: cyberAlchemy-v2/development/mint/WORK-PACK.md
swus_done: [SWU-1, SWU-2]
swus_out_of_scope: [SWU-3, SWU-4]
mvp_boundary: private-only (owner decision 2026-06-29)
note: Paths repo-root-relative from domainspec-core/.
---

# Mint — TASK-SESSION RECORD (L0 + L1 templates)

Bounded execution of **SWU-1 (L0 compose contract)** + **SWU-2 (the emit-template set,
L1)**. SWU-3 (emit-logic) and SWU-4/L2 (signed decision-gate, BLOCKED on the attestation/
signer capability) are out of scope. claim ≤ proof: these are **emit-templates**, not a
shipped Mint — running them on a domain is the downstream emit step (SWU-3), not done here.

## SWUs done

### SWU-1 — L0 compose contract (DONE)
Wrote `templates/L0-compose-contract.md`: the exact two-phase call to `domainspec-new-repo`
(`--source <fw> --attach submodule --mode plan` → then `--mode apply`), what it produces
(the partition tree + clone-safe attach, with **empty** authority slots — the spine is L1's),
the clone-safe inheritance (the scaffolder's Step-7 canon-resolves verify is L0's acceptance
gate), gate inheritance (`apply` crosses the scaffolder's own master gate; Mint adds no
second L0 gate), and the hard boundary: **Mint does NOT edit `domainspec-new-repo`** — it
composes it as a black box.

### SWU-2 — emit-template set (DONE) — 6 domain-parameterized skeletons
Reverse-engineered from the external resonantos sibling
(`/home/vrondelli/projects/resonantos-economy-research/`):

| Template (in `templates/`) | Reverse-engineered from | Leak-strip applied |
|---|---|---|
| `authority-model.md` | `authority/AUTHORITY-MODEL.md` | replaced the "Method authority" kind (owner-route re-skin of cav2 `Constitution`) with **domain-originated kind placeholders** (lexical AND owner-route new); method authority localized to the domain's own constitution at emit-time |
| `source-spine.md` | `authority/source-spine.md` | cav2 row confined to **citation/provenance only**; its Blocked-use column explicitly forbids cav2 on ANY resolution path |
| `promotion-policy.md` | `authority/promotion-policy.md` | every gate resolves to the domain's OWN `authority/`; a promotion-block forbids resolving across a framework edge |
| `constitution.md` | `authority/constitutions/RESEARCH-CREDIBILITY-CONSTITUTION.md` | the localized home of method authority; preserves the anti-laundering rule ("transfers no framework authority") as a positive Obs-B control |
| `definitions.md` | `definitions/DEFINITIONS.md` | three-voice card format; explicit note that an Evidence cav2 citation is provenance, not a resolution path |
| `crosswalk.md` | `RELATED-FRAMEWORK-CROSSWALK.md` | cav2 appears as ONE crosswalked precedent with a borrow-carefully verdict — citation with a verdict, never authority |

Each carries a Mint-emit-template header (`node_type: template`, `boundary: INTERNAL —
intended-not-shipped`), records its `source_artifact` + `emits_to` target + the `leak_strip`
it applies, and inherits the meta-machinery (table FORMATs, source-movement, non-collapse
rule structure, promotion-ladder, gate vocabulary, claim≤proof) while localizing object
content via `<DOMAIN>`-style placeholders.

## Files touched (all new)
- `cyberAlchemy-v2/development/mint/templates/L0-compose-contract.md` (SWU-1)
- `cyberAlchemy-v2/development/mint/templates/authority-model.md` (SWU-2)
- `cyberAlchemy-v2/development/mint/templates/source-spine.md` (SWU-2)
- `cyberAlchemy-v2/development/mint/templates/promotion-policy.md` (SWU-2)
- `cyberAlchemy-v2/development/mint/templates/constitution.md` (SWU-2)
- `cyberAlchemy-v2/development/mint/templates/definitions.md` (SWU-2)
- `cyberAlchemy-v2/development/mint/templates/crosswalk.md` (SWU-2)
- `cyberAlchemy-v2/development/mint/development/TASK-SESSION-L0L1.md` (this record)

## Validation (template self-check — the runtime-evidence shape)
Self-check run over `templates/` against the criterion's Obs-B / Obs-A sub-rules:

- **Obs-B-clean (no runtime governance leak — the precedent's exact failure stripped):**
  - **Zero "cav2 as method authority"** — `grep -niE "as (an? )?(external )?method authority"`
    → no match in any template. The precedent's `2026-06-26` mint-act output named exactly
    "CAV2 as external method authority for source posture and promotion discipline"; the
    templates emit the **localized** state from the start.
  - **Zero cav2 on a resolution path** — the only line mentioning cav2 + a decision is the
    `source-spine.md` **Blocked-use** clause, which *forbids* it ("placing it on ANY
    resolution path ... resolve to *this repo's own* `authority/`, never to cav2"). Every
    cav2/CyberAlchemy mention (38 total) sits in a precedent / citation / provenance /
    forbid frame. Method/promotion/admission/source-posture/non-collapse decisions resolve
    to the minted repo's own `authority/`.
  - **Net:** a repo emitted from these templates is Obs-B-clean **at its mint-act output
    state** — it does NOT require the precedent's separate `2026-06-29` localization fix to
    become autonomous. The fix is baked into emit.
- **Obs-A-ready (autonomous localization — lexical-AND-owner-route-new):**
  - `authority-model.md` carries ≥2 **domain-originated authority KIND** placeholders, each
    flagged "a genuinely new owner route, NOT `constitution-governance` re-skinned" — closing
    the F3(c)/F4 owner-route-re-skin hole that the precedent's "Method authority" row fell into.
  - `promotion-policy.md`, `constitution.md`, `crosswalk.md`, `definitions.md` each carry a
    domain-originated rule / gate / concept / term placeholder.
  - The D49 owner-gate is noted on every domain-originated placeholder: **Mint proposes; the
    domain owner ratifies** (SPEC §Boundaries) — not a unilateral cav2 D49 change.
- **Header check:** all 7 files carry `intended-not-shipped`.

> Caveat (claim ≤ proof): this validates the **templates** are leak-stripped and Obs-A-ready
> *by construction* — it is NOT a run of the frozen criterion. SURVIVED/FALSIFIED are rendered
> only by the downstream run that mints actual repos (criterion §4). What is proven here: the
> emit-templates cannot reproduce the precedent's leak, because the leak phrasing is absent
> and the localized posture is baked into the skeleton.

## Remaining blockers
- **SWU-3 — emit-logic (L1, not built here).** The step that runs these templates on a
  domain via authority-triage (review-mode) to emit a concrete spine. Owner: sigil-development
  → task-session. The golden fixture is resonantos (reproduce its spine shape from the
  templates). Acceptance: emitted authority-model parses; every proposed kind carries a
  default-deny row.
- **SWU-4 / L2 — BLOCKED on the attestation/signer capability.** The signed
  `authority/decisions/<date>-mint.md` + owner-ratify gate needs a capability that models a
  signer/ratifier identity; `decision-gate` resolves+persists a decision but models no signer
  (review C7 / EXECUTION-PACK §owner-gate). Owner: sigil-development design.
- **`BLK-CAV2-PUBLIC-PRIVATE-001`** — a public-attached mint stays blocked until the
  public/private boundary is resolved. MVP is **private-only** (owner decision 2026-06-29),
  so this MVP routes despite the blocker; it gates any public mint. Owner: decision-gate.
- **Generalization** — templates are reverse-engineered from **one** domain (resonantos).
  No claim of general coverage; the criterion's N=3 (research/product/process) run would test
  that. A target with no derivable kind-set hits the `blocked-default-deny` branch
  (EXECUTION-PACK §Failure mode).

## lifecycle_owner_next_step
**sigil-development** — design SWU-3 emit-logic (run the 6 templates on the resonantos golden
fixture via authority-triage review-mode; reproduce its spine shape with the leak stripped at
emit) **and** the SWU-4 signer/ratifier capability that unblocks L2. The templates + L0
contract are the input surface; no further template work is needed before SWU-3.
