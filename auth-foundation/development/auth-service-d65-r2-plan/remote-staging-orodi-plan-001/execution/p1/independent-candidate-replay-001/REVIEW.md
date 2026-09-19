# Independent Auth candidate predeployment replay

Verdict: **AGREE**.

The final archive is internally complete and byte-consistent with current source, the stable/candidate profile and ORODI unit evidence pass, the sealed formal V3 result replays exactly, and the final installer closes the pre-mutation identity and failure-cleanup boundaries. This review agrees that the exact offline predeployment package passes its bounded technical replay. Deployment remains a separate consequential effect and this result grants no authority for it.

`authority_effect: none`

## Exact subject

- Release ID: `9d3540ef8f33eb19`
- Archive: `vps/out/auth-foundation-candidate-9d3540ef8f33eb19.tar.gz`
- Archive SHA-256: `e671fc8cad5a7a1d88c41409887284071c0d29d023d4a6e70430f1f3052c9346`
- Manifest SHA-256: `2c990f68cade66f21329c2528d50e234e9e8b321d3d9538a667bbc247c186858`
- Manifest content SHA-256 before insertion of `release_id`: `9d3540ef8f33eb19de0a8b4dd3401bfde02354c91732c744b0446de0c492f2bf`
- Installer SHA-256: `fcda56bf582510c4b14797f323a632ae2015ffcd32cedc39099451cdbbbad678`
- Superseded archives were excluded from the verdict.

## Repaired installer boundaries

The first replay identified two installer defects in earlier digests. Those observations are superseded by the exact final installer named above.

Before its first host mutation, the final script verifies archive SHA-256 and pinned Node identity; rejects absolute, parent-traversal, link, and special archive members; requires the candidate manifest schema; requires the embedded manifest release ID to equal the caller argument; verifies `auth-stage` UID/GID 1000; requires both candidate roots and the unit absent; requires the stable service active; and rejects occupied candidate ports or an existing candidate Docker project. Dynamic probes confirmed that wrong-release and wrong-hash inputs exit nonzero while both candidate roots remain absent.

Immediately before the first `mkdir`, the script sets `install_committed=0` and installs its EXIT trap. Every failure before final success therefore removes the docker-group grant; stops/disables the candidate unit; downs the exact candidate Compose project when its environment exists; removes the candidate unit, `current`, and both exact candidate roots; and reloads systemd. This covers failures after extraction, payload verification, setup, service start, release-ID publication, and current-symlink publication. Only after both `release-id` and `current` exist does it set `install_committed=1` and remove the trap.

The refreshed affected-route decision and evaluation binding both contain the exact final installer digest. Binding preflight remains `ready`, `passed`, with zero findings.

## Passing findings

The archive SHA and manifest SHA match their exact selected values. The embedded manifest is byte-identical to the external manifest. All 454 declared payload files occur exactly once and match both their manifest size/digest and current source bytes. There are 455 regular archive members including `MANIFEST.json`, with no extra payload members, missing members, duplicate names, absolute or parent-traversal paths, links, or special files.

The bundle selection excludes private `.runtime` configuration, generated credentials, TLS private keys, policy, realm, evidence, screenshots, and local logs. A content scan found no complete PEM private key or literal secret assignment. The string `BEGIN PRIVATE KEY` appears only in the pinned `jose` parser implementation; it is syntax handled by the dependency, not bundled key material. `runtime-seed/browser-libs/download.log` is a package-download record and contains no detected credential value.

`src/profiles.mjs` defines stable and candidate as exact closed tuples across profile, issuer, public origin, operator origin, Compose project, three ports, and client identities. Configuration and identity entry points validate that tuple. The 19-test Node suite passed hostile mixed-profile, issuer, origin, port, project, client, unknown-profile, and legacy-stable-to-candidate cases.

`scripts/operator.mjs` rejects paths outside the selected realm and rejects origins outside the two approved operator origins before reading TLS material or opening a connection. `scripts/setup.mjs` and `scripts/fresh-smoke.mjs` pass `c.operatorOrigin`; candidate configuration is itself exact-profile validated. The hostile external-origin test confirms rejection before network access.

The candidate has separate release/current/state paths, systemd unit, Docker Compose project, named volume namespace, and loopback ports 23443, 28443, and 29443. The installer requires the stable service active before mutation, and removal requires it active after teardown. This is isolation within the declared single-host profile; the candidate intentionally shares the existing `auth-stage` Unix identity, so this evidence does not claim identity-level or independent-availability isolation.

`src/operational-evidence.mjs` enforces both conservation equations: offered equals queued plus rejected, and queued equals exported plus dropped plus pending. A completion ticket is single-use and accepts only exported or dropped. Unit controls cover a pending observation, export, rejection, zero required drops, final conservation, and double-completion rejection. The server generates a fresh UUIDv4 response correlation ID and rejects caller-supplied correlation fields.

The formal V3 artifact checksum file verifies every sealed file. Direct evaluation of the copied `V3-INVOCATION.json` with the declared kernel exactly reproduces `V3-RESULT.json`: `contract_state: satisfied`, `verified_tier: V3`, 43 passing checks, no residue, and result digest `13c147cf213e0e07889d5e255b260390513630ae9fff1b633ff0107f1a70fb5c`. The separate 13-test suite passed direct-binding tamper, provider-profile tamper, producer alias, missing obligation, survived mutation, disagreement, infrastructure, input/mutant binding, route result, denominator, and shared-infrastructure controls. This is bounded candidate evidence only; it grants no product approval, admission, release, runtime, or deployment authority.

## Commands replayed

All commands were local. None contacted the VPS.

```text
sha256sum vps/out/auth-foundation-candidate-9d3540ef8f33eb19.tar.gz vps/out/MANIFEST.json
python3 <in-memory tar/manifest/source integrity and secret scan>
TMPDIR=/tmp npm test
node --check src/*.mjs scripts/*.mjs
bash -n vps/install_candidate.sh vps/remove_candidate.sh
python3 <ast.parse of vps/build_bundle.py and validate.py>
python3 validate.py
TMPDIR=/tmp python3 -m unittest -v test_suite.py
sha256sum -c ARTIFACTS.sha256
python3 <independent EVF V3 kernel evaluate and exact-result comparison>
docker compose -p auth-foundation-candidate config --quiet
bash vps/install_candidate.sh                              # expected missing-argument refusal
bash vps/install_candidate.sh <archive> <wrong-sha> <id>  # expected pre-mutation refusal
bash vps/remove_candidate.sh                              # expected missing-argument refusal
bash vps/remove_candidate.sh independent-refusal-test     # expected absent-current refusal
```

Results: 19/19 Node tests passed; 13/13 formal replay tests passed; all 43 independently evaluated V3 checks passed with zero residue; the plan validator passed 27 nodes, 20 controls, 17 hostile controls, and 6 pipeline hostile controls; JavaScript, Python, Bash, and Compose static checks passed; every early refusal probe returned nonzero before mutation.

## Bounds

This replay inspected local source, the exact sealed archive, manifest, evaluation binding, installer/remover, affected-route decision, and copied P1 formal evidence. It did not execute a successful or post-write installer path, start services, create Docker resources, observe the stable runtime, connect to the VPS, or satisfy any remote ORODI denominator member. Late cleanup coverage is established from the exact final script's control flow and refreshed digest binding, not from a host mutation. Remote states remain `not-run`.

The initial identity calculation made while the shared package was still being finalized produced a transient mismatched value. A fresh calculation after finalization, repeated against the exact selected manifest, derived `9d3540ef8f33eb19`; the transient observation is superseded and is not a finding.

## Open Questions

- Will the authorized operator preserve the exact archive, manifest, installer, Node, host, and stable-baseline bindings at the effect boundary?
- Will every remote denominator member remain `not-run` until independently observed, rather than inheriting this offline result?
