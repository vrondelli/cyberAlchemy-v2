# Hosted KEP Devnet VPS deployment candidate

This package specializes the proven co-op engine VPS pattern for the hosted
Knowledge Exchange Protocol. It is isolated at `/srv/kep-hosted-devnet`, joins
the existing `troqar_edge` network, and expects a dedicated host such as
`kep.cyberalchemize.com`. It never modifies `/srv/co-op-engine`.

The deployment contains a UI-enabled Rust service and PostgreSQL. Wallet
secrets, encryption private keys, content keys and plaintext remain in each
participant's browser. The server reads public Solana Devnet state but does not
sign or submit transactions.

## Safe local preflight

```sh
python3 deployment/validate.py
deployment/deploy-vps.sh --preflight
deployment/backup-postgres.sh --preflight
deployment/restore-postgres.sh --preflight
```

Preflight does not use SSH, credentials, DNS, RPC submission or remote Docker.
It records only `deployment/evidence/preflight.json` when `validate.py` is run
without `--no-write`.

## Read-only reissue preflight

`reissue-preflight.sh` observes one exact reissue through one batch-mode SSH
session. It validates its arguments locally, supplies SQL to `psql` over
standard input, applies local and remote timeouts, and prints one JSON record.
It does not write to PostgreSQL or submit a protocol transaction.

```sh
deployment/reissue-preflight.sh \
  root@example-vps \
  /srv/kep-hosted-devnet \
  reissue-example-001 \
  0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef \
  recipient-b
```

## Deployment gate

Remote execution is deliberately unavailable until all of these are true:

1. the KEP deployment transition exists in an admitted system ontology;
2. the exact hosted UI-and-deployment implementation binding is accepted;
3. the DNS name points to the selected VPS and Traefik owns TLS;
4. a strong database password and off-host backup envelope are selected;
5. the owner authorizes the exact deployment envelope.

The final command shape is:

```sh
CA2_KEP_DEPLOY_AUTHORIZATION=CA2-KEP-VPS-DEPLOY-001 \
KEP_DB_PASSWORD_FILE=/absolute/private/path \
KEP_BACKUP_ENVELOPE_ID=<accepted-envelope-id> \
deployment/deploy-vps.sh --execute
```

The password file must contain one line of at least 24 characters and have mode
`0600`. Its contents are placed only in a mode-`0600` run-local environment file
and the remote mode-`0600` service environment; do not put the secret in shell
history or Git.

## Recovery boundary

`backup-postgres.sh` creates a PostgreSQL custom-format dump over strict SSH,
encrypts it locally with AES-256-CBC/PBKDF2, and sends the encrypted archive and
digest to an explicitly selected off-host SCP target. The passphrase remains
local. `restore-postgres.sh` can restore only into a disposable local PostgreSQL
container; it cannot target the live database.

These scripts are candidate mechanics. A successful backup is not restore
evidence, and a disposable restore is not production recovery authority.

## Current claim ceiling

The implementation and static validation may establish local deployment
readiness. Deployment conformance remains `not_evaluable` until the missing
system-ontology predecessor is admitted and the exact implementation binding is
accepted. Nothing here authorizes SSH, DNS, deployment, backup execution,
publication, release, Mainnet, paid RPC, customer material or production use.
