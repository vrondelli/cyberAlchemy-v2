#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "usage: $0 <absolute-proof-json> <absolute-plan-json> <absolute-cleanup-json>" >&2
  exit 64
fi

proof_output=$1
plan_output=$2
cleanup_output=$3
for output in "$proof_output" "$plan_output" "$cleanup_output"; do
  [[ "$output" = /* ]] || { echo "all outputs must be absolute" >&2; exit 64; }
  [[ ! -e "$output" ]] || { echo "output already exists: $output" >&2; exit 64; }
done

repo_root=$(git rev-parse --show-toplevel)
cli_root="$repo_root/projects/domainspec-v2/impl/cli"
run_id="l3$(date +%s)$$"
resource_prefix="domainspec-${run_id}"
runtime_root="$cli_root/.tmp-${resource_prefix}"
postgres_image="postgres@sha256:cf78e76683b9ca8c5733cbbdce6c9262b45b6767934dd0a95e671f9a0fc20685"
nats_image="nats@sha256:777787bbb4c7c4083ec2213b0b8b14151617610a3e0d85776bd995cd46599c73"

cleanup() {
  for case_name in success failure; do
    docker container stop "${resource_prefix}-${case_name}-postgres" "${resource_prefix}-${case_name}-nats" >/dev/null 2>&1 || true
    docker container rm "${resource_prefix}-${case_name}-postgres" "${resource_prefix}-${case_name}-nats" >/dev/null 2>&1 || true
    docker volume rm "${resource_prefix}-${case_name}-pgdata" "${resource_prefix}-${case_name}-natsdata" >/dev/null 2>&1 || true
    docker network rm "${resource_prefix}-${case_name}-network" >/dev/null 2>&1 || true
  done
  if [[ -d "$runtime_root" ]]; then find "$runtime_root" -depth -delete; fi
}
trap cleanup EXIT

mkdir -p "$runtime_root"
"$repo_root/toolchains/node-typescript/bin/node-env" run --project projects/domainspec-v2/impl/cli -- \
  node --import tsx test/helpers/reference-runtime-plan.ts \
  /workspace/projects/domainspec-v2/impl/cli/examples/reconciled-commerce \
  "/workspace/projects/domainspec-v2/impl/cli/$(basename "$runtime_root")/app" >"$plan_output"
(
  cd "$runtime_root/app"
  npm ci --ignore-scripts --no-audit --no-fund >/dev/null
  npx tsc --noEmit false --outDir dist --pretty false
)

run_case() {
  local case_name=$1
  local case_output=$2
  local case_prefix="${resource_prefix}-${case_name}"
  local network_name="${case_prefix}-network"
  local pg_volume="${case_prefix}-pgdata"
  local nats_volume="${case_prefix}-natsdata"
  local pg_name="${case_prefix}-postgres"
  local nats_name="${case_prefix}-nats"
  docker network create --label "domainspec.run=$run_id" "$network_name" >/dev/null
  docker volume create --label "domainspec.run=$run_id" "$pg_volume" >/dev/null
  docker volume create --label "domainspec.run=$run_id" "$nats_volume" >/dev/null
  docker run -d --name "$pg_name" --network "$network_name" --label "domainspec.run=$run_id" \
    -e POSTGRES_USER=domainspec -e POSTGRES_PASSWORD=l3-local-only-password -e POSTGRES_DB=domainspec \
    -p 127.0.0.1::5432 -v "$pg_volume:/var/lib/postgresql/data" "$postgres_image" >/dev/null
  docker run -d --name "$nats_name" --network "$network_name" --label "domainspec.run=$run_id" \
    -p 127.0.0.1::4222 -v "$nats_volume:/data" "$nats_image" -js -sd /data >/dev/null
  for attempt in $(seq 1 40); do
    docker exec "$pg_name" pg_isready -U domainspec -d domainspec >/dev/null 2>&1 && break
    [[ "$attempt" != 40 ]] || { echo "PostgreSQL did not become ready for $case_name" >&2; exit 1; }
    sleep 0.25
  done
  local pg_port
  local nats_port
  pg_port=$(docker port "$pg_name" 5432/tcp | sed 's/.*://')
  nats_port=$(docker port "$nats_name" 4222/tcp | sed 's/.*://')
  for attempt in $(seq 1 40); do
    if (exec 4<>"/dev/tcp/127.0.0.1/$pg_port") 2>/dev/null; then exec 4>&-; break; fi
    [[ "$attempt" != 40 ]] || { echo "PostgreSQL host port did not become ready for $case_name" >&2; exit 1; }
    sleep 0.25
  done
  for attempt in $(seq 1 40); do
    if (exec 3<>"/dev/tcp/127.0.0.1/$nats_port") 2>/dev/null; then exec 3>&-; break; fi
    [[ "$attempt" != 40 ]] || { echo "NATS did not become ready for $case_name" >&2; exit 1; }
    sleep 0.25
  done
  (
    cd "$runtime_root/app"
    DATABASE_URL="postgresql://domainspec:l3-local-only-password@127.0.0.1:${pg_port}/domainspec" \
    NATS_URL="nats://127.0.0.1:${nats_port}" WEBHOOK_SECRET="l3-local-webhook-secret" \
    RUN_ID="${run_id}-${case_name}" SCENARIO_MODE="$case_name" node dist/src/reference-runtime/proof.js >"$case_output"
  )
  docker container stop "$pg_name" "$nats_name" >/dev/null
  docker container rm "$pg_name" "$nats_name" >/dev/null
  docker volume rm "$pg_volume" "$nats_volume" >/dev/null
  docker network rm "$network_name" >/dev/null
}

success_output="$runtime_root/success.json"
failure_output="$runtime_root/failure.json"
run_case success "$success_output"
run_case failure "$failure_output"
jq -s --arg run_id "$run_id" '{
  schema_version:"domainspec.reference-runtime-proof/v1-candidate",
  run_id:$run_id,
  fixture_isolation:"success-and-failure-use-distinct-postgresql-nats-http-processes",
  services:{success:.[0].services,failure:.[1].services},
  success:.[0].success,
  failures:.[1].failures,
  orodi:.[0].orodi,
  claim_ceiling:"bounded-disposable-reference-runtime-only",
  authority_effect:"none"
}' "$success_output" "$failure_output" >"$proof_output"

cleanup
trap - EXIT
containers=$(docker ps -a --filter "label=domainspec.run=$run_id" --format '{{.Names}}' | wc -l)
volumes=$(docker volume ls --filter "label=domainspec.run=$run_id" --format '{{.Name}}' | wc -l)
networks=$(docker network ls --filter "label=domainspec.run=$run_id" --format '{{.Name}}' | wc -l)
temporary_root_present=false
[[ ! -e "$runtime_root" ]] || temporary_root_present=true
if [[ "$containers" -ne 0 || "$volumes" -ne 0 || "$networks" -ne 0 || "$temporary_root_present" = true ]]; then
  echo "owned runtime residue remains" >&2
  exit 1
fi
printf '{"schema_version":"domainspec.reference-runtime-cleanup/v1-candidate","run_id":"%s","containers_remaining":0,"volumes_remaining":0,"networks_remaining":0,"temporary_root_present":false,"result":"pass","authority_effect":"none"}\n' "$run_id" >"$cleanup_output"
