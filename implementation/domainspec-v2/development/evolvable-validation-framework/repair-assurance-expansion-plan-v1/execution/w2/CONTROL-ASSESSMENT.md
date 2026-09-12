# L2 negative-control coverage

Status: complete for the bounded promotion decision. Authority effect: none.

The frozen author attempt passed 48 native cases, 48 sanitizer executions and
two actual-C CBMC representatives. Ten isolated expanded-run controls produced
the expected non-pass or rejection. Five mechanism tests covered typed launch
failure, active output ceilings, deadline enforcement after pipe EOF, raw-event
cardinality and raw-evidence mutation. The recovery probe terminalized an
interrupted attempt without rerunning it.

The [control manifest](control-manifest.json) maps every minimum class from T3
to retained evidence. Destination-tail behavior and absent placement metadata
come from the completed fixed reference replay. Member-assertion weakening was
also exercised by that replay's independent reviewer. Those two findings are
valid calibration evidence, but they were not repeated as dedicated mutations
over every expanded case. The expanded validator instead binds all recorded
case definitions to the canonical enumeration and requires exact per-merge
event cardinality.

These results support independent L2 replay. They do not establish general
CRDT convergence, authenticated execution, independent-host portability,
hard real-time supervision or certification.

## Open Questions

- Should a later successor repeat placement-only and member-only mutations over
  the entire 48-case denominator?
