# Distill Design Validation

Mode: Standard then Validate.

Proposer synthesis: use one neutral obligation/case IR, one explicit profile registry, independent renderer/runtime bindings, and one EVF evidence port.

Balancer challenge: the design could accidentally make TDE a capability-policy owner, treat candidate profiles as admitted, or turn Lean into a renderer.

Balanced result: retain validation governance as policy owner; require TDE-specific exact admission/currentness; require preservation evidence before derivation; keep Lean in a separate EVF theorem-provider lane; compare semantic parity rather than syntax.

Smallest coherent unit:

FormalClaim intake -> admitted executable projection -> neutral TDE IR -> exact implementation profile -> provider evidence -> EVF handle.

Validation disposition: pass for Design authoring only. The execution gate remains blocked.
