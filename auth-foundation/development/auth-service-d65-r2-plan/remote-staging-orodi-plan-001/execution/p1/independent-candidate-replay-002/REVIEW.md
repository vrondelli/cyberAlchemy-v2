# Independent repaired-candidate replay 002

Verdict: **AGREE**.

Release `09f974f8682915cb` closes the two defects exposed by live attempt 001. Both generated Nginx configuration files are group-readable by the exact service group, and failed-install cleanup restores the temporary Docker-group capability before Compose teardown and removes it afterward. The earlier transactional and release-identity boundaries remain intact.

This is an offline candidate replay. It does not prove successful VPS installation, cleanup on that host, remote ORODI outcomes, admission, or deployment authorization.

`authority_effect: none`

## Exact subject

- Archive: `vps/out/auth-foundation-candidate-09f974f8682915cb.tar.gz`
- Archive SHA-256: `4f988571cc6732a0796e99983d08dd2745f023e5f2842f637e8eda31b9b8d430`
- Manifest SHA-256: `9d917f10a1f87a4af8617b59f9cf437b9898942860b82fdd3c71712ce5c16d2c`
- Manifest content SHA-256 before `release_id`: `09f974f8682915cb73e853a2c83dccd86b35be049415a4509360f4ec67c4b5be`
- Installer SHA-256: `e2fcc67073ed1aab6fbea2a7d5023d0c07f29a21b83f911fc2da9e51367692e1`
- Repaired `scripts/setup.mjs` SHA-256: `9f26ad9339c6fe1ed5d7d59e5f7658953143c4f611b0691bf13e1d176f70ca67`

The evaluation binding and affected-route decision contain the exact archive, release, manifest, installer, and setup identities. Binding preflight is `ready` with zero findings.

## Repair replay

`scripts/setup.mjs` has one rendering function for `nginx.conf` and `upstream.conf`. Its `writeFile` call uses mode `0o640`; both calls pass through that function. The repaired setup file is byte-bound in the final manifest and archive. This addresses the live failure in which the group-identity Nginx container could not read mode-0600 generated configuration.

The install cleanup function now performs its steps in the required capability order for every exit before `install_committed=1`:

1. Stop and disable the candidate unit.
2. If Compose state exists, add `auth-stage` to the Docker group.
3. Run candidate `docker compose ... down --volumes` as `auth-stage`.
4. Remove the unit, current link, and exact candidate roots; reload systemd.
5. Remove `auth-stage` from the Docker group.

The ordering fixes the live-attempt defect where group removal happened before cleanup needed Docker access. Teardown commands remain best-effort in the failure trap, so successful host cleanup still requires remote observation; this offline review confirms the exact ordering and bounded targets.

The transaction guard remains sound in the reviewed script. Archive digest, member safety, manifest schema and release ID, pinned Node identity, UID/GID, absence of both candidate roots and unit, stable-service activity, candidate ports, and Docker project are checked before mutation. `install_committed=0` and the EXIT trap are installed before the first root creation. The release ID file and `current` link are published before the flag changes to committed, so every earlier failure enters cleanup.

Dynamic wrong-release, wrong-hash, missing-argument, and absent-removal probes all returned nonzero without creating `/srv/auth-foundation-candidate` or `/var/lib/auth-foundation-candidate` locally.

## Artifact and regression evidence

The archive has 455 regular members: 454 declared payload files plus its manifest. Every payload member appears exactly once, matches manifest size and digest, and matches current source bytes. There are no missing, extra, duplicate, absolute, parent-traversal, linked, or special members. The embedded and external manifests are byte-identical, and the builder rule derives release ID `09f974f8682915cb`.

The Node suite passed 19/19 tests, including stable/candidate tuple fail-closure, operator-origin rejection, ORODI conservation, correlation IDs, authorization, token validation, and session controls. JavaScript and shell syntax checks passed. Candidate Compose rendering passed. The plan validator passed 27 nodes, 20 controls, 17 hostile controls, and 6 evidence-pipeline hostile controls. All sealed P1 formal V3 artifact digests still verify, and the refreshed affected-route decision retains `formal_v3_status: pass`.

## Commands

```text
sha256sum vps/out/auth-foundation-candidate-09f974f8682915cb.tar.gz vps/out/MANIFEST.json vps/install_candidate.sh
python3 <in-memory archive, manifest, release-ID, and current-source comparison>
TMPDIR=/tmp npm test
node --check src/*.mjs scripts/*.mjs
bash -n vps/install_candidate.sh vps/remove_candidate.sh
docker compose -p auth-foundation-candidate config --quiet
python3 validate.py
(cd execution/p1/formal-v3-author-attempt-001 && sha256sum -c ARTIFACTS.sha256)
bash vps/install_candidate.sh <archive> <exact-sha> wrong-release-id
bash vps/install_candidate.sh <archive> <wrong-sha> 09f974f8682915cb
bash vps/install_candidate.sh
bash vps/remove_candidate.sh absent-release
python3 <in-memory repair ordering assertions>
```

One initial release-ID calculation occurred while shared finalization writes were still completing and produced a transient non-selected value. Three consecutive reads after finalization derived the exact selected release ID and hashes. The transient value is superseded and is not a candidate finding.

## Bounds

No VPS connection was opened. No service, Docker resource, release root, system unit, or remote observation was created. The successful installer path and live cleanup path were not executed because they require the forbidden VPS effect. Cleanup correctness here is bounded to the exact script control flow, static assertions, early refusal probes, and exact digest bindings.

Replay 001 is preserved as historical evidence for its earlier candidate. Replay 002 supersedes its readiness conclusion for this repaired release only.

## Open Questions

- Does the next authorized live attempt confirm mode `0640` inside the generated runtime state and successful Nginx startup under the configured group identity?
- Does an induced or naturally occurring failed install confirm Docker teardown and zero candidate residue on the VPS?
