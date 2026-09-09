# ARE Reasoning State Lifecycle Coordinator

Status: implemented candidate
Authority effect: none

## Objective

Select and execute one explicit reasoning-state transition from verified state:

```text
current epoch + provenance + boundary risk + event budget
  -> reuse | branch | reduce | checkpoint | portable-export | block
  -> exact transition receipt
```

The real-reasoning improvement loop is the first consumer. It binds baseline,
benchmark profile, complete bounded source closure, candidate digest, measured
authority posture, comparison, counterevidence, branch receipt, and replay
fixture. A stability streak must name the same candidate digest twice.

## Boundaries

- Observation time is metadata outside semantic identity.
- The coordinator never generates summaries or chooses effects.
- Execution is explicit and append-only.
- A benchmark `KEEP` or `STABLE` grants no acceptance or implementation
  authority.
- Live holdout, publication, adoption, and deployment remain separate.
