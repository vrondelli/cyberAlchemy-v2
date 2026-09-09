# Mappings: OEW Typed-Test Recovery

## CommandResultToFailureEvidence

| Source | Target | Transform |
| --- | --- | --- |
| command identity | allowlisted command fields | normalize and retain |
| stdout/stderr bytes | digest, size, bounded text | SHA-256 plus deterministic redacted head/tail |
| environment | none | always omit |
| absolute temporary paths | role labels | normalize or redact |
| candidate inputs | relative path, digest, size | exact allowlist |
| authorization | attempts used/consumed/retry | preserve separate fields |

## Compatibility Evidence To Decision Packet

Map the proved Node/DOM contradiction, frozen lockfile, affected assertions,
and unproved browser/product behavior into two bounded options. Do not emit a
selected option. A later owner receipt must bind the chosen branch, its exact
write scope, dependency policy, and validation surface.
