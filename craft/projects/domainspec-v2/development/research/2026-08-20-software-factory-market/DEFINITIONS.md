# Governed Local Definition Cards

Status: `research-local-candidate-definitions`

Scope: explanation inside this tower only. Canonical vocabulary remains with its
existing owners.

## Software Factory (tower reading)

- Source kind: `operator-reading`.
- Compact form: `typed intent -> admitted work -> bounded execution -> evidence -> separate decisions`.
- Intuition: a factory is the whole accountable production path, not merely the
  model or agent that writes code.
- Anti-misuse: do not infer autonomy, correctness, acceptance, or production
  readiness from the name.
- Decision: useful local model; not promoted.

## Typed Factory Kernel

- Source kind: `local-current-state`.
- Compact form: `K = (typed graph, edge laws, validators, bounded realization,
  replay evidence)` at the exact local bindings in `findings.md`.
- Intuition: this is the semantic core v2 already has evidence for.
- Anti-misuse: `K` does not contain a scheduler, provider adapter, UI, receipt
  authority, or promotion authority.
- Decision: reuse through existing owners.

## Complete-Field-Preserving Runtime Adapter

- Source kind: `operator-reading` from provider precedent and Factory review R2.
- Compact form: for required envelope `E` and projection `P`, admission requires
  `P(E)` to represent every mandatory field without loss or substitution;
  otherwise the adapter rejects.
- Intuition: changing the engine must not change the meaning of the work order.
- Anti-misuse: a “best effort” mapping or silent default is not preservation.
- Decision: `GO-AS-FALSIFIABLE-EXPERIMENT`, not integration readiness.

## Lifecycle Evidence Mapping

- Source kind: `primary-source` plus `operator-reading`.
- Compact form: `provider event classes -> explicit candidate receipt fields`,
  with one witnessed mapping per required field.
- Intuition: events, analytics, audit logs, task states, and structured outputs
  can help, but they answer different questions.
- Anti-misuse: aggregate telemetry does not become per-work-pack evidence merely
  because both are JSON.
- Decision: defer until the positive and missing-field fixtures run.

## Recovery Equivalence

- Source kind: `operator-reading`.
- Compact form: two recovery paths are equivalent only if final bytes, lineage,
  authority state, and residue agree under a named checkpoint.
- Intuition: “resume worked” is weaker than “the governed run is the same.”
- Anti-misuse: checkpoint, retry, interrupt, archive, cancellation, takeover,
  and rollback remain provider-specific mechanics.
- Decision: future empirical experiment.

## Integrated Autonomous v2 Factory

- Source kind: `operator-reading` tested by the reviewers.
- Compact form: one new controller inside v2 owns typed intent, scheduling,
  runtime, evidence, continuation, acceptance, and promotion.
- Intuition: an attractive single-box diagram that erases the very ownership
  boundaries the system relies on.
- Anti-misuse: Factory/Devin precedent proves only that vendor-managed
  orchestration exists, not that this local architecture is sound.
- Decision: architecture `BLOCK`; `KILL-no-witness` and
  `KILL-collapses-split-owners`.
