# Small-sprite Robot World — Luna implementation plan

Status: planning candidate, 2026-09-06. No implementation or agent dispatch occurred while writing this package.

Build a separate, fixed-camera 2D comparison of Robot World using the supplied robot sprite reference. Show smaller robots in a larger colony composition, while preserving the exact recorded simulation.

Start with [LUNA-START.md](LUNA-START.md). It gives the coordinator prompt, task-selection rules and receipt format. Read [PLAN.md](PLAN.md) for the outcome, DAG and two work lanes. Then select one packet from [dag.json](dag.json); a Luna does not need the full conversation.

- [CONTRACTS.md](CONTRACTS.md): file layout, ownership, renderer API, timing and state rules.
- [ART-DIRECTION.md](ART-DIRECTION.md): camera, scale, frame preparation and colony composition.
- [VALIDATION.md](VALIDATION.md): concrete checks, commands and evidence requirements.
- [SOURCE-REGISTER.json](SOURCE-REGISTER.json): inspected inputs and hashes.
- [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md): assumptions, decisions and unresolved limits.
- [plan-checks.json](plan-checks.json): structural checks of this planning package only.

Two user checkpoints remain within B1: **G01 — sprite and scale**, then **G02 — complete 2D colony comparison**. They do not approve the original B2/B3 batches or live-agent/network work.

The implementation root is this directory's future `app/`. The existing Babylon application at `../app/`, its B1 v1 checkpoint, and its port 16340 are comparison inputs. Proposed Phaser preview: loopback port 16341, subject to a port check.

Default execution is one task at a time using Luna. Multiple Luna roles do not imply concurrent dispatch or multiple new user-owned tasks. Open questions: [register](OPEN-QUESTIONS.md).
