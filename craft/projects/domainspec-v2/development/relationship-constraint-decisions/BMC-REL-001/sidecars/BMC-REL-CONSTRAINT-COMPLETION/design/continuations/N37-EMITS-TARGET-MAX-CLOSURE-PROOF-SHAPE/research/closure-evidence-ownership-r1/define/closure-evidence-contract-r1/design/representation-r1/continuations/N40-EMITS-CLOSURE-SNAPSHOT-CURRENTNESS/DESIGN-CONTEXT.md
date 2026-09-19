# N40 Design context: snapshot evaluation and currentness

Status: authored-complete; owner choice pending.

N39-A places one dedicated consumer-authored sidecar outside generated output. The next unresolved consequence is whether an evaluator may issue an immutable result for that exact digest-bound snapshot when the snapshot's relationship to the consumer project's present head is unknown or stale.

Exact bindings prove internal snapshot consistency. They do not prove that a snapshot is the current project head. The Define contract already limits evaluation receipts to their bound snapshot, preserves them historically, and assigns currentness to a separate owner.

The smallest evidence-backed action is therefore snapshot-relative evaluation with external currentness: the evaluator may issue the exact-snapshot result, but must not claim present-head validity without a separately owned currentness reference.

No schema fields, currentness vocabulary, TTL, supersession mechanism, implementation, packet projection, profile admission, release effect, or D06 work is selected here.
