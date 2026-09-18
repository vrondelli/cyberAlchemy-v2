# Operations and security

## Operational checklist

1. Use the Node version declared in `product.json`.
2. Run `doctor --json` before starting a host.
3. Inspect Candidate 018 and run release verification for a release workspace.
4. Place gateway sockets and state below a user-private directory.
5. Set explicit storage, buffer, idle, and retention limits.
6. Monitor gateway stderr, closed sessions, expiry, replay, and unknown outcomes.
7. Back up append-only state before migration.
8. Stop and inspect source drift instead of overwriting candidate evidence.

## Secrets

The coding runtime supports secret-provider contracts, including a SOPS/age
provider. Secrets enter only the tool/provider boundary that needs them. Do not
place credentials in prompts, receipts, source closures, examples, or test
fixtures. Release verification scans the closure for common private-key and
token forms. This supplements rather than replaces proper secret handling.

See [Privacy and retention](PRIVACY-AND-RETENTION.md) for the stored data
classes, current limits, and unresolved physical-erasure boundary.
See the [Candidate 018 threat model](THREAT-MODEL.md) for assets, trust
boundaries, current mitigations, and residual gaps.

## Effects

Keep evaluation and execution separate. An `effect` result identifies
consequence, reversibility, and owner gates for one exact proposal. The host
must enforce its own approval and sandbox policy and record the observed
result. Unknown outcomes must not be retried blindly.

## Storage

Isolated product tests create temporary closures and remove successful runs.
Failed runs may remain for diagnosis. ContextBench caches are research storage
and follow their own compaction and retention manifests. Before a large run,
inspect free disk space and set a bounded cache root.

## Recovery

On restart, verify state and journal digests before replay. Restore the latest
valid checkpoint, replay later verified events, rebuild derived indexes, and
preserve unknown external outcomes as blocked records. Do not infer success
from a missing process.

## Security claim boundary

Candidate 018 validates local contracts and controlled canaries. It does not
claim hostile multi-tenant isolation, network service hardening, complete
credential scanning, or a production sandbox.

## Open Questions

- Which operational profile should define default retention and disk limits
  outside the development workstation?
- Which threat model should gate any future network-accessible gateway?
