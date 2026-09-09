# ARE Request Intent Runtime

This package compiles one request plus bounded reusable reasoning context into
an immutable Intent Contract. It distinguishes instructions about constructing
an artifact from content that should appear in the artifact, binds conversational
references, classifies corrections, materializes reflections, and projects the
same state at `quiet`, `explain`, `inspect`, or `control` depth.

The runtime owns interpretation records. It does not own routing, transport,
reasoning-state storage, benchmark promotion, or engine upgrades. Model-backed
interpretation is an optional provider behind the same verified record boundary;
the default fast path makes zero provider calls.

Public operations include:

- `compileRequestIntent`
- `materializeIntentContract` and `verifyIntentContract`
- `assessIntentRealization`
- `detectCorrection` and `materializeIntentReflection`
- `applyReflectionDisposition`
- `projectIntentInspection` and `applyIntentControl`
- `appendIntentLifecycleEvents`
- `toImprovementSignalCandidate`
- `materializeObjectiveState`, `verifyObjectiveState`, and `resolveObjectiveTransition`
- `materializeRequirementSnapshot`, `verifyRequirementSnapshot`, and `assessRequirementChange`

The opt-in [requirement-change contract](REQUIREMENT-CHANGE.md) preserves explicit
retained/added/removed requirements across active-objective continuation and
refinement. It does not infer semantic correctness or change wrapper defaults.

The [objective-resolution prototype](OBJECTIVE-RESOLUTION.md) adds scoped active
and suspended objectives, immutable transitions, and an optional bounded provider.
It is a library prototype integrated into the Codex objective lifecycle.
New-work cue normalization now consumes `text.semantic-key/v1` through an
injected Module Port facade. The core package imports no Alch artifact and is
loadable with an empty module set. Without the semantic module, lexical
objective inference returns `unavailable`; a caller-supplied objective can
still resolve, but its Define-intake judgment remains explicitly unavailable
rather than becoming `false`. With the reviewed Alch adapter configured, the
existing separator normalization and Define-intake behavior are preserved.
ARE still owns transition and Define-intake policy.

The semantic capability is synchronous in this L0 candidate. The Module Port
owns manifest, output, and receipt validation; it does not discover adapters,
choose routes, or provide a backup normalizer.

Run with Node v26.8.1:

```text
npm test
npm run benchmark
npm run benchmark:objectives
```

All returned records are canonical, deeply frozen, digest-bound, and carry
`authority_effect: none`.
