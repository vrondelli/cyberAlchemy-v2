# Repeated conflict, revision and stale-memory experiment

Route: CA2-ROUTE-IMPLEMENT. User accepted the preceding proposed experiment.
Exact write scope: this package only. Reuse the prior 543-file prototype,
its definitions/scaffolds/DomainSpec and exact 0.153.1 canary protocol bindings.
No new ontology dependency or runtime change is introduced.

Product construction frontier: fresh-thread retained-convention transfer works
on the earlier bounded corpus but ties an equal-information summary. Runnable
construction is the present product-test experiment, preserving the same candidate.

Five live training turns ground two lessons and one replacement revision.
Freeze all prompts, rubric and runner before live evaluation. Use six cases,
two arms (B plain summary, C scoped projection), three repetitions and alternating
order. Every evaluation uses a fresh ephemeral thread. The same trained state
is reused across repetitions; this tests response repeatability, not independent
training replication. No baseline A is needed for the selected B-versus-C question.

B receives all current and prior lesson instructions with conditions, revision
identity, superseded status and current invalidation/override status in plain text.
C receives the existing scoped projection. Both have identical status information;
the host supplies grounding, revision identity, invalidation and override IDs.
The invalidation pair uses identical user text and differs only in source validity.
This tests use of explicit status, not autonomous stale-source detection.

Budget: 41 model calls on gpt-5.6-sol, zero optional provider/judge/tool calls,
30-minute dispatch deadline; 240s startup and 120s completion limits. Reuse one
app-server process, disable built-in memories, memory import, tools and delegation.
No automatic live retries. Keep partial failures and dependent checks not_evaluable.

Scoring: frozen literal rubric read only after all outputs exist. Report each
case and each repetition. Scoped advantage requires C strictly outperform B in
each repetition while C has zero control failures. A tie supports no quality
advantage. One fixed corpus/model cannot establish broad semantic reliability.

Operational support: runtime owner supplies exact protocol binding for the live
product-test stage. Approval, activation and publication are deferred owner residue;
none blocks this bounded prototype experiment or gains authority from its results.
