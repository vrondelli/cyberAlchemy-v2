# KELD full-state backup and restore

Date: 2026-09-20. This procedure covers the mutable state required to recover the
KELD staging application: commerce SQLite, the Keycloak PostgreSQL database, and
the KELD session PostgreSQL database. Runtime secrets remain in the separate
operator vault and are deliberately not duplicated into the state archive.

## Safety and consistency boundary

Run [backup-full-state.sh](../deploy/backup-full-state.sh) from the deployment
directory. It never stops, starts, recreates, or removes a service or volume.
It refuses existing destinations and publishes a backup only after SQLite
integrity, both PostgreSQL dump catalogs, permissions, checksums, image-ID
syntax, exact member-set validation, and the standalone offline verifier pass.

The command requires one explicit consistency mode:

- `online` uses SQLite's online backup API and independent transactionally
  consistent PostgreSQL dumps while writers may remain active. The three stores
  are not one cross-database point-in-time transaction. A restored session may
  require login again, but payment authority remains in the commerce ledger.
- `quiesced` refuses to run while `web`, `worker`, or `keycloak` is running. The
  operator owns the maintenance window and must stop and later restart those
  services separately. Use this mode for a cutover-grade recovery point.

Neither mode backs up release artifacts or the operator vault. Restore the exact
approved artifact by digest from release custody. Recover the existing secrets
from the separately encrypted vault; generating different session, OIDC, or
database credentials is not a restoration.

## Create a private server-side backup

Choose a new explicit destination under the private backup directory:

```sh
cd /opt/keld-staging
./backup-full-state.sh online \
  /opt/keld-staging/backups/full-state-YYYYMMDDTHHMMSSZ
```

For a quiesced recovery point, first place the edge in the approved maintenance
state and stop only `web`, `worker`, and `keycloak`. Confirm their actual state,
then invoke the same command with `quiesced`. The script refuses the backup if a
writer is still running. PostgreSQL must remain running so `pg_dump` can produce
the two custom-format dumps.

The published directory is mode `0700`; every file is mode `0600`. It contains:

- `commerce.db` from SQLite's backup API;
- `keycloak.dump` and `keld_sessions.dump` in PostgreSQL custom format;
- `.env`, the selected Compose file, and `keld.json`;
- `BACKUP-METADATA` with consistency mode and exact image IDs; and
- `SHA256SUMS` covering every member above.

An interrupted run leaves a private `.<name>.partial.<pid>` directory rather
than publishing an apparently complete backup. Inspect and remove only that
exact partial directory after determining why the command failed.

## Encrypt and move the backup off the VPS

Keep the age identity outside the repository and outside the VPS. Stream the
server directory directly into age so no plaintext copy is created on the
operator workstation:

```sh
ssh root@STAGING_HOST \
  'tar -C /opt/keld-staging/backups -cf - full-state-YYYYMMDDTHHMMSSZ' |
  age -R /PRIVATE/backup-age-recipient.txt \
    -o /PRIVATE/backups/keld-staging-full-state-YYYYMMDDTHHMMSSZ.tar.age
chmod 0600 /PRIVATE/backups/keld-staging-full-state-YYYYMMDDTHHMMSSZ.tar.age
```

Before relying on the archive, derive the public recipient from the private age
identity and compare it with the recipient file. Decrypt and hash every archive
member against the embedded manifest without displaying file contents. Record
the ciphertext SHA-256. Copy both ciphertext and its digest to the approved
off-site destination. The recovery identity must have an independently tested
custodian; another copy beside the ciphertext is not independent custody.

## Isolated restore acceptance

Never rehearse against the live Compose project, live network, or live volume.
Use unique restore container/network/volume names and an internal-only network.

1. Verify the ciphertext digest, decrypt into a new mode-`0700` directory, and
   run `verify_full_state_backup.py /absolute/decrypted/backup` without printing
   configuration contents. It rechecks all seven hashes, private file modes,
   exact membership, image IDs, both PostgreSQL dump signatures, runtime JSON,
   and SQLite integrity.
2. Open `commerce.db` read-only and require `PRAGMA integrity_check` to return
   exactly `ok`.
3. Start the exact approved PostgreSQL image on a new internal network and new
   empty volume. Recreate the `keycloak` and `keld_sessions` roles/databases from
   the operator vault, then restore each dump with `pg_restore`.
4. Compare bounded counts for Keycloak users/realms and KELD session schema,
   families, handles, and login transactions with the recorded source evidence.
5. Start the exact approved Keycloak and application images against only the
   restored databases and copied commerce database. Require issuer discovery,
   anonymous `GET /api/session`, application root, and one networkless worker
   maintenance cycle to pass.
6. Inspect image IDs, UIDs, read-only roots, capabilities, no-new-privileges,
   networks, and published ports. A functional restore under weaker runtime
   controls is not acceptance.
7. Remove the disposable restore resources only after recording the evidence.
   Never use a cleanup command whose resolved project, volume, network, or path
   is not the unique restore name selected in step 1.

## Current evidence

The scripted online backup
`/opt/keld-staging/backups/full-state-r9-scripted-20260920T065025Z` passed all
script checks. Its encrypted operator copy is
`/home/vlad_/.local/share/keld-staging-operator/backups/keld-staging-full-state-r9-20260920T065043Z.tar.age`,
mode `0600`, 461,112 bytes, with SHA-256
`b75dce0ae1ea8eafea4c74a21d5a3da700e38a560c40f9497d4d47e249d61d2c`.
Every expected encrypted member was streamed back through age and matched the
embedded manifest.

After the live Keycloak crypto-surface hardening, the same script produced
`/opt/keld-staging/backups/full-state-r9-post-kc-hardening-20260920T070335Z`.
Its encrypted operator copy is
`/home/vlad_/.local/share/keld-staging-operator/backups/keld-staging-full-state-r9-post-kc-hardening-20260920T070335Z.tar.age`,
mode `0600`, 461,112 bytes, with SHA-256
`e2baadb87a504405b4daffd1aa50c6765b63e4e8483e093b6245007529b5d51d`.
All seven manifest members were verified through streaming decryption without a
plaintext workstation extraction. This is the current post-hardening recovery
point; the earlier archive remains useful as a pre-change rollback point.

The deployed standalone verifier subsequently revalidated both earlier plaintext
VPS recovery points. Each has exactly eight private members, seven matching
checksums, two PostgreSQL custom-format signatures, valid recorded image IDs,
and an `ok` SQLite integrity result. New backups now run the same verifier before
their partial directory can be published.

The first live backup created under that enforced pre-publication gate is
`/opt/keld-staging/backups/full-state-r9-verified-20260920T0815Z`. The online
capture completed in two seconds and passed the verifier with eight private
members, seven checksums, two dump signatures, valid image IDs, and SQLite
integrity `ok`. Its streamed age-encrypted operator copy is
`/home/vlad_/.local/share/keld-staging-operator/backups/keld-staging-full-state-r9-verified-20260920T0815Z.tar.age`,
mode `0600`, 461,112 bytes, SHA-256
`a32ae61256231c24de6da8476c65480221cc3c464347e6599c51e7f4332e1659`.
The archive has exactly the expected nine tar entries, and all seven members in
its embedded checksum manifest matched through stream-only decryption. The
two-second measurement is backup runtime, not an RTO claim.

The earlier isolated restore of the current state reproduced seven Keycloak
users, two realms, the recorded session-table counts, 14 commerce orders, eight
payment events, issuer discovery, anonymous session state, application root, and
an exact-r9 worker cycle. This establishes a full-state isolated restore and an
off-VPS encrypted copy. It does not establish independent age-key custody,
scheduled retention, RTO/RPO, or a public traffic rollback.
