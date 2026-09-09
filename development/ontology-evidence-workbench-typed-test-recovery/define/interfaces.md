# Interfaces: OEW Typed-Test Recovery

## Builder command seam

Internal interface: `commandRunner(program, args, cwd, id, env) -> CommandResult`.
Production defaults to the current executor; tests inject a deterministic
no-network runner. The seam grants no shell or network authority.

## Failure evidence writer

Internal producer interface:

```text
writeFailureEvidence({ commandResult, admittedOutput, binding, cleanupIntent,
                       authorization }) -> FailureEvidenceReference
```

## Terminal evidence reference

OEWSN planning declares one mutually exclusive terminal output slot. Task
Session may join the producer-owned reference but does not capture streams,
own `oew.failure-evidence.v1`, retain the workspace, or reinterpret BLOCK as
completion.

