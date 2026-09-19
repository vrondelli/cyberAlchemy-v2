---
module: language-type-enforcement-parser-experiment
feature_code: LTE
status: draft
updatedAt: 2026-07-17
docType: invoke-plan-transport
---

# Invoke Plan Transport: Language Type-Enforcement Parser Experiment

## Result

| Field | Value |
| --- | --- |
| Spell / mode | `invoke plan` |
| Complexity / output | medium / split |
| Active layer | L0 only |
| Global layering | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md), L0-L3 decisions complete |
| Work Pack | [WORK-PACK.md](WORK-PACK.md) |
| Execution Pack | [EXECUTION-PACK.md](EXECUTION-PACK.md), W0-W1 |
| Task detail | three algorithmic execution tasks + one closure-only task |
| SWU coverage | SWU-LTE-001 through 003 complete; SWU-LTE-001 selected |
| Plan Distill | Proposer + Balancer reconciliation `PASS`; zero acceptance-critical residuals |
| Phase status | flag; plan complete and SWU-LTE-001 ready, final L0 closure baseline red |
| Intended next route | one-SWU Task Session for SWU-LTE-001 after dirty-overlap preflight |

## Template Selection

- Standalone implementation-layering: mandatory for plan mode and selected.
- Standalone split Work Pack: selected because implementation exceeds the
  two-output-artifact low-complexity ceiling.
- DomainSpec execution pack: selected because medium complexity requires wave
  choreography.
- No competing template is equally eligible; UX, research, spell, and sigil
  lifecycle profiles do not match this implementation experiment.

## Implementation Detail Coverage

Each non-exempt task contract contains inputs, outputs, ordered algorithm/data
flow, edge cases, failure modes, write scope, done criteria, exact validation,
and a one-SWU handoff. The closure task has a justified SWU exemption and owns
no implementation repair.

## Decisions

1. Use medium/split planning despite only four tasks because parser, package,
   adapters, and tests exceed the artifact ceiling.
2. Keep two waves inside L0; do not manufacture L1-L3 work before evidence.
3. Select SWU-LTE-001 only for the next route.
4. Use stable code-bearing strings as the shared observable seam.
5. Treat any source-scope overlap discovered at execution as a blocker requiring
   refreshed context.

## Unresolved Gaps

No blocker prevents SWU-LTE-001. Profile admission, durable manifests, and
formal projection remain explicitly deferred. A post-Distill baseline run found
`tools:test` at 99/101 because four out-of-scope FPR backend-completeness files
are unclassified by the retired-orchestration guard. That gap belongs to the
FPR/guard owner and blocks final L0 closure while red; it does not authorize an
LTE worker to edit those files. The runtime dirty-overlap preflight remains the
other fail-closed execution precondition.
