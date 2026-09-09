# Disposable validation worker

Product frontier: both corrective proposals passed separate oracle checks, but changing host pressure interrupted public validation. Construct a disposable container worker using the existing sandbox and local digest-pinned Node image. This adds filesystem/network/resource isolation, not reserved host CPU or RAM.

Product DAG: owned-container lifecycle wrapper -> timeout/cleanup/denial tests -> real timeout cleanup canary -> six fixed public validations -> source and cleanup verification. Use the two unchanged corrective proposals from ready-feedback and the other four historical oracle-correct proposals. No model calls, new proposals or historical score replacement.

Bounds: existing local Node 26.8.1 digest, no pull, no network, read-only minimal input mount, 512 MiB memory, two CPU quota, 64 PIDs, unprivileged UID, no capabilities; 120 seconds per validation container plus bounded cleanup. One timeout canary at one second, followed by six fixed validation containers. Stop if cleanup cannot confirm absence. Public checks keep five-second child/two-minute batch limits. Target: successful timeout cleanup and 6/6 public validations with no execution failures or residual containers.

Affected stages: explicit worker lifecycle and validation replay. Agent owns exact generated container names and temporary files; user owns other workloads and activation. Do not stop unrelated processes or containers. Causal blockers: unavailable image/engine, failed cleanup, source drift, worker failure. Deferred residue: actual host capacity reservation, fresh model episodes, remote worker provisioning and default integration. CAV2-D65 candidate construction, no ontology dependency or authority effect.

## Open Questions

Can disposable workers complete this sample without execution stalls? Shared-host pressure remains possible despite resource limits; a passing replay cannot establish lasting isolation or prospective model reliability.
