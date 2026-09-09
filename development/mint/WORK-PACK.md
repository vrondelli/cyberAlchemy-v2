---
node_type: work-pack
is_session: false
status: candidate
boundary: INTERNAL — intended-not-shipped; non-executed
created: 2026-06-29
authored_by: invoke (mode=plan)
output_mode: single-file
next_owner: sigil-development
note: Paths repo-root-relative from domainspec-core/. Execution belongs to sigil-development → task-session, not invoke.
---

# Mint — WORK PACK

The buildable-now slice (L0 + L1). L2+ are listed but gated (signer capability + public/private blocker).

## Shared SWU manifest
| SWU | layer | one parent task | write scope | acceptance evidence | verify |
|---|---|---|---|---|---|
| **SWU-1** compose-scaffold wrapper | L0 | wrap `domainspec-new-repo` as Mint stage 1 | the Mint skill's stage-1 step (no edits to `domainspec-new-repo`) | a minted tree is produced + Step-7 clone-safe verify passes | run on a throwaway target path; inspect tree |
| **SWU-2** emit-template set | L1 | reverse-engineer 6 templates from the external resonantos sibling | `cyberAlchemy-v2/development/mint/templates/` (new) | 6 parameterized skeletons (AUTHORITY-MODEL, source-spine, promotion-policy, constitution, DEFINITIONS, crosswalk), domain content stripped | diff each skeleton vs its resonantos source; no domain leakage |
| **SWU-3** authority-spine emit step | L1 | emit the domain spine via authority-triage (review-mode) | the Mint skill's stage-2 step | emitted authority-model parses; every proposed kind carries a default-deny row | run on the resonantos domain as golden fixture; reproduce its spine shape |
| **SWU-4** signed decision-gate step | L2 (gated) | emit signed `authority/decisions/<date>-mint.md` + owner ratify | the Mint skill's stage-3 step | a committed signed record names the ratified kinds | **BLOCKED on the signer-capability gap (review C7)** |
| **SWU-5** definitions-lifecycle equipment (#8) | L1 | emit `DEFINITIONS-INDEX` + `DEFINITION-DRIFT-AUDIT` (+ `SCHEMAS`) stubs | the Mint skill's stage-2 emit-set | the seeded load-bearing-term rule resolves against a real drift-audit target (closes the fires-into-void defect) | assert the emitted constitution rule's target file exists |
| **SWU-6** ratify-CLOSE step (#11) | L1/L2 | add a ratify-close artifact to the flow (propose→close) | the Mint skill's stage-3 step | minted kinds move `PROPOSED`→ratified; a committed ratify record exists | run on resonantos fixture; no kind left PROPOSED |
| **SWU-7** governance→methods catalogue (#13) | L1 | emit a governance-function→methods catalogue template | stage-2 emit-set + `templates/` | each proposed kind carries a methods stub | diff vs domainspec-v2's hand-authored methods catalogue |
| **SWU-8** seed-format batch (#3/#4/#5/#6/#7/#17) | L1 | emit posture-contract, non-collapse slot, closed-table declaration, boundary skeleton, import rung, constitution-import-pack | `templates/` (new) | each seeds the **empty contract/slot**, NOT cav2's rows | diff each vs cav2 source; assert zero cav2 rows copied |
| **SWU-9** meta-pattern batch (#1/#2/#9/#12) | L1 | emit narrowest-owner routing, invariant→axiom derivation, localization-route + reviews staging, stop/demotion rule | `templates/` (new) | each pattern parses and applies to the domain's own table | run on resonantos fixture |
| **SWU-10** cheap nav/schema (#10/#18) | L1 | emit `decisions/README` + D36 card schema, `authority/README` stub | stage-2 emit-set | both files present in the minted tree | inspect minted tree |

## Task-local notes
- **No edits to `domainspec-new-repo`** — Mint composes it (review C6: cav2 owns the orchestrator; the scaffolder stays unchanged).
- **authority-triage** consumed in review-mode (internal); do not block SWU-3 on its public promotion (review C5).
- **Templates are external-sourced** (review C4): SWU-2 reads `<repo-root>/../resonantos-economy-research/...`, writes only into the Mint package.
- **Template count grows (decision 2026-07-01):** SWU-2's 6 templates expand with SWU-5..10; the buildable-now slice now spans the 13 committed additions. The **one-vs-many task-session split is a deferred decision** (owner: task-session scoping). Seed-format SWUs (SWU-8) must copy the **empty contract, never cav2's rows** (circularity guardrail). See [SPEC §Committed additions](./SPEC.md).

## Build status (2026-07-01 — sigil-development --new)
- **SWU-2 + SWU-5..10 emit-logic BUILT** as templates + `EMIT-PROCEDURE.md` (Steps 1–12, self-checks
  1–9) at `templates/`. The sigil front-door is installed at `.claude/skills/mint/`.
- **Non-executed:** validated statically (self-checks) + on the worked example for the core; no live
  mint has run (SURVIVED/FALSIFIED render at the downstream N=3 run).
- **Still gated:** SWU-4 (L2 signing) on the attestation capability; public-attached mints on
  `BLK-CAV2-PUBLIC-PRIVATE-001`; generalization beyond resonantos (one-domain validation).
- **Next route:** `experiment-harness` (run the additions against the worked example / a fresh domain),
  then `sigil-development --observe` after the first real mints.

## Out of this work-pack (next routes)
- The **signer/ratifier capability** for SWU-4 (owner: sigil-development design).
- **`BLK-CAV2-PUBLIC-PRIVATE-001`** resolution before any public-attached mint (owner: decision-gate).
- L3 adopt-back (deferred).

## Runtime-first insertion (refresh 2026-08-07)

| SWU | layer | one parent task | exact write scope | acceptance evidence | verify |
|---|---|---|---|---|---|
| **SWU-MINT-RUNTIME-PLAN-01** deterministic no-write planner | P0 | convert one strict domain manifest into one canonical create-only effect plan with source-template digests | `cyberAlchemy-v2/development/mint/runtime/` and this SWU's Task Session evidence only | strict schemas + executable planner + deterministic/no-write/refusal tests | `python3 -m unittest discover -s cyberAlchemy-v2/development/mint/runtime/tests -v`; run the minimal fixture twice and compare stdout byte-for-byte; verify the declared target remains absent |

The admitted implementation inventory is limited to a standard-library Python entry point, manifest
and effect-plan schemas, a template/output catalog, fixtures, and tests under the private Mint runtime
directory. It may read Mint templates but must not edit them. It may not write a target, invoke
`domainspec-new-repo`, execute authority-triage, attach a framework, mint Zagr, or implement apply,
journaling, recovery, signing, promotion, or network behavior.

Machine-safe template rendering is a later, separately admitted runtime SWU. P0 must not treat the
current mixed prose/example template format as a deterministic target-byte language.

`SWU-MINT-RUNTIME-PLAN-01` precedes the historical SWU-1. Existing SWU build-status claims remain
unchanged and do not count as executable-runtime evidence.
