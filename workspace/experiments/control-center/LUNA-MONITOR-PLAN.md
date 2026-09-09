# Luna monitor implementation prototype

Product construction: read-only pool and task panels beside chat, using the successor
orchestrator GET /api/v1/state projection. Worker means an explicitly reported Luna
executor; task means an explicitly model-bound strategy node, not necessarily an
active process. Preserve raw statuses, source mode, and observation freshness.
No inferred chain-of-thought, progress, execution, approval or ontology promotion.

Frontier: render real observations with disconnected, unavailable, stale and empty
states. Narrow displays stack panels below chat; desktop uses both bottom sides.
Test parser and endpoint constraints, typecheck and compile. Preserve chat mount.

Operational support (owner: runtime operator): provide a loopback orchestrator with
browser/native access to its read-only projection. Connection is explicit, credentials
omitted, redirects rejected, requests timeout, polling is serial and stops on unmount.
No worker launch or runtime service mutation. Actual connection, CORS/CSP/native
transport and live worker lifecycle remain integration evidence to collect.

Deferred: code-executing Luna campaign, snapshot delta/activity stream, native build,
performance campaign, approval, merge and publication. Existing budgets unchanged.
