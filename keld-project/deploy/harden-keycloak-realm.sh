#!/bin/bash
set -euo pipefail
umask 077

ACTION="${1:-}"
if [[ "$ACTION" != apply && "$ACTION" != rollback && "$ACTION" != verify ]]; then
  echo "usage: $0 apply|rollback|verify" >&2
  exit 2
fi

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${KELD_COMPOSE_FILE:-compose.staging-candidate.yaml}"
STATE_FILE="$DEPLOY_DIR/.runtime/keycloak-hardening.before.json"
FIELDS="bruteForceProtected,permanentLockout,failureFactor,waitIncrementSeconds,quickLoginCheckMilliSeconds,minimumQuickLoginWaitSeconds,maxFailureWaitSeconds,maxDeltaTimeSeconds"

kc() {
  docker compose --project-directory "$DEPLOY_DIR" -f "$DEPLOY_DIR/$COMPOSE_FILE" exec -T keycloak \
    bash -ceu '
      config="$(mktemp)"
      trap '\''rm -f "$config"'\'' EXIT
      /opt/keycloak/bin/kcadm.sh config credentials --config "$config" \
        --server http://127.0.0.1:8080 --realm master --user keld-admin \
        --password "$(< /run/secrets/keycloak_admin_password)" >/dev/null
      /opt/keycloak/bin/kcadm.sh "$@" --config "$config"
    ' keld-hardening "$@"
}

validate_desired() {
  python3 -c 'import json,sys
r=json.load(sys.stdin)
expected={"bruteForceProtected":True,"permanentLockout":False,"failureFactor":5,"waitIncrementSeconds":60,"quickLoginCheckMilliSeconds":1000,"minimumQuickLoginWaitSeconds":60,"maxFailureWaitSeconds":900,"maxDeltaTimeSeconds":43200}
bad={k:{"expected":v,"actual":r.get(k)} for k,v in expected.items() if r.get(k)!=v}
if bad: raise SystemExit("realm-hardening-verification-failed:"+json.dumps(bad,separators=(",",":")))
print(json.dumps({"ok":True,"realm":"keld","bruteForceProtected":True,"rollbackStateRecorded":True},separators=(",",":")))'
}

if [[ "$ACTION" == apply ]]; then
  if [[ -e "$STATE_FILE" ]]; then
    echo "refusing to replace existing rollback state: $STATE_FILE" >&2
    exit 1
  fi
  mkdir -p "$(dirname "$STATE_FILE")"
  kc get realms/keld --fields "$FIELDS" >"$STATE_FILE"
  kc update realms/keld \
    -s bruteForceProtected=true -s permanentLockout=false -s failureFactor=5 \
    -s waitIncrementSeconds=60 -s quickLoginCheckMilliSeconds=1000 \
    -s minimumQuickLoginWaitSeconds=60 -s maxFailureWaitSeconds=900 \
    -s maxDeltaTimeSeconds=43200 >/dev/null
  kc get realms/keld --fields "$FIELDS" | validate_desired
elif [[ "$ACTION" == verify ]]; then
  kc get realms/keld --fields "$FIELDS" | validate_desired
else
  if [[ ! -f "$STATE_FILE" ]]; then
    echo "rollback state is missing: $STATE_FILE" >&2
    exit 1
  fi
  mapfile -t SETTINGS < <(python3 - "$STATE_FILE" <<'PY'
import json,sys
data=json.load(open(sys.argv[1],encoding='utf-8'))
fields=('bruteForceProtected','permanentLockout','failureFactor','waitIncrementSeconds','quickLoginCheckMilliSeconds','minimumQuickLoginWaitSeconds','maxFailureWaitSeconds','maxDeltaTimeSeconds')
for field in fields:
    value=data[field]
    if isinstance(value,bool): value=str(value).lower()
    print(f'{field}={value}')
PY
  )
  ARGS=()
  for setting in "${SETTINGS[@]}"; do ARGS+=(-s "$setting"); done
  kc update realms/keld "${ARGS[@]}" >/dev/null
  kc get realms/keld --fields "$FIELDS"
  mv "$STATE_FILE" "$STATE_FILE.applied"
fi
