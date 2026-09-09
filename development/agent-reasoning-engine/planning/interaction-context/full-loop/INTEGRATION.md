# Full interaction learning loop integration

The local prototype joins request interpretation, scoped context selection, verified
dispatch, observed completion, attributed correction, later lesson application,
progress assessment, and the existing bounded evolution scheduler and records.

Construction frontier: a testable implementation candidate. Runnable construction
validation is `validate.py --test --node /home/vrondelli/.nvm/versions/node/v26.8.1/bin/node`.
The test profile is `packages/codex-app-server-wrapper/profiles/interaction-learning-canary-v1.json`
under the ARE implementation root. Existing serving profiles remain disabled.

A host supplies `interaction_input_provider` synchronously with target, explicit
checks, overrides, and optional feedback. Feedback names one completed episode,
source quote, instruction, target, posture, retention, correction class, and finite
expected output checks. Attribution is a trusted host boundary; this prototype
checks its binding and scope, not arbitrary natural-language semantic correctness.
The same raw request reaches the model. Selected lesson meaning is included in
additional context before dispatch hashing and is also passed to objective
interpretation when that provider is needed. No second model call is introduced.

`inspectLearningState()` shows compact coverage; `{detail:true}` explicitly reveals
the private state. `controlLearning({action:'disable-reuse',control_id,lesson_id})`
revokes future reuse. `set-mode` changes off/observe/apply-scoped independently of
visibility. Persisted controls override changed startup defaults. Revocation is
not physical erasure of the append-only ledger. Current-product retention needs
an explicit user-selected scope. Two contradictions among the latest five
evaluable inferred-lesson applications suspend that lesson.

After three distinct attributed failures in the latest twenty completed turns,
`runLearningEvolution()` drains one durable target through the existing scheduler.
Hosts explicitly supply research providers and an experiment runner. With no
provider it records research-pending. The exact implementation binding defaults
to the current learning-loop source digest. No serving source is mutated. The
runner must report frozen manifest/environment/run refs and protected comparisons.
Labeled test measurements exercise this adapter without claiming empirical gain.
One research cycle, two providers, five retained results per provider, three
attempts maximum and two no-gain attempts bound it. Callback deadlines abort
cooperative providers; a provider ignoring cancellation may finish externally,
but its late result cannot continue this cycle. A recovered unfinished delivery
is preserved as unknown and is not retried automatically.

Operational support: the runtime compatibility owner must reconcile installed
Codex 0.153.1 with the wrapper's 0.153.0-alpha.5 pin before live testing. The product
owner then reviews one immutable candidate with current evidence. Integration and
publication bookkeeping, serving activation, retention beyond the explicit scope,
and external provider setup remain separate residue. None is silently approved.

Selected ontology dependencies are the five exact parent nodes in MODEL.json and
the new private scaffold. DomainSpec compilation proves deterministic prototype
structure, not ontology admission or implementation conformance. The historical
requirement-continuity receipt remains unchanged and refers to its earlier bytes.

Limitations: literal output checks do not prove semantic correctness; synthetic
48-episode coverage is not independent empirical replication or an external
holdout; live quality, model cost/tokens, physical data erasure, production host
attribution, and effectful variant construction are not established here.
