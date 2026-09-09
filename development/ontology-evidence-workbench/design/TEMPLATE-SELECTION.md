# Design Template and Profile Selection

## Selected

- DomainSpec six-view architecture profile: required baseline.
- `architecture` companion: required by external dependency, adapter, serving,
  versioning, trust, persistence, and integration boundaries.
- `ux-plan` companion: required because people navigate and inspect a new
  rendered semantic contract.
- validation contracts: required by source admission, browser, isolation,
  determinism, and authority claims.

## Not Selected

- `research`: upstream source and live local contracts were inspected; no
  acceptance-critical design decision is evidence-blocked.
- spell/sigil: target is a private product feature, not an Arcanum lifecycle
  artifact.

The selection result is controlled by
`DESIGN-SELECTION-RESULT.json`, not this authored statement.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
