# Single-Chat Definition Prototype

Status: non-authoritative D65 scaffold  
Authority effect: none

**Single Chat** is the one primary interaction surface through which a human
continues a CyberAlchemy conversation. Define, Research, Ontology, Plan,
Implement, and Validate are internal capability routes, not user-selected
workspaces.

**Conversation** is the ARE-owned ordered interaction context that binds human
messages, intent contracts, route decisions, context and reasoning identities,
agent messages, questions, decision gates, diagnostics, and terminal outcomes.

**Turn** is one human message and the ARE processing and events attributable to
that message. A new turn may create successor internal identities without
creating a new user-facing chat.

**Conversation Event** is an immutable, sequenced, digest-bound fact emitted by
ARE for an interaction adapter to render. Rendering never changes its meaning
or authority.

**Human Decision Gate** is an ARE-owned pending decision bound to one exact
subject digest and a closed set of allowed decisions. Displaying a gate does
not satisfy it.

**Usability Observation** records what a person or deterministic interaction
harness observed. It is evidence, not a diagnosis or implementation command.

**Failure Classification** assigns a reproduced failure to `reasoning-engine`,
`interaction-adapter`, `conversation-protocol`, or `not_evaluable`.

**Engine Improvement Handoff** binds an ARE-owned failure to its exact
benchmark result and replay scenarios so the evolution runtime may create a
non-adopted Research Hypothesis. It grants no mutation or activation authority.

