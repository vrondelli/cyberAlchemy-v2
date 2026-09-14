# RWO Legacy Replay Fixtures

Status: migration evidence  
Authority effect: none

The historical reducer is no longer executable from this package. Its derived
command sequence is frozen in `etl-command-sequence.v1.json` so the current
engine can retain the shared replay expectation without a legacy dependency.
`etl-composition.json` and `historical-rwo-design.md` preserve the corresponding
design inputs.

The exact predecessor source is retained only under
`../../migration/provenance/legacy-rwo-rust/`; it is not a build input.

## Open Questions

The fixtures may be removed after the replay compatibility window receives its
own owner decision and all persisted legacy runs have an assigned reader.
