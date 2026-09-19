# Design Decisions

See the primary [Architecture decision log](ARCHITECTURE.md#decision-log).

The load-bearing decisions are:

1. Normalize one graph; never concatenate the five old rendered outputs.
2. Represent constraints as nodes so origin profile, operator, and expected value
   remain explicit.
3. Include all four profiles in the same graph; use profile selection only for
   emphasis and visibility.
4. Pin supplied facts/findings to TypeScript and expose missing evidence for other
   profiles.
5. Use deterministic bands and routed ports before external auto-layout.
6. Keep every identity present, use default Rule trace emphasis, and provide an
   equivalent structured navigator.
