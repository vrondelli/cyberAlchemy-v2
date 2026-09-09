#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 5 ]]; then
  echo "usage: $0 <ssh-target> <remote-directory> <reissue-operation-id> <artifact-id> <recipient-id>" >&2
  exit 64
fi

ssh_target=$1
remote_directory=$2
operation_id=$3
artifact_id=$4
recipient_id=$5

[[ $ssh_target =~ ^[A-Za-z0-9._-]+@[A-Za-z0-9.:-]+$ ]] || {
  echo "invalid SSH target" >&2
  exit 64
}
[[ $remote_directory =~ ^/[A-Za-z0-9._/-]+$ ]] || {
  echo "invalid remote directory" >&2
  exit 64
}
[[ $operation_id =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$ ]] || {
  echo "invalid reissue operation ID" >&2
  exit 64
}
[[ $artifact_id =~ ^[0-9A-Fa-f]{64}$ ]] || {
  echo "invalid artifact ID" >&2
  exit 64
}
[[ $recipient_id =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$ ]] || {
  echo "invalid recipient ID" >&2
  exit 64
}

timeout 30 ssh \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  -o ConnectionAttempts=1 \
  -o ServerAliveInterval=5 \
  -o ServerAliveCountMax=1 \
  "$ssh_target" \
  sh -s -- "$remote_directory" "$operation_id" "$artifact_id" "$recipient_id" <<'REMOTE'
set -eu
remote_directory=$1
operation_id=$2
artifact_id=$3
recipient_id=$4
cd "$remote_directory"

timeout 15 docker compose exec -T database \
  psql -X -v ON_ERROR_STOP=1 -U kep -d kep -At \
  -v "operation_id=$operation_id" \
  -v "artifact_id=$artifact_id" \
  -v "recipient_id=$recipient_id" <<'SQL'
WITH app AS (
  SELECT state_json AS state
  FROM kep_hosted.application_state
  WHERE state_id = 1
), selected AS (
  SELECT
    state -> 'reissues' -> :'operation_id' AS reissue,
    state -> 'artifacts' -> :'artifact_id' AS artifact,
    state -> 'identities' -> :'recipient_id' AS recipient
  FROM app
)
SELECT jsonb_build_object(
  'observed_at_utc', to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'operation_id', reissue ->> 'operation_id',
  'artifact_version_id', reissue ->> 'artifact_version_id',
  'recipient_id', reissue ->> 'recipient_id',
  'previous_key_version', (reissue ->> 'previous_key_version')::bigint,
  'replacement_public_key', reissue ->> 'replacement_public_key',
  'replacement_key_version', (reissue ->> 'replacement_key_version')::bigint,
  'expected_revision', (reissue ->> 'expected_revision')::bigint,
  'status', reissue ->> 'status',
  'transaction_signature', reissue -> 'transaction_signature',
  'artifact_revision', (artifact ->> 'revision')::bigint,
  'artifact_owners', artifact -> 'owners',
  'artifact_epoch', (artifact ->> 'encryption_epoch')::bigint,
  'artifact_originator_id', artifact ->> 'originator_id',
  'artifact_policy_id', artifact ->> 'policy_id',
  'recipient_current_key_version', (recipient ->> 'encryption_key_version')::bigint,
  'recipient_wallet_public_key', recipient ->> 'wallet_public_key'
)
FROM selected;
SQL
REMOTE
