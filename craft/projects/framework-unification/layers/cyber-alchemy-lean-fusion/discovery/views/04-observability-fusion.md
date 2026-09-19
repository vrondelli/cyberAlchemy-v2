# View 04 — Observability / logging fusion

> Parent: [`../MAP.md`](../MAP.md). Axis: making runs into queryable evidence across
> both repos. **Owned diagnosis + integration PLAN in `DISPATCH-COMPOSITION-MODEL.md`
> §7 and §12 — this is a pointer + honest "not built" mark.**

## EVIDENCE (owned, anchored — per DCM §7, §12, verified on-disk by that memo)

- **Complementary, non-overlapping halves** (DCM §7): Arcanum has the per-stage
  schema-validated receipt indexed by `dispatch_id` (operant via `tools/arcanum`),
  but its central ledger `signals/sigil-invocations.jsonl` holds **one bootstrap
  record, zero cross-run rows**. domainspec has a **populated** cross-run ledger
  (`subagents-dispatch.yaml`: dispatch row + close row per dispatch) but logs per
  dispatch, **not per stage**. Neither repo has both.
- **Three planes, not one** (DCM §12.2): authored dispatch-spec (intent — a hook
  *cannot* derive it, model-authored via `register-dispatch`); derived behavioral
  signals (auto, hook-first, `signal-observer`); per-stage receipts. Cross-referenced
  by `dispatch_id` / `run_id`.
- **The owner already exists** (DCM §12.1 correction): Arcanum's
  `framework/observability/scripts/observe-invocation.sh` already validates an
  envelope, dedupes, appends, maintains indexes, updates `reflection-state.json`.
  "Port the domainspec appender as the writer" is the **wrong move** — it would
  fight an existing owner.
- **The discipline worth porting** (DCM §12.4): domainspec's two-append pattern
  (spec at dispatch + close at termination), model-authored, append-only-enforced via
  PreToolUse hooks (reminder-nudge on `Agent`, deny on `Workflow`, append-only
  enforcer).

## INFERENCE / SEAM (plan, not built — DCM §12.5–12.6)

What is actually missing on the Arcanum side (the real seam):

1. **A `.claude/settings.json` hooks block** mirroring the three Codex events
   (`UserPromptSubmit` / `PostToolUse` / `Stop`) — under Claude Code nothing fires,
   so no envelope is produced. This is *the* concrete reason the ledger is empty.
2. **The scaffold run** — `observability-setup` was never run at root (`signals/`,
   `reflection-state.json` are `.gitkeep` placeholders).
3. **The envelope-producer Formula** carrying authored `goal`/`angle`/`anti_bias`.

- **Honest residue (DCM §12.6):** this is an integration *plan*, not built. The
  Arcanum scripts are baseline-ready but **never exercised**. The model-authored
  (domainspec) vs hook-first (Arcanum) philosophies are a real tension, resolved on
  paper "by plane" (existence vs meaning) but **not yet tested**.

## STATUS

**PLAN, NOT BUILT.** Design owned by DCM §7+§12; wiring is work not yet done.

## ROUTE

Follow DCM §12.5's four-step wiring. Authority: Arcanum owns the ledger contract +
writer; domainspec lands as an envelope producer (Authority-Bound Composition).
