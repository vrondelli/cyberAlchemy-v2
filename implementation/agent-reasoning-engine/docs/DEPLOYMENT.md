# Deployment guide

**Lifecycle status:** READINESS_ONLY

**Audience:** Product, release, security, and operations owners preparing the first ARE deployment.

**Owner:** ARE operations owner. No active deployment owner is assigned.

**Last reviewed:** 2026-09-17.

**Applies to:** Private Candidate 018, version `0.10.0-self-contained-candidate.7`.

**Claim ceiling:** Provides the tested local source-package procedure and records
its remaining deployment gaps. It is not a production service procedure or a
public release.

## Commercial distribution boundary

The selected offer is a paid download of the complete self-contained ARE
software, rather than access to a hosted service. A customer will receive the
full accepted successor source closure. The tested local topology below is
therefore also the intended first customer topology.

The latest [Keld license direction](../../../keld-project/docs/LICENSE-PAYMENT-RESEARCH.md)
is a custom source-available license that permits use,
copying, modification, sharing, and commercial use. Selling a redistributed
software copy requires an added working function or integration. Cosmetic
edits, renaming, and bug fixes alone do not qualify. Hosted access and paid
support services are outside this resale rule. This is still candidate intent,
not executable license text.

Customer delivery remains blocked until exact terms and the
complete ownership, third-party notice, trademark, patent, and target-market
review are approved. Keld’s website, brand, story, and illustrations are outside
the ARE software-license scope.

## Current topology

The implemented gateway is a single-user local process. It listens on a Unix
socket, launches or connects to one backend adapter, and uses private local
files for gateway sessions and Reasoning State.

~~~mermaid
flowchart LR
    H[Local host or agent] -->|JSON-RPC over private Unix socket| G[ARE gateway]
    G -->|JSON lines process transport| B[Codex or compatible backend]
    G --> S[Append-only gateway session store]
    G --> R[File-per-consumer Reasoning State]
    B --> P[Model provider when explicitly configured]
~~~

The [repository profile](../packages/codex-app-server-wrapper/profiles/repository-v1.json)
sets one writer for both durable stores. It bounds clients and buffers, sets a
five-minute detach expiry, and sets a thirty-minute idle expiry. It permits four
MiB of retained session data and a 64 MiB reasoning log. [Compatibility and
lifecycle](COMPATIBILITY-AND-LIFECYCLE.md) owns the current runtime and host
support matrix.

## What is verified

- Node.js `26.8.1` is the declared runtime.
- Local Unix-socket gateway lifecycle, authentication, acknowledgement, replay,
  restart recovery, bounded buffering, and unknown-outcome blocking have tests.
- Codex is the default backend. A validated JSON-lines process adapter is the
  model-neutral boundary.
- Secret providers pass references and scoped material at execution boundaries.
- Candidate inspection and release verification bind the current workspace
  candidate when its exact closure inputs are present.
- The standalone materializer produced a 907-file, 7,954,528-byte closure. The
  closure has no external Alch or DomainSpec compiler tree. The complete
  1,158-case suite passed from the isolated copy.
- Two normalized `tar+gzip` builds produced the same 1,817,921-byte archive with
  SHA-256 `4d6fd3cc9a60f4d85b6ee076c5d01ceb41b0465d9e8bcfa1ac87a6c592119235`.
- A disposable prefix passed closure verification, CLI installation, and
  `doctor`. It passed seven gateway recovery cases and an injected-corruption
  failure. It also passed exact source rollback, two-store recovery drills, and
  uninstall cleanup. The recovery drills used mode `0600`.

These facts describe a development candidate. They do not establish service
hardening, availability, tenant isolation, or general provider reliability.

## Deployment blockers

1. Exact license text, ownership/notice review, a trusted release signing
   identity, and its public key have not been selected.
2. No service-manager or container definition is a declared product artifact.
3. Health/readiness, log export, telemetry export, backup destination, secret
   backend, filesystem owner, and resource limits have no deployment profile.
4. The candidate threat model exists, but no accountable security/operations
   owner or risk acceptance exists. Disposable local-store recovery is tested.
   A later managed topology needs its own owned paths and recovery exercise.
5. Network and multi-tenant service boundaries remain unsupported.

## Activation evidence

This guide can become executable only after one topology has:

- a content-addressed artifact reproducible in a clean environment.
- an inventory, checksums, provenance, and license/notice treatment.
- validated configuration and secret references.
- explicit process, filesystem, socket, storage, and backup ownership.
- health, readiness, graceful shutdown, and observability contracts.
- install, start, stop, reconnect, restart, backup, restore, rollback, and
  uninstall evidence from a disposable environment.
- security, privacy, and applicability review for that exact topology.

Candidate 018 satisfies the source artifact, deterministic archive, disposable
installation, local health, source rollback, disposable durable-store recovery
and uninstall gates. Trusted archive signing and managed service operation
remain separate release and deployment work.

## Materialize the verified candidate

From the ARE project root, choose an empty destination:

~~~sh
npm run distribution:materialize -- /tmp/are-standalone
node /tmp/are-standalone/cyberAlchemy-v2/implementation/agent-reasoning-engine/bin/are.mjs doctor --json
~~~

The emitted receipt binds the closure digest and file count. This creates a
source distribution. It does not install a service.

## Build and exercise the archive

From the repository root, run this command to build the normalized archive
twice. The command requires byte-identical results and emits the requested
archive and checksum. It then repeats the tested lifecycle sequence in a
disposable prefix. The sequence covers installation, health, gateway recovery,
source corruption, rollback, two-store recovery, and uninstallation.

~~~sh
node development/agent-reasoning-engine/planning/documentation-readiness/verify-source-distribution-lifecycle.mjs \
  --artifact /tmp/are-0.10.0-self-contained-candidate.7.tar.gz \
  --output /tmp/are-0.10.0-self-contained-candidate.7-lifecycle-receipt.json
~~~

Verify the emitted archive from its output directory:

~~~sh
cd /tmp
sha256sum -c are-0.10.0-self-contained-candidate.7.tar.gz.sha256
~~~

The checked-in [lifecycle receipt](releases/0.10.0-self-contained-candidate.7-lifecycle-receipt.json)
binds the exact Candidate 018 closure and every passed step. The command uses
GNU tar metadata normalization and gzip's timestamp-free header. It reports
`NOT_RUN` for trusted signing rather than treating a checksum as signature
proof. Its durable-store result applies only to the disposable paths created by
the drill.

## Sign and verify with an owner-managed key

The release tooling supports Ed25519 PEM keys and requires private-key mode
`0600` or stricter. It signs a statement that binds Candidate 018, the archive
digest and size, and the public-key fingerprint. The signing identity and trusted public-key
channel remain owner decisions.

~~~sh
node development/agent-reasoning-engine/planning/documentation-readiness/sign-source-distribution.mjs sign \
  --artifact /tmp/are-0.10.0-self-contained-candidate.7.tar.gz \
  --private-key /secure/release-private.pem \
  --statement /tmp/are-0.10.0-self-contained-candidate.7.statement.json \
  --signature /tmp/are-0.10.0-self-contained-candidate.7.signature.json

node development/agent-reasoning-engine/planning/documentation-readiness/sign-source-distribution.mjs verify \
  --artifact /tmp/are-0.10.0-self-contained-candidate.7.tar.gz \
  --public-key /trusted/release-public.pem \
  --expected-fingerprint OWNER_APPROVED_SHA256 \
  --statement /tmp/are-0.10.0-self-contained-candidate.7.statement.json \
  --signature /tmp/are-0.10.0-self-contained-candidate.7.signature.json
~~~

Tests prove successful verification and rejection of artifact tampering, the
wrong public key, and an overly permissive private-key file. Test keys are
created only in disposable directories. No release key is stored in the
repository.

## Current development command

The gateway command in [Getting started](GETTING-STARTED.md#start-the-gateway)
is a local development invocation. Do not present it as a production install or
service unit.

## Open Questions

- Which signing identity and private delivery channel will carry the archive?
- Who owns the first non-disposable storage profile and its recovery objective?
