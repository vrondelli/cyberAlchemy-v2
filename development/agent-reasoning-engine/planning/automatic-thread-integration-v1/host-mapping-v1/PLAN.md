# Host mapping construction

Product construction: inspect installed protocol; define acceptance and delivery
boundaries; implement a local RPC/event bridge over continuity-v1; test actual
lifecycle integration using schema-shaped fixtures. No transport sends here.

Definitions: HostAcceptance is a matching RPC result, not model observation.
SteerProposal is pending until acceptance; rejection changes no ARE revision.
InjectionProposal is a bounded developer-message context request. DeliveryState
separates proposed, host-accepted and model-observed (not established here).
Ontology scaffold: RPCRequest correlates RPCResponse; Acceptance grounds
RequestRevision; CompactionItem references ContextRestore; InjectionProposal
references Projection. These are navigation scaffolds, not authority records.
Product prototype: translate native host messages into ARE continuity events.
Business hypothesis: automatic continuity with fewer lost corrections, unmeasured.
DomainSpec contract: CONTRACT.json. Compiled-system prototype: RPC correlation ->
continuity adapter -> ledger-bound projection -> injection proposal -> acceptance.
Implementation candidate: bridge.mjs. Tests: bridge.test.mjs and protocol evidence.

Current runnable frontier: local bridge construction and validation. Done requires
rejection without revision mutation; acceptance before supersession; exact input
preservation; bound compaction mapping; explicit delivery ceiling; stale, duplicate
and racing events rejected. Runtime mapping does not prove live model delivery.

Operational support owner: host integrator. Transport installation (activation
stage) and real canary (product-test stage) deferred. Four-turn allowance exhausted;
zero model calls. No causal blocker to local construction. No product approval,
activation, credentials, live injection, publication or host settings changes.
Deferred construction: durable bridge transaction recovery, host transport event
barrier and independent evidence that injected guidance reaches a model request.
