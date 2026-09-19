# Refresh Technique Trace

- Capability: `invoke`, mode `refresh`, mutation `apply-approved`.
- Input frontier: closed 011 receipt plus finite chain.
- Decision: select the only eligible selector, 012.
- Tension: selecting 013 or later would violate the dependency chain; selecting
  more than one unit would violate Task Session atomicity.
- Handoff: one 012 Task Session may seek mutation admission.
