# Release and evidence

The candidate release unit is a self-contained source closure. Candidate 018 is
version `0.10.0-self-contained-candidate.7`.

## Evidence chain

1. `product.json` declares components, integrations, entrypoints, and closure
   roots.
2. `materializeProductClosure()` hashes every selected file and its mode.
3. The generated test plan assigns every test file to an owner.
4. Tests run from an isolated copy of the exact closure.
5. The failure-learning canary checks retained improvement behavior.
6. Freeze writes immutable candidate, test-receipt, and canary records.
7. Candidate inspection rematerializes the closure and rejects drift.
8. Release verification checks health, coverage, limits, metadata, secrets, and
   receipt bindings.
9. The source-distribution lifecycle drill creates and compares two normalized
   archives. It installs the archive into a disposable prefix, injects a failure,
   restores the exact closure, and verifies uninstall cleanup.

Candidate 013 binds 3,410 files and 53,860,253 bytes with closure digest
`a17912f28e834ff2e7bfd6d6de1316dcb43ac5630167cc3dcfdc9771d3c742c4`.
Its candidate digest is
`dbf8633542f3825a19b73dbb0af4506c6c27f589d9ec430539c90d77061a4b70`.
See the [Candidate 018 release note](releases/0.10.0-self-contained-candidate.7.md)
and cumulative [changelog](../CHANGELOG.md) for the reader-facing history. The
generated [`candidate-history.json`](releases/candidate-history.json) supplies
the immutable candidate identities and source-closure deltas behind that prose.

## Reproduce the checks

```sh
node bin/are.mjs doctor --json
node bin/are.mjs test
node bin/are.mjs candidate inspect --json
npm run release:verify
node docs/audit-candidate-artifact.mjs --check
```

Freeze only after changing to a new candidate identity. Existing candidate
records are immutable.

The Candidate 013 audit is a dated recoverability observation over the current
workspace and explicitly selected commits. Refresh it with `--write` only when
reviewing that historical question. The main documentation verifier validates
the stored record's candidate binding and internal accounting. It does not let
ambient sibling-checkout changes destabilize Candidate 018 documentation.

## Historical Candidate 013 limitation

Candidate 013 contains 1,554 content-addressed files from the sibling
DomainSpec compiler and 215 ignored Alch compiler build/runtime files. A
Candidate 013 artifact would have to materialize those exact 1,769 files.

The [artifact preflight](releases/candidate-013-artifact-preflight.json) now
accounts for all frozen paths. Its latest explicit snapshot finds 2,732 current
exact files and 213 exact files recoverable from selected commits. It also finds
465 unresolved files. These include 457 DomainSpec compiler outputs, six Alch
compiler outputs, and two additional DomainSpec records. Candidate 013 binds
1,436 DomainSpec compiler `dist` files but no matching `src` files. Therefore,
its own closure cannot reproduce those unresolved bytes.

Candidate 018 resolves this blocker
by eliminating those dependencies from the ARE distribution and passing the
complete suite from its isolated closure.

## Source archive lifecycle

The [Candidate 018 lifecycle receipt](releases/0.10.0-self-contained-candidate.7-lifecycle-receipt.json)
binds a reproducible `tar+gzip` archive and the disposable install, health,
gateway reconnect/restart, failure-injection, rollback and uninstall drill. The
drill also backs up, corrupts, restores and recovers the gateway-session and
Reasoning-State stores in disposable local paths. It intentionally reports
trusted signing as `NOT_RUN`. A SHA-256 checksum is not signature proof.

The release tooling also has a tested Ed25519 statement signer and verifier.
It binds Candidate 018, archive bytes, and the public-key fingerprint and rejects
tampering, wrong keys, and permissive private-key modes. No repository key is a
release identity. An owner must select and distribute the trusted public key.

Git commit `2d482cef` records the ARE source change set and Candidate 010–013
evidence lineage. It does not absorb unrelated sibling work or installed
dependencies.

## Documentation evidence

The manual is intentionally outside Candidate 018's frozen product closure, so
its changing bytes are not silently attributed to that candidate. The separate
[`release-manifest.json`](release-manifest.json) binds every selected manual
page and documentation generator. [`release-receipt.json`](release-receipt.json)
records deterministic API generation, lifecycle metadata, index reachability,
and local-link validation. Its claim is limited to documentation integrity.

## Separate effects

Candidate construction, product approval, commit, tag, push, publication,
activation, and deployment are separate actions. A passing verifier authorizes
none of them.

The selected [`release-policy.json`](release-policy.json) fixes the first
successor version/tag, supported contract families, changelog taxonomy,
correction rule, deprecation window, and no-predecessor posture. Its
[`release-policy-receipt.json`](release-policy-receipt.json) verifies the policy
against Candidate 018, its referenced contract sources, and the digest of the
latest Keld license research. The commercial offer is a paid download of the
complete software. The policy remains `SELECTED_NOT_ACTIVATED` until exact legal
terms and rights/notices are approved, a successor is frozen, and publication
is separately authorized.

The machine-readable [`license-requirements.json`](license-requirements.json)
separates the resolved commercial intent from the Candidate 018 closure
inventory. It also separates required customer materials, eight resolved owner
decisions, and the remaining qualified-review gates. Its
[`license-requirements-receipt.json`](license-requirements-receipt.json) proves
the referenced source digests and inventory counts. Neither artifact is legal
text, rights clearance, sale approval, or a license grant.

The verified [`release-owner-decisions.json`](release-owner-decisions.json)
records the ARE/Keld commercial identity, copyright owner, initial markets,
accountable roles, contacts, use restrictions, local-data posture, and license
directions. Its successor rule requires the sellable `0.10.0-rc.1` package to
remove the repository wrapper's legacy identity from customer-facing names,
paths, and product identifiers. Frozen Candidate 018 evidence remains unchanged.

The [`source-rights-inventory.json`](source-rights-inventory.json) generator
verifies the digest of every Candidate 018 file. It groups the 907 files into
134 source families, scans embedded rights markers, and binds the recorded
copyright owner assertion. Its PASS receipt means the technical inventory is complete.
Provenance and qualified rights clearance remain pending.

## Open Questions

- Which trusted signing identity will sign a future accepted archive?
- Which successor candidate will be frozen and reviewed as `0.10.0-rc.1`?
- Who will approve the final license text and distribution-rights inventory?
