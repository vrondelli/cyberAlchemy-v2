# ARE local-package threat model

**Lifecycle status:** CANDIDATE_INTERNAL

**Audience:** ARE product, runtime, release, operations, and security reviewers.

**Owner:** ARE security and runtime owners. No accountable security owner is assigned.

**Last reviewed:** 2026-09-25.

**Applies to:** Candidate 018 and Candidate 020 are frozen historical baselines.
This model covers the later unfrozen working prototype as a single-user local source package
on Linux x64 with Node.js `26.8.1`. Any new topology requires a successor review.

**Claim ceiling:** Identifies threats, current controls, and open residue for the tested local package. It is not risk acceptance, a penetration-test result, a public security policy, or evidence for a network or multi-tenant service.

## Scope and assumptions

The modeled distribution is the content-addressed Candidate 018 source archive
described in the [deployment guide](DEPLOYMENT.md). One authorized human owns
the host, extracts the archive into a user-controlled prefix, and may start a
local Unix-socket gateway. The gateway can launch a Codex or compatible process
adapter and can contact a model provider when the operator configures one.

The model excludes a public download channel, package registry, service manager,
container, network listener, shared host, multi-tenant service, unattended
effect authority, and active vulnerability-reporting program. Adding any of
those boundaries requires a successor threat model.

## Assets

- candidate source bytes, executable modes, closure identity, and release evidence.
- repository content and patches visible to the coding runtime.
- route, context, reasoning-state, conversation, journal, and gateway-session records.
- resume tokens, provider credentials, vault references, and resolved secret material.
- tool authorization, workspace boundaries, budgets, and observed effect outcomes.
- archive checksum, future signature identity, and delivery provenance.

## Actors and trust boundaries

| Boundary | Untrusted or separately trusted side | Protected side |
| --- | --- | --- |
| Archive delivery and extraction | Storage, transfer path, substituted archive | Candidate closure and local prefix |
| Repository and prompt input | Repository text, user content, retrieved evidence | Routing, context, tool and effect policy |
| Local Unix socket | Other local processes and stale clients | Gateway identity, resume tokens and session state |
| Backend process adapter | Model backend output, stderr and lifecycle | ARE gateway, state and host decisions |
| Provider network | Provider service and network path | Credentials, request scope and local records |
| Tool execution | Tool arguments and external side effects | Authorized workspace, host and outcome ledger |
| Durable local files | Corruption, partial writes, disclosure and rollback | Reasoning state, journals and gateway sessions |
| Optional secret provider | SOPS/age executables and encrypted vault | Scoped secret references and material |

## Threats, controls, and residue

| ID | Threat | Current control and evidence | Residual gap |
| --- | --- | --- | --- |
| TM-01 | Archive substitution or byte modification | SHA-256, 907-file closure verification, two-build deterministic archive receipt, fail-closed `doctor`, and tested Ed25519 sign/verify tooling with tamper and wrong-key rejection | No owner-selected signing identity, trusted public key, or authenticated delivery channel |
| TM-02 | Path, mode, or unexpected-file manipulation during packaging | Materializer confines paths to an empty destination, preserves modes, verifies every digest, and the lifecycle drill compares the complete extracted inventory | The tested archive contains only regular files. A future closure with links or special files needs new extraction tests |
| TM-03 | Malicious repository content or prompt injection attempts to grant authority | Request text is evidence, route/context receipts are non-authorizing, tool/effect boundaries remain host-owned, and unknown consequences gate or block | Model and host-specific prompt-injection resistance is not qualified across arbitrary tasks |
| TM-04 | Duplicate execution after disconnect, timeout, or crash | Stable request identities, authenticated resume tokens, acknowledgements, replay tests, and fail-closed unknown-outcome handling | External tools must supply trustworthy outcome evidence. Provider-side effects may remain unknowable |
| TM-05 | Local socket or state disclosure to another process | Unix-socket topology, resume credentials, bounded clients, private-root owner/mode diagnostics, and user-private-path guidance | No hostile same-host isolation or installed service profile |
| TM-06 | Secret leakage into prompts, receipts, source, logs, or fixtures | Secret-reference boundary, closed child-environment allowlist, bounded stderr redaction/digest records, and exclusion from documented context/state records | Pattern redaction is incomplete. Provider behavior and operator-added telemetry still need a deployment policy |
| TM-07 | Backend or provider sends malformed, stale, oversized, or adversarial protocol data | Adapter validation, message and buffer limits, source/profile bindings, request timeouts, and stale-binding rejection | Arbitrary third-party agent protocols are not qualified. Semantic manipulation remains possible |
| TM-08 | Durable state corruption, truncation, or rollback | Append-only/hash-bound records, checkpoints, crash-safe gateway compaction, recovery validation, exact-byte backup/restore, and stale-lock inspection | Recovery is proven only for disposable local paths, not an owner-selected managed deployment profile |
| TM-09 | Resource exhaustion consumes disk, memory, handles, or context budget | Profile limits for clients, buffers, retained bytes, session-store bytes, idle/detach expiry, journal events, DSH histories, and attached-session reasoning logs | No OS CPU/RSS/FD limit, disk alert, or sustained-load baseline exists |
| TM-10 | Compromised optional SOPS/age executable or vault source exposes secrets | Optional provider is process-bounded and Candidate 018 carries its bridge source locally | Executable provenance, vault ownership, rotation, revocation, and incident handling are deployment decisions |
| TM-11 | A static ontology record is mistaken for an active external compiler dependency | Closure rejects `domainspec-core` and Alch toolchain paths. Release tests run from the isolated closure | ARE-owned records retain a historical `domainspec/` directory name and require clear inventory wording |
| TM-12 | Passing tests are treated as approval, safe deployment, or permission to act | Candidate, release, documentation, and lifecycle receipts all state `authority_effect: none` and explicit claim limits | Human or host integrations can still misrepresent evidence unless they preserve those boundaries |

## Security gates before broader distribution

Candidate 018 and Candidate 020 remain exact historical private baselines.
The current working prototype has no accepted successor release. Before
freezing or activating any successor, refresh this model against its exact closure and
record the security owner's disposition for every residual risk.

1. Apply the selected release and version policy to a frozen successor. Then
   select a signing identity, trusted public key, and authenticated delivery channel.
2. Assign a security owner and verify a private vulnerability intake through
   acknowledgement, triage, escalation, and closure.
3. Define host file ownership, modes, secret backend, logs, retention, backup,
   restore, and deletion for any non-disposable installation profile.
4. Exercise hostile local-client access, malicious archive inputs, and
   sensitive-log failure cases.
5. Re-model any managed service, network listener, additional operating system,
   shared host, new provider, or multi-user topology before claiming support.

## Evidence

- [Candidate 018 release note](releases/0.10.0-self-contained-candidate.7.md)
- [Source-package lifecycle receipt](releases/0.10.0-self-contained-candidate.7-lifecycle-receipt.json)
- [Operations and security](OPERATIONS-AND-SECURITY.md)
- [Privacy and retention](PRIVACY-AND-RETENTION.md)
- [Security policy status](SECURITY-POLICY.md)
- [Selected release policy](release-policy.json)

## Open Questions

- Who can accept or reject each residual risk and on what review interval?
- Which delivery and signing system should become the first trusted boundary?
- Which durable state directories and retention rules belong to the first owned installation profile?
