# S10 — Final synthesis

**Stage:** refine-final · **status:** pass

## Gate sweep

- g01 strategy confirmation — operator confirmed "refine assimilation + build Lean". PASS.
- g02 dispatch validation — `REFINE-DISPATCH.json` `VALIDATION=pass`. PASS.
- g03 build-from-owned — A1 wires owned validators; A2 extends the owned grammar; no rebuild. PASS.
- g04 no-build-in-refine — non-executed plan; build is a Task Session next-route. PASS.

## Synthesis

The assimilation path is **build-ready**, and the precedent check tightened both candidates:
- **A1** is the only conceded genuine gap and pure wiring of three owned validators into a fail-closed PostToolUse
  hook — ship first (S cost).
- **A2** is more owned than the assimilation table assumed: an existing grammar + formal AST + evaluator means the
  concrete syntax is a *front-end skin* over the owned engine, not a new PEG — ship second (S–M).

## Recommended next route

Task Session on **SWU-A1** (the validator hook), then **SWU-A2** (the concrete-syntax seed). Both edit the private
`implementation/domainspec/` submodule → submodule-first commit discipline.
