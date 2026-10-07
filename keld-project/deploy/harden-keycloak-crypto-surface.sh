#!/usr/bin/env bash
set -euo pipefail
umask 077

action=${1:-}
if [[ $action != apply && $action != rollback && $action != verify ]]; then
  printf 'usage: %s apply|rollback|verify\n' "$0" >&2
  exit 2
fi

deploy_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
compose_file=${KELD_COMPOSE_FILE:-compose.staging-candidate.yaml}
state_file=$deploy_dir/.runtime/keycloak-crypto-surface.before.json
audit_dir=$(mktemp -d)
trap 'rm -rf -- "$audit_dir"' EXIT

kc() {
  docker compose --project-directory "$deploy_dir" -f "$deploy_dir/$compose_file" exec -T keycloak \
    bash -ceu '
      config="$(mktemp)"
      trap '\''rm -f "$config"'\'' EXIT
      /opt/keycloak/bin/kcadm.sh config credentials --config "$config" \
        --server http://127.0.0.1:8080 --realm master --user keld-admin \
        --password "$(< /run/secrets/keycloak_admin_password)" >/dev/null
      /opt/keycloak/bin/kcadm.sh "$@" --config "$config"
    ' keld-crypto-surface "$@"
}

required_actions() {
  kc get authentication/required-actions -r keld \
    --fields alias,name,enabled,defaultAction,priority
}

capture_surface() {
  required_actions > "$audit_dir/required-actions.json"
  kc get identity-provider/instances -r keld --fields alias,providerId,enabled \
    > "$audit_dir/identity-providers.json"
  kc get clients -r keld \
    --fields clientId,protocol,enabled,publicClient,bearerOnly,clientAuthenticatorType,attributes \
    > "$audit_dir/clients.json"
  kc get realms/keld \
    --fields browserFlow,registrationFlow,directGrantFlow,resetCredentialsFlow,clientAuthenticationFlow,dockerAuthenticationFlow,firstBrokerLoginFlow \
    > "$audit_dir/realm-bindings.json"

  local index=0
  local alias encoded
  for alias in browser registration 'direct grant' 'reset credentials' clients 'docker auth' 'first broker login'; do
    encoded=${alias// /%20}
    kc get "authentication/flows/$encoded/executions" -r keld \
      --fields displayName,providerId,requirement,authenticationFlow,flowAlias \
      > "$audit_dir/flow-$index.json"
    index=$((index + 1))
  done
}

validate_surface() {
  local expected_actions=$1
  capture_surface
  python3 - "$expected_actions" "$audit_dir" <<'PY'
import json
from pathlib import Path
import sys

expected_actions = sys.argv[1]
audit_dir = Path(sys.argv[2])
actions = json.loads((audit_dir / "required-actions.json").read_text(encoding="utf-8"))
identity_providers = json.loads((audit_dir / "identity-providers.json").read_text(encoding="utf-8"))
clients = json.loads((audit_dir / "clients.json").read_text(encoding="utf-8"))
bindings = json.loads((audit_dir / "realm-bindings.json").read_text(encoding="utf-8"))

expected_bindings = {
    "browserFlow": "browser",
    "registrationFlow": "registration",
    "directGrantFlow": "direct grant",
    "resetCredentialsFlow": "reset credentials",
    "clientAuthenticationFlow": "clients",
    "dockerAuthenticationFlow": "docker auth",
    "firstBrokerLoginFlow": "first broker login",
}
binding_drift = [
    f"{key}={bindings.get(key)!r}"
    for key, value in expected_bindings.items()
    if bindings.get(key) != value
]
if binding_drift:
    raise SystemExit("authentication-flow-binding-drift:" + ",".join(binding_drift))

flow_aliases = list(expected_bindings.values())
flows = {
    alias: json.loads((audit_dir / f"flow-{index}.json").read_text(encoding="utf-8"))
    for index, alias in enumerate(flow_aliases)
}

aliases = {item.get("alias"): item for item in actions}
required = ("webauthn-register", "webauthn-register-passwordless")
missing = [alias for alias in required if alias not in aliases]
if missing:
    raise SystemExit("required-action-missing:" + ",".join(missing))
if expected_actions == "disabled":
    enabled = [alias for alias in required if aliases[alias].get("enabled") is not False]
    if enabled:
        raise SystemExit("webauthn-required-action-enabled:" + ",".join(enabled))
if identity_providers:
    raise SystemExit("external-identity-provider-present")
non_oidc = [item.get("clientId") for item in clients if item.get("enabled") and item.get("protocol") != "openid-connect"]
if non_oidc:
    raise SystemExit("non-oidc-client-present:" + ",".join(non_oidc))
x509_clients = [
    item.get("clientId")
    for item in clients
    if item.get("enabled") and "x509" in (item.get("clientAuthenticatorType") or "").lower()
]
if x509_clients:
    raise SystemExit("x509-client-authenticator-configured:" + ",".join(x509_clients))

for alias, executions in flows.items():
    for execution in executions:
        provider = (execution.get("providerId") or "").lower()
        requirement = execution.get("requirement")
        if "webauthn" in provider and requirement != "DISABLED":
            raise SystemExit(f"webauthn-flow-execution-enabled:{alias}:{provider}")
        if "x509" in provider and requirement != "DISABLED":
            guarded_client_execution = alias == "clients" and provider == "client-x509"
            if not guarded_client_execution:
                raise SystemExit(f"x509-flow-execution-enabled:{alias}:{provider}")
print(json.dumps({
    "ok": True,
    "realm": "keld",
    "webauthnRegistration": expected_actions,
    "identityProviders": 0,
    "enabledClientProtocols": ["openid-connect"],
    "activeFlowBindings": expected_bindings,
    "x509ClientAuthenticators": 0,
    "x509ClientFlow": "guarded-by-client-configuration",
    "certificateExecutionsOutsideClientFlow": "disabled",
}, separators=(",", ":")))
PY
}

if [[ $action == apply ]]; then
  if [[ -e $state_file || -L $state_file ]]; then
    printf 'refusing to replace existing rollback state: %s\n' "$state_file" >&2
    exit 1
  fi
  validate_surface present >/dev/null
  required_actions > "$state_file"
  chmod 600 "$state_file"
  kc update authentication/required-actions/webauthn-register -r keld \
    -s enabled=false >/dev/null
  kc update authentication/required-actions/webauthn-register-passwordless -r keld \
    -s enabled=false >/dev/null
  validate_surface disabled
elif [[ $action == verify ]]; then
  validate_surface disabled
else
  if [[ ! -f $state_file || -L $state_file ]]; then
    printf 'rollback state is missing or invalid: %s\n' "$state_file" >&2
    exit 1
  fi
  mapfile -t settings < <(python3 - "$state_file" <<'PY'
import json
import sys

actions = {item["alias"]: item for item in json.load(open(sys.argv[1], encoding="utf-8"))}
for alias in ("webauthn-register", "webauthn-register-passwordless"):
    value = actions[alias]["enabled"]
    print(f"{alias}={str(value).lower()}")
PY
  )
  for setting in "${settings[@]}"; do
    alias=${setting%%=*}
    enabled=${setting#*=}
    kc update "authentication/required-actions/$alias" -r keld \
      -s "enabled=$enabled" >/dev/null
  done
  current=$(required_actions)
  python3 - "$state_file" <(printf '%s\n' "$current") <<'PY'
import json
import sys

before = {item["alias"]: item["enabled"] for item in json.load(open(sys.argv[1], encoding="utf-8"))}
after = {item["alias"]: item["enabled"] for item in json.load(open(sys.argv[2], encoding="utf-8"))}
required = ("webauthn-register", "webauthn-register-passwordless")
if any(after.get(alias) != before.get(alias) for alias in required):
    raise SystemExit("crypto-surface-rollback-verification-failed")
print(json.dumps({"ok": True, "realm": "keld", "rollback": "verified"}, separators=(",", ":")))
PY
  applied=$state_file.applied.$(date -u +%Y%m%dT%H%M%SZ)
  mv -- "$state_file" "$applied"
fi
