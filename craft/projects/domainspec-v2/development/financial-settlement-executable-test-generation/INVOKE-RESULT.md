# Invoke Result

## Template Selection

| Mode | Selected Template | Eligibility |
| --- | --- | --- |
| define | `domainspec-spec/SPEC.md` | Ordinary DomainSpec feature/capability with a bounded spec and glossary |
| design | `domainspec-spec/architecture-bundle.md` | Approved define output requiring all six architecture views |
| plan | standalone `implementation-layering.md` and `work-pack.md` | Required Invoke Plan companions; low complexity permits one work-pack file |

No eligible-template tie was found. Machine evidence is recorded in
[INVOKE-EVIDENCE.json](INVOKE-EVIDENCE.json).

## Define

- Mode: define
- Spell: invoke
- Phase status: pass
- Outputs: [SPEC.md](SPEC.md), [GLOSSARY.md](GLOSSARY.md)
- Template: DomainSpec specification baseline, adapted to a development feature
- Discovery: source-backed; no waiver required
- Dispatch techniques: sequence, concrete_path_evidence,
  owner_boundary_check
- Distill: pass; structural and behavioral testing claims were separated
- Decision: complete generation means exact structural membership, not universal
  behavioral oracle closure
- Next route: design

## Design

- Mode: design
- Spell: invoke
- Phase status: pass
- Outputs: [DESIGN.md](DESIGN.md),
  [GLOSSARY-CONSISTENCY.md](GLOSSARY-CONSISTENCY.md)
- Views: context, high-level structure, low-level components, workflow process,
  decision flow, dependency interface
- Glossary consistency: pass
- Distill: pass; declared-subset admission is separated from projection and
  emission
- Decision: collect per-instance failures so one invalid row does not erase test
  generation
- Next route: plan

## Plan

- Mode: plan
- Spell: invoke
- Phase status: pass
- Outputs: [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md),
  [PLAN.md](PLAN.md), [WORK-PACK.md](WORK-PACK.md),
  [DISPATCH-TRACE.md](DISPATCH-TRACE.md),
  [DISTILL-VALIDATION.md](DISTILL-VALIDATION.md)
- Complexity: low
- Output mode: single-file work-pack
- Per-layer planning: compact L0-L3
- Implementation detail: complete for all four execution tasks
- Smallest working units: complete; four execution SWUs plus VERIFY exemption
- SWU atomicity: pass
- First-unit narrowness: pass
- Distill: pass; recomposition proven, zero blocking gaps
- Capability ceiling: authored planning artifacts only; runtime/release status
  not evaluated
- Next route: task-session or direct local execution at `SWU-FSTG-001`
