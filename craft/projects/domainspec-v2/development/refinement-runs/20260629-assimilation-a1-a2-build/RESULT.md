# Refine Result

- **Target:** the assimilation path (A1 spec-validator hook + A2 concrete-syntax seed) in `implementation/domainspec/`
- **Status:** pass · **Preset:** compact · **Research:** no-research
- **Run manifest:** [RUN-MANIFEST.md](RUN-MANIFEST.md) · **Evidence index:** [evidence-index.json](evidence-index.json)
- **Seed:** [REFINE-SEED-PROPOSAL.md](REFINE-SEED-PROPOSAL.md) · **Dispatch:** [REFINE-DISPATCH.json](REFINE-DISPATCH.json) (`VALIDATION=pass`) · **Subagents:** none
- **Stage evidence:** S01 pass · S02–S05 pass · S06 pass · S07 pass · S08 pass · S09 pass · S10 pass

## Final synthesis — build-ready, and the precedent sharpened both candidates

**A1 — spec-semantic validator hook (ship first, S cost).** The only conceded genuine gap, and it's pure *wiring*:
the validators already exist (`tools/validate-relationships.ts`, `tools/validate-doc-links.ts`, engine
`tsx src/cli.ts lint`) and `implementation/domainspec/.claude/settings.json` has **no validation hook today**. Build =
a fail-closed PostToolUse hook on `docs/features/**` writes, with allium's show-once UX. → **SWU-A1**.

**A2 — concrete-syntax seed (ship second, S–M cost).** More owned than the assimilation table assumed: a grammar +
formal AST + evaluator already exist (`tools/test-derivation-engine/src/grammar/`, `src/formal/{ast,eval}.ts`). Build =
a terse concrete-syntax **front-end over the existing AST**, desugaring into `TAXONOMY.md` concepts — not a new PEG, and
explicitly **not** glyph's grammar/generators (refused overshoot). → **SWU-A2**.

**Carried caveat:** A2's S–M cost assumes the existing `formal/` AST is an adequate desugaring target; the round-trip
test is what closes it.

## Recommended next routes

1. **Task Session — SWU-A1** (the validator hook). Smallest, highest-ROI, no engine change; edits the private
   `implementation/domainspec/` submodule (submodule-first commit discipline).
2. **Task Session — SWU-A2** (concrete-syntax seed) after A1.
