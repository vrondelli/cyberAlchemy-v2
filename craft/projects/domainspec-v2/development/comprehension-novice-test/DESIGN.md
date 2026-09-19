---
node_type: design
is_session: false
status: candidate
created: 2026-07-02
authored_by: "invoke (mode: design)"
define: ./DEFINE.md
work_pack: ./WORK-PACK.md
target_artifact: the novice-witness instrument (task + blind novice prompt + stall schema + scoring)
promotion_boundary: local development; agent-arm caveat carried in every report header.
---

# Design — Comprehension Novice-Witness Test

> **Historical baseline notice (2026-07-11):** Saga-specific discriminations
> below belong to the frozen baseline design. They are not current authority or
> an executable hardening route.

## 1. The instrument (four parts)
1. **The fixed task** (`task.md`) — a plain-business-language feature brief (no DomainSpec vocabulary in
   it) the novice must turn into a DomainSpec aspect file. Chosen to force: ≥3 core types, an Entity/VO
   call, a Rule (not a Policy), a Workflow (not a Saga), ≥2 typed edges, and a target-state. Candidate
   domain: **library book lending** (patrons, copies, a "can-borrow" rule, a return workflow, a
   "loan settled" target-state) — ordinary, but its *typing* is non-obvious.
2. **The novice prompt** (`novice-agent.md`) — given **only** the spec-surface files (DEF-A1 scope),
   **blind** to research/findings. Instruction: author the spec AND log a stall every time you (a) can't
   decide which of the 25 types a concept is, (b) can't tell two candidate types apart, (c) can't pick
   an edge verb, (d) don't know what the target-state should assert, (e) hit an undefined term.
3. **The stall schema** — `{id, location (file / type / edge), class ∈ {selection, discrimination, edge,
   target-state, vocabulary}, what_was_missing, guardrail_used (what it fell back on — a guess, a fixture,
   a confusion table)}`.
4. **Scoring** (`stall-dataset.md`) — count, classify, rank by `frequency × severity`, and attach each
   stall to the move that would fix it (§3).

## 2. The two arms
- **BASELINE** — current surface → the first `stall-dataset.md` (produced now).
- **TREATMENT** — after each Package-B move lands, re-run the **identical task + novice prompt** on the
  updated surface; the stall-delta is attributable to the surface change (DES-A2). Treatment runs are
  Package B's promotion evidence, not part of this package's L0.

## 3. Stall → move map (the coupling to Package B)
| Stall class | Fixed by | Package-B move |
| --- | --- | --- |
| `selection` (which of 25?) | tiered learning order + distilled vocabulary | **M1** |
| `discrimination` (Entity vs VO; Rule vs Policy; the 5 weak) | surface the crossed pair / upgrade weak pairs | **M2**, **M3** |
| `edge` (which verb?) | distilled edge view (+ R3 edge signatures, cross-ref) | **M1** (+ R3) |
| `target-state` (what is "done"?) | target-state doc + oracle-by-example | **M4** |
| `vocabulary` (undefined term) | distilled sharp vocabulary | **M1** |

## 4. Design decisions
- **DES-A1 — blindness is a validity gate.** The novice agent must not read `research/` or `findings.md`;
  contamination ⇒ INVALID (DEFINE). Enforced by file-scope + an explicit prompt clause + a post-run
  attestation line in the dataset.
- **DES-A2 — identical task across arms.** Baseline and every treatment run use the byte-identical
  `task.md` and `novice-agent.md`; only the spec surface differs — so a stall-delta is caused by the
  move, not task variance.
- **DES-A3 — agent ≠ human.** `stall-dataset.md` opens with the caveat header; the human arm is a named
  deferred slice (layering L2), never silently merged into the agent numbers.
- **DES-A4 — severity rubric.** `blocker` (novice cannot proceed / guesses and is wrong) >
  `friction` (proceeds but hesitates / uses a guardrail) > `cosmetic` (notes ambiguity, unblocked).

## 5. Views coverage
Context (§1 the task) · Structure (§1 instrument parts) · Data (§1.3 stall schema, §1.4 dataset) ·
Behavior (§2 arms, §3 map) · Alternatives (DEF-A1 human-only) · Boundary (DES-A1 blindness, agent≠human).
