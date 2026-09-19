# SWU-VIS-001 — normalization and authority contract

Owner: Invoke / implementation-layering

## Outcome

Freeze the smallest coherent read-model contract before implementation.

## Inputs

Planning context, implementation layering, manifest metadata/schema, and the FPR Craft
context/gaps/artifacts.

## Write surface

`PLANNING-CONTEXT.md`, `IMPLEMENTATION-LAYERING.md`, `WORK-PACK.md`, `DISPATCH.json`,
and shared work-pack files only.

## Completion checks

- Dispatch validates.
- Authority and failure behavior are explicit.
- Five SWUs recompose without overlap.
- No production node or parent Craft state is mutated.

## Handoff

Produce `runs/SWU-VIS-001/RESULT.md` for SWU-VIS-002.
