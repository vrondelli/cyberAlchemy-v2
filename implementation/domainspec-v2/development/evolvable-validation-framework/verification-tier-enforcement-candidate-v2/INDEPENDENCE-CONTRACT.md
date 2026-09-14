# V3 provider independence contract

Every V3 route must declare a unique route ID, independence group, and evidence
producer identity. Shared infrastructure is allowed only when each shared
component is named and digest-bound; the result reports every component used by
more than one route. A shared wrapper or JVM is not counted as an additional
proof route.

Independence here means materially different evidence production for distinct
semantic obligations. It does not claim organizational, vendor, hardware, or
common-mode-failure independence.

`authority_effect: none`

## Open Questions

- Whether later assurance profiles require separate vendors or hardware.
- Whether shared infrastructure should reduce a quantitative confidence score.
