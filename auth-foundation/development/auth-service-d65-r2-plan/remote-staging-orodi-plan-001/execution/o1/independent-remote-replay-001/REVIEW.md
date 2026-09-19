# Independent Remote Replay 001

## Verdict

`AGREE` for the narrow deployed Auth Foundation candidate claims that were independently replayed with read-only commands and harmless HTTPS/service requests on `root@187.77.248.154`.

The replay does not agree that the full remote-staging DAG is complete. It grants no authority, admission, activation, release, production, deployment, or runtime-conformance effect. `authority_effect: none`.

## Independently observed result

The stable release `be1836ec99109120` and candidate release `55c5af69059e1de6` were both active, running, and enabled. Their systemd units and working directories were distinct:

- stable: `auth-foundation-staging.service` at `/srv/auth-foundation-staging/releases/be1836ec99109120`
- candidate: `auth-foundation-candidate.service` at `/srv/auth-foundation-candidate/releases/55c5af69059e1de6`

The stable archive at `/tmp/auth-foundation-staging-be1836ec99109120.tar.gz` re-hashed to `64e5e92b9cd8834144ea47a4c6d9dd49916906b50a262fffaa9a79201f1f98fe`. The candidate archive, manifest, and installer re-hashed to the requested digests:

- archive: `eb23824e7ce9715cbf5d39911078a14fac68e6479f10f844b423e4c2f16a30c3`
- manifest: `64f96afccd11c40b77bd1e104a16685c4c0362f6954220515127ff40411c0561`
- installer: `e2fcc67073ed1aab6fbea2a7d5023d0c07f29a21b83f911fc2da9e51367692e1`

The stable and candidate namespaces were separate across systemd units, release roots, state roots, Docker Compose projects, container names, and loopback ports. Stable used `13443/18443/19443`; candidate used `23443/28443/29443`. All six declared listeners were bound to `127.0.0.1`. Both PostgreSQL containers were healthy, and `auth-stage` had no Docker supplementary-group membership after deployment.

The candidate's selected non-secret configuration matched the candidate profile: Compose project `auth-foundation-candidate`, origin `https://localhost:23443`, issuer `https://localhost:28443/realms/auth-https`, operator origin `https://localhost:29443`, and ports `23443/28443/29443`. The release and state config files were `0600`; proxy directory/config modes were `0750/0640`; socket directory/socket modes were `0770/0660`; all were owned by UID/GID `1000:1000`.

Stable health, candidate health, and candidate OIDC discovery returned HTTP 200 with the expected issuer and endpoints. An invalid `Host: attacker.invalid` request returned 421. A caller-supplied correlation value returned 400 with `Caller correlation field rejected` and a distinct server-generated replacement ID. The live service request returned HTTP 200, decision `ALLOW`, and principal kind `service`.

Final candidate health reported `offered=36`, `queued=36`, `rejected=0`, `exported=35`, `dropped=0`, and `pending=1`. Both conservation equations closed and required drops were zero for this observed window.

## Raw evidence and cleanup receipts

All JSON evidence files under `execution/o1` parsed successfully. The recorded digest bindings for the raw observation, identity, recovery, load, fault, and failed-attempt files matched their current bytes.

The failed release roots for attempts `9d3540ef8f33eb19` and `09f974f8682915cb` were absent from both stable and candidate release trees, and no current container command or systemd unit referenced either release. The current candidate containers, volume, and networks were created after attempt 002.

This corroborates a current state compatible with the two cleanup receipts, but it does not independently reconstruct the historical cleanup event. The attempts and final deployment reuse generic Compose resource names, so current resources cannot prove which earlier attempt-specific containers, volume, and networks were removed. The receipts remain author evidence for that historical claim.

No secret values were read or emitted. The replay did not restart, pause, stop, install, remove, fault, or otherwise mutate any remote service.

## Full DAG controls still incomplete

The authoritative `EXECUTION-STATUS.json` leaves these controls incomplete:

- `X0` — `inconclusive`: pre-existing service preservation is not reproducible.
- `O2` — `inconclusive`: monitoring/retention, backup storage/restore proof, and production-shaped ingress or dedicated DNS/public TLS remain missing.
- `O3` — `inconclusive`: durable off-process telemetry export, retention/expiry, alert delivery, and an admitted append-only observer remain missing.
- `G2` — `not-run`: the full observation gate remains closed.
- `O4` — `not-run`: the full stable-baseline observation window was not run.
- `O5` — `not-run`: the 95/5 canary allocation and independently bound transition were not run.
- `C1` — `inconclusive`: the human-browser fixture and all five live Auth obligation fixtures remain incomplete.
- `C2` — `inconclusive`: the complete fault catalog and three-role failure mapping remain incomplete.
- `C3` — `inconclusive`: ten-minute load steps, the 60-second burst, the 120-minute soak, the capacity boundary, and generator saturation proof remain incomplete.
- `C4` — `inconclusive`: alert delivery and durable exported/retained telemetry remain incomplete.
- `C5` — `not-run`: bound backup, isolated restore, RPO/RTO, and restored Auth checks were not run.
- `O6` — `not-run`: the full ordered rollback was not run.
- `O7` — `not-run`: independent restoration and complete zero-residue inventory were not run.
- `E0` — `not-run`: the complete evidence ledger and digest manifest were not sealed.
- `R0` — `not-run`: full independent replay and hostile omission/tamper/duplicate/stale/non-passing controls were not run.
- `G3` — `not-run`: the full remote-staging verdict gate was not run.
- `G4` — `not-run`: the no-effect production-canary decision package was not prepared.

Accordingly, this replay supports the exact live candidate identity and the bounded checks above. It does not lift `O2`, `O3`, `C1-C4`, or `X0` from `inconclusive`, does not mark any `not-run` node complete, and cannot satisfy the full `R0` or `G3` gates.

## Open Questions

- What durable source will retain attempt-specific cleanup identities so historical container, volume, and network removal can be independently replayed?
- When will the remaining full-DAG controls be executed under their required owners and gates?

