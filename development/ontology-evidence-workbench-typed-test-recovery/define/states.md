# States: OEW Typed-Test Recovery

## RecoveryState

```mermaid
stateDiagram-v2
  [*] --> Prepared
  Prepared --> Running: admitted command begins
  Running --> Passed: exit zero and discovery passes
  Running --> BlockedEvidenced: nonzero plus evidence persisted
  Running --> BlockedUnavailable: evidence empty or invalid
  Running --> EvidencePersistenceFailed: writer fails
  Passed --> CleanupFailed: cleanup fails
  BlockedEvidenced --> CleanupFailed: cleanup fails
  BlockedUnavailable --> CleanupFailed: cleanup fails
  EvidencePersistenceFailed --> CleanupFailed: cleanup fails
```

Invariants: no blocked state emits a success handle; cleanup is attempted in
every terminal path; consumed authorization remains consumed; retry remains
false unless a later owner supplies fresh authority.

