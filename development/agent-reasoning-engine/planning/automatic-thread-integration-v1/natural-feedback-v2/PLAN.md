# Language coverage construction plan

Product construction: freeze a labeled synthetic development corpus; evaluate v1;
implement a bounded grammar successor; compare classifications and false
persistent promotions; test actual lifecycle integration and legacy behavior.

Definitions: a Classification is a fixed preference, pending correction, control,
confirmation, one-time request or abstention. CorpusAgreement measures exact
classification agreement, not user satisfaction or general understanding.

Ontology scaffold: Request -> Classification -> scoped FeedbackCandidate ->
completed Episode -> LearnedChange; CorpusCase -> expected Classification.
Product prototype: common phrasing works without repeated slash commands.
Business hypothesis: fewer repeated corrections, unmeasured.
DomainSpec prototype: CONTRACT.json binds scope, precedence and abstention.
Compiled-system prototype: whole-input grammar -> existing ARE lifecycle -> ledger
-> fixed guidance. Implementation candidate: interpreter.mjs and adapter.mjs.
Product-test candidate: corpus comparison, adversarial transformations and fresh
process integration. No product approval or operational authority is asserted.

Current runnable frontier: all local construction steps above. Done requires all
labeled cases correct, no false persistent promotion on negative cases, unchanged
v1 regression behavior, and integration evidence for each new correction type.
Synthetic corpus is visible to implementation, so improvement is development
coverage only. Preserve predecessor source and evidence hashes.

Operational support: host integrator owns native canary (product-test stage) and
later installation (activation stage). Both deferred; four authorized Luna turns
are exhausted. Neither blocks local construction. No new model calls, credentials,
public files or live hook changes. No causal local construction blocker.
Deferred construction: independent user corpus, general interpretation, steering,
compaction, capability learning and physical deletion.
