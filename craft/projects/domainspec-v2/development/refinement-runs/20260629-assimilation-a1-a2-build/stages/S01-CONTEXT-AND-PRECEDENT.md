# S01 — Context + precedent baseline

**Stage:** context-builder · **status:** pass

## Targets (from the assimilation table, ASSIMILATE-NOW rows)

- **A1** — harness-enforced post-write **spec-semantic validator hook**.
- **A2** — terse single-file **concrete syntax** that desugars into `TAXONOMY.md`.

## Owned components located (verified inline, concrete paths)

| Need | Owned component | Path | Invocation |
|---|---|---|---|
| A1 doc-semantic check | engine `lint` command | `implementation/domainspec/tools/test-derivation-engine/src/cli.ts` | `tsx src/cli.ts lint` (npm `lint:docs`) |
| A1 relationship check | validator | `implementation/domainspec/tools/validate-relationships.ts` | `tsx tools/validate-relationships.ts` |
| A1 link check | validator | `implementation/domainspec/tools/validate-doc-links.ts` | `tsx tools/validate-doc-links.ts` |
| A1 hook host | settings | `implementation/domainspec/.claude/settings.json` | **no validation hook present today** → clean wiring |
| A2 grammar | grammar surface | `tools/test-derivation-engine/src/grammar/index.ts` | existing |
| A2 AST + eval | formal core | `tools/test-derivation-engine/src/formal/{ast,eval}.ts` | existing |

## Reading

- **A1 is a genuine gap and pure wiring:** the validators exist and run; nothing auto-runs them on spec-doc writes
  (no PostToolUse hook in the domainspec settings). Build = a fail-closed hook, not new validation logic. S cost.
- **A2 is more owned than the table assumed:** a grammar + formal AST + evaluator already exist. Build = a terse
  concrete-syntax front-end **over the existing AST**, not a new PEG. Cost downgraded S–M. Build-from-owned.

## Owner boundary

Read-only authority inputs: the validators, the grammar/AST. The build edits `implementation/domainspec/` and is a
Task Session next-route — NOT this refine run.
