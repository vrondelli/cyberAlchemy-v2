# RUN-MANIFEST — 20260629-assimilation-a1-a2-build

- **target:** assimilation A1/A2 build readiness in `implementation/domainspec/`
- **preset:** compact · **research:** no-research · **subagents:** none (precedent inline)
- **status:** pass · **dispatch:** `REFINE-DISPATCH.json` → `VALIDATION=pass`

## Verdict

| Candidate | Verdict | Owned components (build-from-owned) | Cost | Next |
|---|---|---|---|---|
| A1 spec-validator hook | ship first | validate-relationships.ts · validate-doc-links.ts · engine `cli.ts lint` · no hook yet | S | SWU-A1 |
| A2 concrete-syntax seed | ship second | `src/grammar/` + `src/formal/{ast,eval}.ts` (existing) | S–M | SWU-A2 |

## Stage ledger

| Stage | Artifact | Status |
|---|---|---|
| S01 context + precedent | [stages/S01-CONTEXT-AND-PRECEDENT.md](stages/S01-CONTEXT-AND-PRECEDENT.md) | pass |
| S02–S05, S07–S08 (compact) | [stages/STAGES-COMPACT.md](stages/STAGES-COMPACT.md) | pass |
| S06 design / build plan | [stages/S06-DESIGN-BUILD-PLAN.md](stages/S06-DESIGN-BUILD-PLAN.md) | pass |
| S09 plan (non-executed) | [stages/S09-INVOKE-PLAN.md](stages/S09-INVOKE-PLAN.md) | pass |
| S10 final synthesis | [stages/S10-FINAL.md](stages/S10-FINAL.md) · [RESULT.md](RESULT.md) | pass |

## Next route

Task Session — SWU-A1 (validator hook), then SWU-A2 (concrete-syntax seed). Private submodule → submodule-first commit.
