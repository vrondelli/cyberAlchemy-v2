# Encrypted Durable Co-Ownership: Exact Devnet Trial

Status: setup and execution procedure; this document does not authorize any
external effect.

This procedure exercises the exact v1 vertical:

```text
definition fixture
  -> XChaCha20-Poly1305 ciphertext
  -> HPKE envelopes for A and B
  -> PostgreSQL operational + recovery + archive layers
  -> native Solana program deployment
  -> finalized A -> {A, B} grant
  -> durable retrieval and B decryption
  -> B replacement-key request
  -> A fulfillment and replacement-key decryption
  -> bounded evidence
```

The authenticated human conversation and CyberAlchemy operator workflow own
authorization. The Rust executable validates the technical envelope; it does
not claim that a field, digest, or command-line argument proves who authorized
the run. Cryptographic governance provenance is deferred in
`evidence/terminal/deferred-choices.json`.

## 1. Set local paths

Use the isolated worktree and external build/output directories:

```bash
export KEP_REPO=/home/vrondelli/projects/domainspec-core-kep-d65
export KEP_RUNTIME="$KEP_REPO/cyberAlchemy-v2/product/knowledge-exchange-protocol/runtime"
export KEP_V1="$KEP_REPO/cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/successors/encrypted-durable-devnet/v1"
export CARGO_TARGET_DIR=/tmp/ca2-kep-devnet-target
export KEP_TRIAL_ROOT=/tmp/ca2-kep-devnet-001
export KEP_SBF_DIR=/tmp/ca2-kep-sbf
export PATH="/home/vrondelli/.cache/cyberalchemy-v2/solana/v3.1.11/solana-release/bin:$PATH"
```

`KEP_TRIAL_ROOT` must be absolute, outside the repository, and nonexistent.
The preparation command deliberately refuses to overwrite an earlier attempt.

## 2. Recheck the local construction

This is local and creates no Solana effect:

```bash
cd "$KEP_REPO"
python3 "$KEP_V1/evidence/d65-loop/run.py" --repeat 2 --materialize
```

Continue only if it reports `PASS_BOUNDED`, both cycles have one runtime
digest, PostgreSQL passes twice, the exact SBF loads twice, and relation
coverage is 204/204.

An exact successor Rust binding must then be authored, independently reviewed,
and accepted by the owner. Human acceptance binds the stated implementation
and trial intent; the owner does not have to repeat a digest.

## 3. Build the exact runner and SBF

```bash
cd "$KEP_RUNTIME"
cargo build --release --locked -p cyberalchemy-kep-devnet-trial

mkdir -p "$KEP_SBF_DIR"
cargo-build-sbf \
  --manifest-path "$KEP_RUNTIME/solana-program/Cargo.toml" \
  --sbf-out-dir "$KEP_SBF_DIR"

export KEP_TRIAL_BIN="$CARGO_TARGET_DIR/release/cyberalchemy-kep-devnet-trial"
export KEP_SBF="$KEP_SBF_DIR/cyberalchemy_kep_solana_program.so"
sha256sum "$KEP_TRIAL_BIN" "$KEP_SBF"
stat --format='%n %s bytes' "$KEP_TRIAL_BIN" "$KEP_SBF"
```

Do not substitute a different `.so` after constructing the envelope.

## 4. Create every disposable identity — local credential effect

Run this only after explicitly deciding to create disposable local credentials
at `KEP_TRIAL_ROOT`. It creates seven distinct Solana keypairs, three distinct
raw X25519 HPKE keypairs, and one harmless definition fixture. Private files
are mode `0600`; no RPC call, airdrop, or deployment occurs.

```bash
"$KEP_TRIAL_BIN" prepare "$KEP_TRIAL_ROOT" \
  > "$KEP_TRIAL_ROOT-preparation-receipt.json"
jq . "$KEP_TRIAL_ROOT-preparation-receipt.json"
```

The created Solana roles are:

- `payer`: receives Devnet SOL and pays transaction/rent costs;
- `originator`: owner A and grant/reissue authority;
- `recipient`: owner B;
- `outsider`: negative signer cases;
- `program`: new program address;
- `buffer`: one-attempt native deployment buffer;
- `upgrade-authority`: isolated Devnet program authority.

The HPKE roles are originator A, recipient B, and B's replacement key B2.
These keys are never reused as Solana keys.

Inspect only public identities:

```bash
jq '.solana_public_keys' "$KEP_TRIAL_ROOT-preparation-receipt.json"
wc -c "$KEP_TRIAL_ROOT"/*.pub
```

Each `.pub` must be 32 bytes. Do not print `.key` or `.json` keypair contents.
You may replace `knowledge-definition.txt` with another test-only definition
before constructing the envelope. Never use customer or confidential material.

## 5. Start the first PostgreSQL realization — local infrastructure effect

The current binding requires a loopback PostgreSQL URL. One database contains
three separate protocol-owned schemas; the adapter creates and validates them.

```bash
export KEP_DB_CONTAINER=ca2-kep-devnet-postgres-001
export KEP_DB_PASSWORD="$(openssl rand -hex 24)"

docker run --detach --rm --pull=never \
  --name "$KEP_DB_CONTAINER" \
  --env POSTGRES_PASSWORD="$KEP_DB_PASSWORD" \
  --publish 127.0.0.1:55432:5432 \
  docker.io/library/postgres:17-alpine@sha256:18cfe3ef5e6815560c98237d6216d1e5119702fb0f3894c8785dd58b8bbe5d73

until docker exec "$KEP_DB_CONTAINER" pg_isready -U postgres; do sleep 1; done
export KEP_POSTGRES_TRIAL_URL="postgres://postgres:${KEP_DB_PASSWORD}@127.0.0.1:55432/postgres"
```

Keep the password in the current shell only. Do not put the URL in the
repository, envelope, evidence, terminal output, or chat.

## 6. Construct the exact technical envelope

Set `KEP_CANDIDATE_BINDING` from the immutable successor candidate being
tested. The Devnet result is evidence for a later admission or acceptance
decision; this field does not claim that decision already happened.

```bash
export KEP_CANDIDATE_BINDING=REPLACE_WITH_CANDIDATE_SUCCESSOR_BINDING_DIGEST
export KEP_TRIAL_BIN_SHA="$(sha256sum "$KEP_TRIAL_BIN" | awk '{print $1}')"
export KEP_SBF_SHA="$(sha256sum "$KEP_SBF" | awk '{print $1}')"
export KEP_SBF_SIZE="$(stat --format='%s' "$KEP_SBF")"
export KEP_ENVELOPE="$KEP_TRIAL_ROOT/terminal-envelope.json"

python3 - <<'PY'
import json, os
from pathlib import Path

r = Path(os.environ["KEP_TRIAL_ROOT"])
document = {
    "schema_version": 4,
    "candidate_binding_digest": os.environ["KEP_CANDIDATE_BINDING"],
    "trial_cli_sha256": os.environ["KEP_TRIAL_BIN_SHA"],
    "authorization_model": "operator-mediated-explicit-human-authorization",
    "cryptographic_governance_provenance": "deferred",
    "cluster": "solana-devnet",
    "rpc_class": "public-no-paid-fallback",
    "rpc_url": "https://api.devnet.solana.com",
    "expected_genesis_hash": "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG",
    "max_protocol_signed_transactions": 24,
    "max_deployment_signed_transactions": 192,
    "deployment_max_sign_attempts": 1,
    "funding_mode": "prefunded-only",
    "minimum_prefunded_lamports": 2_000_000_000,
    "maximum_prefunded_lamports": 10_000_000_000,
    "sbf_path": os.environ["KEP_SBF"],
    "sbf_sha256": os.environ["KEP_SBF_SHA"],
    "sbf_size_bytes": int(os.environ["KEP_SBF_SIZE"]),
    "external_inputs": {
        "payer_keypair_path": str(r / "payer.json"),
        "originator_keypair_path": str(r / "originator.json"),
        "recipient_keypair_path": str(r / "recipient.json"),
        "outsider_keypair_path": str(r / "outsider.json"),
        "program_keypair_path": str(r / "program.json"),
        "buffer_keypair_path": str(r / "buffer.json"),
        "upgrade_authority_keypair_path": str(r / "upgrade-authority.json"),
        "plaintext_fixture_path": str(r / "knowledge-definition.txt"),
        "originator_hpke_public_path": str(r / "originator-hpke.pub"),
        "originator_hpke_private_path": str(r / "originator-hpke.key"),
        "recipient_hpke_public_path": str(r / "recipient-hpke.pub"),
        "recipient_hpke_private_path": str(r / "recipient-hpke.key"),
        "replacement_hpke_public_path": str(r / "replacement-hpke.pub"),
        "replacement_hpke_private_path": str(r / "replacement-hpke.key"),
        "attempt_journal_path": str(r / "attempt-journal.jsonl"),
        "evidence_output_path": str(r / "trial-evidence.json")
    },
    "enumerated_effect_surface": [
        "external-journal-write",
        "external-terminal-evidence-write",
        "loopback-postgresql-read-write",
        "public-solana-finalized-read",
        "public-solana-transaction-submit"
    ],
    "disposable_keypairs_outside_repository": True,
    "paid_provider_fallback": False,
    "mainnet_allowed": False,
    "enumerated_case_ids": [
        "storage-three-layer-ready", "initialize-positive",
        "grant-wrong-signer", "grant-stale-revision", "grant-positive",
        "grant-finalized-fetch", "recipient-decryption",
        "reissue-request-outsider", "reissue-request-positive",
        "reissue-request-replay", "reissue-self-fulfillment",
        "reissue-fulfill-positive", "reissue-state-isolation",
        "replacement-recipient-decryption", "cost-observation"
    ]
}
Path(os.environ["KEP_ENVELOPE"]).write_text(
    json.dumps(document, indent=2, sort_keys=True) + "\n"
)
PY

chmod 600 "$KEP_ENVELOPE"
export CA2_DEVNET_PACKET_DIGEST="$(sha256sum "$KEP_ENVELOPE" | awk '{print $1}')"
```

The packet digest detects accidental envelope changes. It does not authenticate
human authorization.

## 7. Fund the disposable payer under a separate authorization

The protocol runner never requests an airdrop. Before constructing the final
trial authorization, separately authorize and fund the newly-created disposable
payer, wait for finalized balance, and preserve the funding signature as
preparation evidence. A funding failure does not consume the protocol trial
because the trial has not started.

Do not reuse a payer from a consumed or ambiguous trial. Do not place a private
key in the repository, terminal output, evidence, or chat. After funding, verify
that the finalized balance is within the envelope's minimum and maximum bounds.

## 8. Request the one explicit Devnet trial authorization

Before running the next section, ask the owner to authorize this bounded scope:

```text
Authorize one disposable Knowledge Exchange Protocol trial on public Solana
Devnet using the prepared terminal envelope. Permit the loopback PostgreSQL
connection, verification of the separately prefunded disposable payer, one
exact native SBF deployment with at most 192 signed deployment submissions and one signing
attempt per deployment transaction, at most 24 protocol submissions, the 15
enumerated cases, finalized reads, and external evidence writes. Do not permit
Mainnet, paid RPC fallback, customer material, retry after ambiguous effect,
publication, release, or reuse of these credentials.
```

The owner may approve that intent in ordinary language. They do not need to
repeat any digest. Record the decision through the CyberAlchemy operator
workflow, then verify that the envelope still describes the approved scope.

## 9. Execute exactly once — public Devnet effect

Read-only cluster check:

```bash
solana genesis-hash --url https://api.devnet.solana.com
```

It must report `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`. Then run exactly once:

```bash
cd "$KEP_RUNTIME"
"$KEP_TRIAL_BIN" "$KEP_ENVELOPE" \
  > "$KEP_TRIAL_ROOT/runner-output.json"
jq . "$KEP_TRIAL_ROOT/runner-output.json"
```

The runner itself:

- validates envelope, executable, SBF, cluster, case list and budgets;
- connects only to loopback PostgreSQL;
- verifies the disposable payer's finalized prefunded balance before storage or
  signed network effects;
- proves A, B and B2 decryptability before any signed network effect;
- stores and verifies ciphertext/envelopes in all three SQL layers;
- never requests an airdrop;
- deploys the exact SBF with the native loader in exactly one attempt;
- submits positive and negative grant/reissue cases;
- waits for finalized state and retrieves stored bytes after reconnecting; and
- writes `trial-evidence.json` without plaintext or private keys.

Do not run `solana airdrop` after the trial begins and do not separately run
`solana program deploy`; the runner owns only the bounded deployment and
protocol operations and records them in the attempt journal.

## 10. Failure and reconciliation

At the first effectful error, stop. Never rerun the execution command when
`attempt-journal.jsonl` exists. Reconcile without resubmission:

```bash
"$KEP_TRIAL_BIN" reconcile "$KEP_ENVELOPE" \
  > "$KEP_TRIAL_ROOT/reconciliation.json"
jq . "$KEP_TRIAL_ROOT/reconciliation.json"
```

Reconciliation has three bounded outcomes:

- `PENDING` when a signed transaction is not finalized, an unsigned typed
  failure is ambiguous or unclassified, or zero signatures have no explicit
  terminal pre-effect evidence;
- `PROVEN_PRE_EFFECT_STOP` only when an exact journal record proves the runner
  stopped at a recognized pre-signing rejection; and
- `RECONCILED` only when at least one recorded signature has a terminal
  finalized status and no ambiguity remains.

The parser evaluates the journal's typed `failure_stage` and `failure_class`;
zero recorded signatures can never produce `RECONCILED`. The receipt also
reports the finalized payer balance and the number of proven pre-effect stops.
Preserve the entire trial directory and request a new decision after any
non-successful execution, including `PENDING` or `PROVEN_PRE_EFFECT_STOP`. Do
not change RPC provider, recreate a key, delete the journal, or try another
deployment.

## 11. Continue a reconciled partial deployment without replay

Do not use the original terminal envelope as a retry. A continuation is a new,
separately reviewed packet with a new executable digest and candidate binding.
It preserves the predecessor envelope and reconciled journal as immutable input
and writes a separate continuation journal and evidence file.

The continuation envelope schema is
`cav2-kep-deployment-continuation-envelope/v1` in conceptual terms and is
represented by `schema_version: 1` in the runner. It binds:

- the exact predecessor terminal-envelope path, SHA-256 and packet digest;
- the exact reconciled predecessor-journal path, file SHA-256 and terminal
  record hash;
- the unchanged SBF path, SHA-256 and byte length;
- the same disposable payer, program, buffer and upgrade-authority paths;
- the first unwritten chunk index and exact remaining deployment-submission
  count;
- a new continuation journal and terminal evidence path; and
- exactly finalized reads, transaction submissions and external evidence
  writes, with zero protocol submissions and no PostgreSQL effect.

Validate the new packet without RPC, credential reads, signing or output:

```bash
export KEP_CONTINUATION_ENVELOPE="$KEP_TRIAL_ROOT/deployment-continuation-envelope.json"
export CA2_DEVNET_CONTINUATION_PACKET_DIGEST="$(sha256sum "$KEP_CONTINUATION_ENVELOPE" | awk '{print $1}')"
"$KEP_TRIAL_BIN" validate-continuation "$KEP_CONTINUATION_ENVELOPE" \
  > "$KEP_TRIAL_ROOT/deployment-continuation-validation.json"
jq . "$KEP_TRIAL_ROOT/deployment-continuation-validation.json"
```

The validation result must be `PASS_BOUNDED_NO_EFFECT`. It reconstructs
deployment progress from semantic journal effect identifiers; a transaction
count alone is never treated as a chunk offset. For the reconciled 98,016-byte
trial recorded on 2026-09-04, the proven plan is:

```text
buffer create + writes 000..055 finalized
  -> first unwritten chunk 056
  -> 72 remaining writes + 1 final deploy
  -> 73 exact additional deployment submissions
  -> 0 replayed predecessor submissions
  -> 0 protocol submissions
```

Before the first new signature, `continue-deployment` also reads the finalized
buffer account and requires the first 56 chunks to equal the exact SBF while
every unwritten byte remains zero. A gap, unexpected byte, existing program
account, authority mismatch, stale journal digest, failed or pending signature,
or changed packet blocks continuation. The runner never falls back to replay.

Execution is a distinct public-Devnet effect and requires a new exact owner
authorization permitting same-trial reuse of only these disposable deployment
credentials. When that authorization exists, the single command is:

```bash
"$KEP_TRIAL_BIN" continue-deployment "$KEP_CONTINUATION_ENVELOPE" \
  > "$KEP_TRIAL_ROOT/deployment-continuation-output.json"
```

This command performs deployment continuation only. It does not start
PostgreSQL, execute any protocol case, admit a candidate, publish, release, or
authorize a later full protocol trial.

If it stops after creating `continuation-attempt-journal-013.jsonl`, do not run
`continue-deployment` again. Under a separate reconciliation-only
authorization, inspect every recorded continuation signature without
resubmission:

```bash
"$KEP_TRIAL_BIN" reconcile-continuation "$KEP_CONTINUATION_ENVELOPE" \
  > "$KEP_TRIAL_ROOT/deployment-continuation-reconciliation.json"
```

The reconciliation command accepts the same continuation packet digest, reads
only finalized Devnet status and payer balance, appends observations to the
continuation journal, performs zero resubmissions, and still permits zero
protocol submissions. A second continuation after another partial stop would
require a newly authored packet and immutable journal-segment chain; it is not
implicitly authorized by this command.

## 12. Verify and retain evidence

```bash
jq '{result, cluster, program, funding, storage, finalized_grant_revision,
     finalized_reissue_revision, recipient_decryption,
     replacement_recipient_decryption, protocol_signed_submissions,
     knowledge_consideration_lamports}' \
  "$KEP_TRIAL_ROOT/trial-evidence.json"

sha256sum \
  "$KEP_ENVELOPE" \
  "$KEP_TRIAL_ROOT/attempt-journal.jsonl" \
  "$KEP_TRIAL_ROOT/trial-evidence.json"
```

Expected bounded observations include finalized grant and reissue revisions,
successful B and B2 decryption, three-layer storage readiness, exact remote SBF
identity, infrastructure fees/rent, and zero knowledge consideration.

Preserve the journal and evidence. Stop PostgreSQL when finished:

```bash
docker stop "$KEP_DB_CONTAINER"
unset KEP_DB_PASSWORD KEP_POSTGRES_TRIAL_URL
```

Do not delete the disposable keys until the evidence has been joined and the
final conformance decision is complete. No successful Devnet trial implies
Mainnet readiness, production security, availability, publication, or release.
