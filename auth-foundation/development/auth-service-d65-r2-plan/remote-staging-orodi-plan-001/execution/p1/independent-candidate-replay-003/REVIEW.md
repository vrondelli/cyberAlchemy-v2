# Independent repaired-candidate replay 003

Verdict: **AGREE**.

Release `55c5af69059e1de6` contains the exact post-write permission repair required by live attempt 002. Under umask `0077`, the repaired sequence produces proxy configuration mode `0640` and proxy-directory mode `0750`. The final archive matches current source, and the unchanged transactional installer retains the previously reviewed release and cleanup controls.

`authority_effect: none`

## Exact identity

- Archive: `vps/out/auth-foundation-candidate-55c5af69059e1de6.tar.gz`
- Archive SHA-256: `eb23824e7ce9715cbf5d39911078a14fac68e6479f10f844b423e4c2f16a30c3`
- Manifest SHA-256: `64f96afccd11c40b77bd1e104a16685c4c0362f6954220515127ff40411c0561`
- Manifest content SHA-256 before `release_id`: `55c5af69059e1de65a80d539d9b8bc6e9e02bf444ac7ddd50992ff04a019f53f`
- Installer SHA-256: `e2fcc67073ed1aab6fbea2a7d5023d0c07f29a21b83f911fc2da9e51367692e1`
- `scripts/setup.mjs` SHA-256: `c1c94574053b06df291d0eac733d93ac48adef919fdd003e918340d2fb9edf2d`

All 454 manifest payload entries match the archive and current source bytes. The archive has 455 regular members including `MANIFEST.json`, with no missing, extra, duplicate, unsafe, linked, or special members. The embedded manifest is byte-identical to the external manifest, and three stable calculations derive the selected release ID.

## Explicit permission repair

`scripts/setup.mjs` establishes umask `0077`. Its shared `render` function now writes a generated proxy configuration with mode `0600`, then explicitly applies `chmod(target, 0o640)`. Both `nginx.conf` and `upstream.conf` use that function. Setup also explicitly applies `chmod('.runtime/proxy', 0o750)` after creating the directory.

An independent Node filesystem probe ran the same permission operations under umask `0077`. It observed:

- mode immediately after `writeFile(..., {mode: 0o600})`: `0600`
- mode after explicit `chmod(..., 0o640)`: `0640`
- directory mode after explicit `chmod(..., 0o750)`: `0750`

This closes the specific failure exposed by attempt 002: umask affects creation permissions, while the subsequent explicit `chmod` establishes the intended final permissions.

## Preserved transaction and regression checks

The installer is byte-identical to replay 002. Its archive, member, manifest/release, Node, UID/GID, root-absence, stable-service, port, and Docker-project checks remain before mutation. The commit flag and EXIT trap still cover all pre-commit failures. Cleanup restores temporary Docker membership before Compose down, removes the membership afterward, and targets only the candidate unit/current/roots.

Wrong-release, wrong-SHA, missing-argument, and absent-removal probes returned nonzero without creating candidate roots. The source test suite passed 19/19 tests. JavaScript and shell syntax, the 27-node plan validator, and all sealed P1 formal V3 artifact checksums passed.

The statement that live attempt 002 cleanup succeeded with stable active came from the caller. This replay did not access that host or independently elevate the live claim; it only confirms the unchanged cleanup implementation and digest.

## Bounds

No VPS connection was opened and no remote state was read or mutated. No successful installer or live cleanup path ran locally. Remote operational controls remain `not-run`. This review supports only the exact repaired candidate’s offline predeployment readiness; it grants no product approval, admission, release, or deployment authority.

The first manifest derivation read overlapped shared finalization and produced a transient non-selected value. After finalization, three consecutive reads derived `55c5af69059e1de6`, and a fresh 454-file archive/source comparison had zero mismatches. The transient value is superseded and is not a finding.

## Open Questions

- Does the next separately authorized live attempt observe `0750` on `.runtime/proxy` and `0640` on both generated configuration files under the deployed ownership?
- Do Nginx startup and stable-preservation probes pass with those exact deployed bytes?
