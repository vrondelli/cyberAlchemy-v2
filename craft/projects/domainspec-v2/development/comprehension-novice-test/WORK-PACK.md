---
node_type: work-pack
is_session: false
status: candidate
created: 2026-07-02
authored_by: "invoke (mode: plan)"
define: ./DEFINE.md
design: ./DESIGN.md
implementation_layering: ./implementation-layering.md
output_mode: single-file
complexity: low
---

# Work-Pack — Comprehension Novice-Witness Test

> **Historical baseline notice (2026-07-11):** The Saga-specific coverage
> contract below is superseded and must not be rerun as written. A new run must
> version its task around scoped Workflow.

**SWU manifest (L0 = the runnable baseline that feeds Package B):**

| SWU | Parent task | Write scope | Acceptance evidence | Verification |
| --- | --- | --- | --- | --- |
| **SWU-A1** | Author `task.md` — the fixed feature brief | `development/comprehension-novice-test/task.md` | Brief is plain business language (no DomainSpec terms); a reviewer confirms it forces ≥3 core types + Entity/VO + Rule(≠Policy) + Workflow(≠Saga) + ≥2 edges + a target-state | Checklist in the file's footer, each box ticked with the concept it forces |
| **SWU-A2** | Author `novice-agent.md` — the blind prompt + stall schema | `development/comprehension-novice-test/novice-agent.md` | Prompt scopes file access to `{TAXONOMY, RELATIONSHIPS, meta-types/**, __fixtures__/mt/**}` ONLY; forbids `research/`+`findings.md`; stall schema carries all 5 classes + severity rubric | Prompt lists the exact allow/deny file globs; schema block present |
| **SWU-A3** | Run baseline; capture `stall-dataset.md` | `development/comprehension-novice-test/stall-dataset.md` | ≥5 stalls, each `{location, class, what_was_missing, guardrail}`; ranked by freq×severity; stall→move column filled; **blindness attested** + **agent≠human caveat header** | Dataset opens with the caveat + attestation lines; every row mapped to M1–M4 |
| **SWU-A4** *(L1)* | Author the treatment re-run recipe | `development/comprehension-novice-test/RERUN.md` | Recipe reproduces SWU-A3 byte-identically except the surface; defines the stall-delta computation | Recipe names the identical task+prompt and the delta metric |

**Distill validation (plan gate):** **PASS.** Units are minimal (author-one-file / run-once), recompose
into "a dataset that prioritizes + validates the model", and expose the cross-package coupling (A3 →
Package B L0). No overbuild: no scoring tool is built until a second run needs it (A3 scores by hand).

**Execution note:** SWU-A3 is a governed subagent dispatch (a blind novice agent) — recommend routing it
through `domainspec-subagents-strategy` as a single-agent `experiment`-flavored run, since it produces a
falsifiable dataset. The parent must **verify the agent's stall-log against the actual spec files (P8)**
before accepting a stall as real (a stall the surface actually answers = a novice error, not a surface gap).

**Next route:** `task-session` for SWU-A1/A2 (authoring), then a strategy dispatch for SWU-A3 (the run).
