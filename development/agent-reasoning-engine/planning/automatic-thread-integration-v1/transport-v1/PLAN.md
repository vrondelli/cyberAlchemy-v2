# Durable transport construction

Product construction: define delivery states; add journal-bound bridge snapshots;
implement record-before-send transport operations; test fresh-process recovery;
verify context injection acceptance with a credential-free isolated app-server.
Definitions: Prepared means no send begun; Sent means delivery may have occurred;
Received means the correlated response is durably recorded; Applying marks a
possibly incomplete local ledger mutation; Settled has a saved successor bridge
state. Unknown delivery is never permission to resend. Recovery resumes only
known-safe boundaries; ambiguous local mutations require reconciliation.
Ontology scaffold: DeliveryAttempt binds RPC and BridgeSnapshot; Response resolves
DeliveryAttempt; Applying links host evidence to LocalMutation; Settlement records
successor state. Scaffolds grant no authority.
Product prototype: recover connection interruptions without duplicate injection.
Business hypothesis: fewer duplicated effects and lost preferences, unmeasured.
DomainSpec prototype: CONTRACT.json. Compiled-system prototype: bridge -> durable
journal -> JSONL transport -> correlated response -> bridge settlement.
Implementation: bridge.mjs, transport.mjs, rpc-client.mjs. Tests: transport.test.mjs,
bridge regression and host-check.mjs. Approval and activation remain separate.

Runnable frontier: all local construction and zero-model host checks. Done:
unsent recovery, no blind resend, durable responses, stale-writer rejection,
corruption failure, acceptance evidence and explicit model-observation ceiling.
Operational support owner: host integrator; affected stages: native generation
canary and activation. Deferred: four Luna turns exhausted; no live settings or
credentials. No causal local construction blocker. Ambiguous Applying recovery
is deliberately blocked pending exact reconciliation evidence.
