# Measured terminal catalog design review R1

Not yet sufficient for exact implementation. The isolated wider-catalog hypothesis and bounded prefix schedule are sound, but two decisions need explicit resolution: actual native projected envelope<7999 including schema/reasoning/margin/output; and full-request failure policy with separate request/index probe budgets. Length-truncated or invalid output must fail without retry.

The native restored-ID schema allows256 IDs and1MiB bounded JSON, so128 IDs alone are not a parser-limit blocker. Output cap2048 still does not guarantee a complete response. Omitted counts establish capacity exclusion, not relevance or causal selection loss.

## Open Questions

Pin the exact gate/probe/failure policy before implementation. Preserve strict submission/provenance checks and final one-call budget. No live admission. Additive R2 may resolve these findings without modifying R1.
